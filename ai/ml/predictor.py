"""
Prediction dispatcher — routes to mock or live model based on MODEL_MODE.

MODEL_MODE=mock (default): uses mock_model.generate_mock_prediction()
MODEL_MODE=live:            dispatches to palaka_model.infer.predict()
"""

import logging
import os

from schemas import PredictionErrorBand, PredictionMetadata, PredictionPredictions, PredictionRequest, PredictionResponse

logger = logging.getLogger(__name__)

_MODEL_MODE = os.environ.get("MODEL_MODE", "mock")


def predict(request: PredictionRequest) -> PredictionResponse:
    """Dispatch prediction to mock or live model."""
    if _MODEL_MODE == "live":
        return _predict_live(request)
    return _predict_mock(request)


def _predict_mock(request: PredictionRequest) -> PredictionResponse:
    from ml.mock_model import generate_mock_prediction

    return generate_mock_prediction(request)


def _predict_live(request: PredictionRequest) -> PredictionResponse:
    """
    Dispatch to palaka_model.infer.predict().
    Wraps the flat PredictionRequest fields into the {record_tier, inputs} payload
    format expected by palaka_model, then translates the response dict to PredictionResponse.
    """
    from palaka_model import infer as palaka_infer

    payload = {
        "record_tier": 2,
        "inputs": {
            "rice_polish_ratio": request.rice_polish_ratio,
            "koji_incubation_hours": request.koji_incubation_hours,
            "moromi_duration_days": request.moromi_duration_days,
            "initial_temperature_c": request.initial_temperature_c,
            "water_ph": request.water_ph,
            "water_hardness_ppm": request.water_hardness_ppm,
            "yeast_pitch_rate_cells_ml": request.yeast_pitch_rate_cells_ml,
        },
    }

    result = palaka_infer.predict(payload)

    if result.get("status") == "error":
        err = result.get("error", {})
        raise RuntimeError(f"palaka_model error [{err.get('code')}]: {err.get('message', '')}")

    data = result["data"]

    qc_flags: list[str] = data.get("qc_flags", [])
    qc_status = "pass" if not qc_flags else "review"

    error_band_raw = data.get("prediction_error_band", {})
    error_band = PredictionErrorBand(
        quality_score_1to5=error_band_raw.get("quality_score_1to5", 0.0),
        method=error_band_raw.get("method", ""),
    )

    metadata_raw = data.get("metadata", {})
    metadata = PredictionMetadata(
        model_version=metadata_raw.get("model_version"),
        last_trained_date=metadata_raw.get("last_trained_date"),
        schema_version=metadata_raw.get("schema_version", "v0.2"),
        units=metadata_raw.get("units"),
        qc_thresholds_used=metadata_raw.get("qc_thresholds_used"),
    )

    return PredictionResponse(
        batch_id=request.batch_id,
        predictions=PredictionPredictions(
            predicted_quality_score=data["predicted_quality_score"],
            prediction_error_band=error_band,
            estimated_final_brix=data["estimated_final_brix"],
            estimated_final_acidity=data.get("estimated_final_acidity"),
            estimated_amino_acidity=data["estimated_amino_acidity"],
            predicted_off_flavor_probability=data["predicted_off_flavor_probability"],
        ),
        qc_status=qc_status,
        qc_flags=qc_flags,
        warnings=data.get("warnings", []),
        model_version=metadata_raw.get("model_version"),
        schema_version=metadata_raw.get("schema_version", "v0.2"),
        metadata=metadata,
    )
