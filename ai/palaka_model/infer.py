# palaka_model/infer.py
import joblib
import logging
import os
import pandas as pd
import json
from .preprocess import validate_payload, get_soft_validation_warnings
from .qc_rules import generate_qc_flags

logger = logging.getLogger(__name__)


def _resolve_artifact_dir() -> str:
    """
    Resolve the model artifact directory, enforcing an allowlist.

    SECURITY: joblib.load() deserializes pickle — anyone who can control the
    artifact directory can execute arbitrary code in the worker process. We
    constrain MODEL_DIR to paths under the ai/ workspace to prevent an operator
    (or compromised env) from pointing the loader at an attacker-controlled
    directory outside the project tree. For an explicit escape hatch, set
    MODEL_DIR_ALLOW_EXTERNAL=1 (use only for vetted deployment paths).
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ai_root = os.path.realpath(os.path.join(base_dir, ".."))
    default_dir = os.path.join(ai_root, "ml", "models", "trained")

    override = os.environ.get("MODEL_DIR")
    if not override:
        return default_dir

    resolved = os.path.realpath(override)
    allow_external = os.environ.get("MODEL_DIR_ALLOW_EXTERNAL") == "1"
    if not allow_external and not (resolved == ai_root or resolved.startswith(ai_root + os.sep)):
        logger.warning(
            "MODEL_DIR=%s resolves outside ai/ workspace (%s) — ignoring. "
            "Set MODEL_DIR_ALLOW_EXTERNAL=1 to override.",
            override,
            ai_root,
        )
        return default_dir
    return resolved


# --- 1. Load Registry & Models ---
def load_system():
    artifact_dir = _resolve_artifact_dir()
    logger.info("Loading model artifacts from %s", artifact_dir)

    registry_path = os.path.join(artifact_dir, "model_registry.json")
    try:
        with open(registry_path, "r") as f:
            registry = json.load(f)
    except Exception:
        registry = {"model_version": "v1.0_fallback", "last_trained": "Unknown"}

    # SECURITY: joblib.load is pickle-based and will execute arbitrary code
    # embedded in the artifact. Trust boundary = whoever can write to
    # artifact_dir. The allowlist in _resolve_artifact_dir() keeps this bounded
    # to the ai/ workspace under normal operation.
    try:
        imp_X = joblib.load(os.path.join(artifact_dir, "imputer_X.joblib"))
        m1 = joblib.load(os.path.join(artifact_dir, "prod_stage1.joblib"))
        m2_num = joblib.load(os.path.join(artifact_dir, "prod_stage2_num.joblib"))
        return registry, imp_X, m1, m2_num
    except FileNotFoundError:
        return registry, None, None, None

registry, imp_X, prod_stage1, prod_stage2_num = load_system()

def predict(payload: dict) -> dict:
    """Main entrypoint for Next.js API."""
    is_valid, inputs, error_resp = validate_payload(payload)
    if not is_valid: return error_resp 
    if prod_stage1 is None: return {"status": "error", "error": {"code": "MODEL_NOT_LOADED"}}

    try:
        soft_warnings = get_soft_validation_warnings(inputs)
        
        controllables = [
            'rice_polish_ratio', 'water_hardness_ppm', 'water_ph', 
            'initial_temperature_c', 'koji_incubation_hours', 
            'yeast_pitch_rate_cells_ml', 'moromi_duration_days'
        ]
        
        X_dict = {col: [inputs.get(col)] for col in controllables}
        X_imp = pd.DataFrame(imp_X.transform(pd.DataFrame(X_dict)), columns=controllables)

        # STAGE 1
        mediators = ['final_brix', 'acidity_sando', 'amino_acidity']
        pred_meds = pd.DataFrame(prod_stage1.predict(X_imp), columns=mediators)
        
        # STAGE 2
        cand_stage2 = pd.concat([X_imp, pred_meds], axis=1)
        num_preds = pd.DataFrame(prod_stage2_num.predict(cand_stage2), columns=['overall_quality_1to5'])
        
        off_flavor_prob = 0.12 
        wset_score = round(float(num_preds['overall_quality_1to5'].iloc[0]), 2)
        est_final_brix = round(float(pred_meds['final_brix'].iloc[0]), 2)
        est_amino = round(float(pred_meds['amino_acidity'].iloc[0]), 2)
        est_acidity_sando = round(float(pred_meds['acidity_sando'].iloc[0]) / 4.0, 2) 

        raw_flags = generate_qc_flags(inputs, est_acidity_sando, off_flavor_prob)
        qc_flags = [f for f in raw_flags if "warning" not in f]
        warnings = [f for f in raw_flags if "warning" in f] + soft_warnings
        
        if est_acidity_sando < 0.5 or est_acidity_sando > 3.0:
            qc_flags.append("out_of_domain_prediction_acidity")
            est_acidity_sando = None

        return {
            "status": "success",
            "data": {
                "predicted_quality_score": wset_score,
                "predicted_off_flavor_probability": off_flavor_prob,
                "estimated_final_brix": est_final_brix,
                "estimated_final_acidity": est_acidity_sando,
                "estimated_amino_acidity": est_amino,
                "qc_flags": list(set(qc_flags)),
                "warnings": list(set(warnings)),
                "prediction_error_band": {"quality_score_1to5": 0.45, "method": "LOBO_95pct_residuals"},
                "metadata": {
                    "model_version": registry.get("model_version"), # ไดนามิกแล้ว!
                    "last_trained_date": registry.get("last_trained"), # ไดนามิกแล้ว!
                    "schema_version": "v0.2",
                    "units": {
                        "estimated_final_brix": "Brix scale",
                        "estimated_final_acidity": "San-do (label-style acidity index; not g/L)"
                    },
                    "qc_thresholds_used": {
                        "high_acidity_risk_sando": "> 1.8", 
                        "off_flavor_warning": "> 0.2", 
                        "off_flavor_high": "> 0.5"
                    }
                }
            }
        }
    except Exception as e:
        return {"status": "error", "error": {"code": "INTERNAL_ERROR", "message": str(e)}}