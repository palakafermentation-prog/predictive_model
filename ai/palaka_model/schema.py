# palaka_model/schema.py
from __future__ import annotations

from typing import Optional, List, Literal
from pydantic import BaseModel, Field, AliasChoices

# ---------------------------------------------------------
# GLOBAL CONSTANTS
# ---------------------------------------------------------
SCHEMA_VERSION = "v0.2"
ACIDITY_UNIT = "San-do (label-style index; not g/L)"
ERROR_BAND_QUALITY = 0.45

QC_THRESHOLDS = {
    "high_acidity_sando": 1.8,
    "off_flavor_warning": 0.2,
    "off_flavor_high_risk": 0.5,
}

# ---------------------------------------------------------
# Tier-3 / time-series point schemas
# ---------------------------------------------------------
class TimeSeriesPoint(BaseModel):
    """
    Generic time-series point for sensor/spot series.
    timestamp: ISO-8601 string recommended (e.g., "2026-04-02T15:33:11Z")
    value: numeric measurement value
    unit: optional (e.g., "pH", "C", "Brix")
    """
    timestamp: str
    value: float
    unit: Optional[str] = None


class CO2Point(BaseModel):
    """
    CO2 proxy point that can accept either mass-loss (bench scale) or CO2 volume (larger scale).
    unit must be one of:
      - "mass_loss_g"
      - "co2_volume_L"
    """
    timestamp: str
    value: float
    unit: Literal["mass_loss_g", "co2_volume_L"]


# ---------------------------------------------------------
# Request schema
# ---------------------------------------------------------
class ModelInputs(BaseModel):
    # Tier 2: Core Process (lenient for inference / imputation)
    rice_polish_ratio: Optional[float] = Field(
        default=None,
        description="Rice polish ratio (% remaining). Expected 30–100.",
    )
    koji_incubation_hours: Optional[float] = Field(
        default=None,
        description="Koji incubation hours. Expected ~12–60.",
    )
    moromi_duration_days: Optional[float] = Field(
        default=None,
        description="Moromi duration days. Expected 10–120.",
    )
    initial_temperature_c: Optional[float] = Field(
        default=None,
        description="Initial fermentation temperature (°C). Expected ~5–20.",
    )
    water_ph: Optional[float] = Field(
        default=None,
        description="Water pH. Expected ~3.0–8.0 (soft validation).",
    )
    water_hardness_ppm: Optional[float] = Field(
        default=None,
        description="Water hardness (ppm). Expected ~5–100 (soft validation).",
    )
    yeast_pitch_rate_cells_ml: Optional[float] = Field(
        default=None,
        description="Yeast pitch rate (cells/mL). Positive numeric.",
    )

    # Tier 1: Label-readable metadata
    abv_pct: Optional[float] = Field(
        default=None,
        validation_alias=AliasChoices("abv_pct", "abv_percent"),
    )
    smv: Optional[float] = Field(
        default=None,
        description="SMV / Nihonshudo. Expected -15..+15.",
    )
    acidity_sando: Optional[float] = Field(
        default=None,
        description="Label-reported San-do (not g/L). Expected ~1.0–2.4.",
    )
    moto_type: Optional[str] = Field(default=None)
    yeast_if_stated: Optional[str] = Field(default=None)

    # Tier 3: accepted placeholders / future-ready inputs
    co2_weight_loss_timeseries: Optional[List[CO2Point]] = Field(
        default=None,
        description='CO2 proxy series. Each point has unit in {"mass_loss_g","co2_volume_L"}.',
    )
    ph_timeseries: Optional[List[TimeSeriesPoint]] = Field(
        default=None,
        description="Continuous/spot pH series (timestamp,value[,unit]).",
    )

    koji_coverage_score: Optional[int] = Field(
        default=None,
        ge=1,
        le=5,
        description="Koji coverage score (rubric 1–5).",
    )
    koji_color_score: Optional[int] = Field(
        default=None,
        ge=1,
        le=3,
        description="Koji color/maturity score (rubric 1–3).",
    )
    koji_uniformity_score: Optional[int] = Field(
        default=None,
        ge=1,
        le=3,
        description="Koji uniformity score (rubric 1–3).",
    )


class PredictRequest(BaseModel):
    record_tier: Literal[1, 2, 3] = Field(
        ...,
        description="1: Inverse-only (Tier1), 2: Process (Tier2), 3: Sensor (Tier3).",
    )
    inputs: ModelInputs


# ---------------------------------------------------------
# Response schema
# ---------------------------------------------------------
class InferenceResponse(BaseModel):
    predicted_quality_score: float

    # Reintroduced into Phase 1 output contract
    predicted_texture_astringency: float
    predicted_alcohol_burn_intensity: float
    predicted_floral_probability: float

    predicted_off_flavor_probability: float
    estimated_final_brix: float
    estimated_final_acidity: float = Field(..., description=ACIDITY_UNIT)
    estimated_amino_acidity: float

    qc_flags: List[str] = Field(default_factory=list)
    prediction_error_band: str
    model_version: str
    schema_version: str = SCHEMA_VERSION


# ---------------------------------------------------------
# Canonical Keys List
# ---------------------------------------------------------
INPUT_FIELDS = [
    "rice_polish_ratio",
    "water_hardness_ppm",
    "water_ph",
    "initial_temperature_c",
    "koji_incubation_hours",
    "yeast_pitch_rate_cells_ml",
    "moromi_duration_days",
]