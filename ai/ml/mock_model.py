"""
Mock prediction model — Python port of src/services/backend/prediction-mock.ts.

Produces deterministic, plausible outputs for a given PredictionRequest.
Used when MODEL_MODE=mock (default).
"""

import ctypes
import math

from schemas import PredictionErrorBand, PredictionPredictions, PredictionRequest, PredictionResponse


def _hash_code(s: str) -> int:
    """
    JavaScript-compatible djb2-style 32-bit hash.
    Matches the hashCode() function in prediction-mock.ts for identical seeds.
    """
    h = ctypes.c_int32(0)
    for ch in s:
        h = ctypes.c_int32((h.value << 5) - h.value + ord(ch))
    return abs(h.value)


def _seeded_random(seed: int, index: int) -> float:
    """Matches seededRandom() in prediction-mock.ts."""
    x = math.sin(seed + index) * 10000
    return x - math.floor(x)


def generate_mock_prediction(request: PredictionRequest) -> PredictionResponse:
    """
    Generate a semi-realistic mock prediction response from inputs.
    Deterministic per batch_id so the same inputs produce the same outputs.
    """
    seed = _hash_code(request.batch_id)

    def rand(i: int) -> float:
        return _seeded_random(seed, i)

    # Lower rice_polish_ratio = more polished = higher quality (30% most polished, 100% least)
    polish_factor = (100 - request.rice_polish_ratio) / 70  # 0 at 100%, 1 at 30%
    # Cooler initial temperatures favor fermentation quality (sweet spot ~10°C in 5–20°C range)
    temp_factor = 1 - abs(request.initial_temperature_c - 10) / 15
    # Moderate fermentation duration is optimal (sweet spot ~30 days in 10–120 day range)
    duration_factor = 1 - abs(request.moromi_duration_days - 30) / 90

    # predicted_quality_score: 1–5 scale
    base_quality = 1 + polish_factor * 1.5 + max(0.0, temp_factor) * 0.75 + max(0.0, duration_factor) * 0.75
    predicted_quality_score = round(min(5.0, max(1.0, base_quality + rand(0) * 0.5 - 0.25)), 2)

    estimated_final_brix = round(4 + rand(2) * 6, 2)       # 4–10 °Bx
    estimated_final_acidity = round(1.0 + rand(3) * 1.5, 2)  # 1.0–2.5
    estimated_amino_acidity = round(0.5 + rand(4) * 1.0, 2)  # 0.5–1.5
    predicted_off_flavor_probability = round(rand(8) * 0.4, 2)

    # Determine QC status and flags (machine-readable, same as live mode)
    qc_flags: list[str] = []

    if predicted_off_flavor_probability > 0.3:
        qc_flags.append("high_off_flavor_probability")
    if predicted_quality_score < 2.5 or request.koji_incubation_hours > 50:
        if request.koji_incubation_hours > 50:
            qc_flags.append("high_acidity_risk")
    if estimated_final_brix > 9:
        qc_flags.append("elevated_brix")

    qc_status = "pass" if not qc_flags else "review"

    return PredictionResponse(
        batch_id=request.batch_id,
        predictions=PredictionPredictions(
            predicted_quality_score=predicted_quality_score,
            prediction_error_band=PredictionErrorBand(
                quality_score_1to5=round(0.1 + rand(1) * 0.3, 2),
                method="mock",
            ),
            estimated_final_brix=estimated_final_brix,
            estimated_final_acidity=estimated_final_acidity,
            estimated_amino_acidity=estimated_amino_acidity,
            predicted_off_flavor_probability=predicted_off_flavor_probability,
        ),
        qc_status=qc_status,
        qc_flags=qc_flags,
        warnings=[],
        model_version="mock-1.0",
        schema_version="v0.2",
    )
