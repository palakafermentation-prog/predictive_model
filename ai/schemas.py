"""
Pydantic schemas matching the v0.2 prediction schema (packages/shared-schemas/src/prediction.ts).
Field names and validation constraints mirror the Zod schema exactly.
"""

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    batch_id: str = Field(min_length=1, max_length=100)
    rice_polish_ratio: float = Field(ge=30, le=100)
    koji_incubation_hours: float = Field(ge=12, le=60)
    moromi_duration_days: float = Field(ge=10, le=120)
    initial_temperature_c: float = Field(ge=5, le=20)
    water_ph: float = Field(ge=3.0, le=8.0)
    water_hardness_ppm: float = Field(ge=5, le=100)
    yeast_pitch_rate_cells_ml: float = Field(gt=0)


class PredictionPredictions(BaseModel):
    predicted_quality_score: float
    prediction_error_band: float
    estimated_final_brix: float
    estimated_final_acidity: float
    estimated_amino_acidity: float
    predicted_texture_astringency: float
    predicted_alcohol_burn_intensity: float
    predicted_floral_probability: float
    predicted_off_flavor_probability: float


class PredictionResponse(BaseModel):
    batch_id: str
    predictions: PredictionPredictions
    qc_status: str
    qc_flags: list[str]
    model_version: str | None = None
    schema_version: str | None = None


class PredictionError(BaseModel):
    error: str
    field: str
    message: str
