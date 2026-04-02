"""
Prediction dispatcher — loads the appropriate predictor once at startup based on MODEL_MODE.

MODEL_MODE=mock (default): uses mock_model.generate_mock_prediction()
MODEL_MODE=live:            loads a serialized sklearn pipeline from MODEL_PATH
"""

import logging
import os

from schemas import PredictionRequest, PredictionResponse

logger = logging.getLogger(__name__)

_MODEL_MODE = os.environ.get("MODEL_MODE", "mock")
_MODEL_PATH = os.environ.get("MODEL_PATH", "")

# Live predictor loaded once at startup (MODEL_MODE=live only)
_live_pipeline: object | None = None
_live_feature_names: list[str] | None = None

if _MODEL_MODE == "live":
    if not _MODEL_PATH:
        raise RuntimeError("MODEL_MODE=live requires MODEL_PATH to be set")
    try:
        import joblib

        artifact = joblib.load(_MODEL_PATH)
        _live_pipeline = artifact["pipeline"]
        metadata = artifact.get("metadata", {})
        _live_feature_names = metadata.get("feature_names")
        logger.info("Loaded live model from %s", _MODEL_PATH)
    except Exception as exc:
        raise RuntimeError(f"Failed to load model from {_MODEL_PATH}: {exc}") from exc
else:
    logger.info("Running in mock mode")


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
    Run prediction using the loaded sklearn pipeline.
    Converts the request to a DataFrame and calls pipeline.predict().
    """
    import numpy as np
    import pandas as pd

    from schemas import PredictionPredictions

    feature_dict = {
        "rice_polish_ratio": request.rice_polish_ratio,
        "koji_incubation_hours": request.koji_incubation_hours,
        "moromi_duration_days": request.moromi_duration_days,
        "initial_temperature_c": request.initial_temperature_c,
        "water_ph": request.water_ph,
        "water_hardness_ppm": request.water_hardness_ppm,
        "yeast_pitch_rate_cells_ml": request.yeast_pitch_rate_cells_ml,
    }

    if _live_feature_names is not None:
        missing = set(_live_feature_names) - set(feature_dict.keys())
        extra = set(feature_dict.keys()) - set(_live_feature_names)
        if missing or extra:
            raise ValueError(
                f"Feature mismatch: missing={missing or 'none'}, extra={extra or 'none'}"
            )

    features = pd.DataFrame([feature_dict])

    result: np.ndarray = _live_pipeline.predict(features)  # type: ignore[union-attr]
    row = result[0]

    return PredictionResponse(
        batch_id=request.batch_id,
        predictions=PredictionPredictions(
            predicted_quality_score=float(row[0]),
            prediction_error_band=float(row[1]),
            estimated_final_brix=float(row[2]),
            estimated_final_acidity=float(row[3]),
            estimated_amino_acidity=float(row[4]),
            predicted_texture_astringency=float(row[5]),
            predicted_alcohol_burn_intensity=float(row[6]),
            predicted_floral_probability=float(row[7]),
            predicted_off_flavor_probability=float(row[8]),
        ),
        qc_status="live",
        qc_flags=[],
        model_version=os.path.basename(_MODEL_PATH),
        schema_version="v0.2",
    )
