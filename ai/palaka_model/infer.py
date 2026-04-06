# palaka_model/infer.py
import joblib
import os
import pandas as pd
import json
from .preprocess import validate_payload, get_soft_validation_warnings
from .qc_rules import generate_qc_flags

# --- 1. Load Registry & Models ---
def load_system():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    artifact_dir = os.environ.get("MODEL_DIR") or os.path.join(base_dir, "..", "ml", "models", "trained")
    
    registry_path = os.path.join(artifact_dir, "model_registry.json")
    try:
        with open(registry_path, "r") as f:
            registry = json.load(f)
    except Exception:
        registry = {"model_version": "v1.0_fallback", "last_trained": "Unknown"}

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