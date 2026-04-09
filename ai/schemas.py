"""
Pydantic schemas matching the v0.2 prediction schema (packages/shared-schemas/src/prediction.ts).
Field names and validation constraints mirror the Zod schema exactly.
"""

from typing import Optional

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    batch_id: str = Field(min_length=1, max_length=100)
    rice_polish_ratio: float = Field(ge=30, le=100)
    koji_incubation_hours: float = Field(ge=12, le=60)
    moromi_duration_days: float = Field(ge=10, le=120)
    initial_temperature_c: float = Field(ge=5, le=20)
    water_ph: float = Field(ge=3.0, le=8.0)
    water_hardness_ppm: float = Field(ge=5, le=100)
    yeast_pitch_rate_cells_ml: Optional[float] = Field(default=None, gt=0)
    rice_variety: Optional[str] = Field(default=None, max_length=100)
    yeast_strain: Optional[str] = Field(default=None, max_length=100)


class PredictionErrorBand(BaseModel):
    quality_score_1to5: float
    method: str


class PredictionMetadata(BaseModel):
    model_version: Optional[str] = None
    last_trained_date: Optional[str] = None
    schema_version: str = "v0.2"
    units: Optional[dict[str, str]] = None
    qc_thresholds_used: Optional[dict[str, str]] = None


class PredictionPredictions(BaseModel):
    predicted_quality_score: float
    prediction_error_band: PredictionErrorBand
    estimated_final_brix: float
    estimated_final_acidity: Optional[float]
    estimated_amino_acidity: float
    predicted_off_flavor_probability: float
    predicted_texture_astringency: Optional[float] = None
    predicted_alcohol_burn_intensity: Optional[float] = None
    predicted_floral_probability: Optional[float] = None


class PredictionResponse(BaseModel):
    batch_id: str
    predictions: PredictionPredictions
    qc_status: str
    qc_flags: list[str]
    warnings: list[str] = []
    model_version: Optional[str] = None
    schema_version: Optional[str] = None
    metadata: Optional[PredictionMetadata] = None


class PredictionError(BaseModel):
    error: str
    field: str
    message: str
