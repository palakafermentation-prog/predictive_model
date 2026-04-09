import type { PredictionRequest, PredictionResponse } from "@pferm/shared-schemas";

/**
 * Simple hash from batch_id to get deterministic pseudo-random values
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate a semi-realistic mock prediction response from inputs.
 * Deterministic per batch_id so the same inputs produce the same outputs.
 */
export function generateMockPrediction(input: PredictionRequest): PredictionResponse {
  const seed = hashCode(input.batch_id);
  const rand = (i: number) => seededRandom(seed, i);

  // Lower rice_polish_ratio = more polished = higher quality (30% most polished, 100% least)
  const polishFactor = (100 - input.rice_polish_ratio) / 70; // 0 at 100%, 1 at 30%
  // Cooler initial temperatures favor fermentation quality (sweet spot ~10°C in 5–20°C range)
  const tempFactor = 1 - Math.abs(input.initial_temperature_c - 10) / 15;
  // Moderate fermentation duration is optimal (sweet spot ~30 days in 10–120 day range)
  const durationFactor = 1 - Math.abs(input.moromi_duration_days - 30) / 90;

  // predicted_quality_score: 1–5 scale
  const baseQuality = 1 + polishFactor * 1.5 + Math.max(0, tempFactor) * 0.75 + Math.max(0, durationFactor) * 0.75;
  const predicted_quality_score = Math.round(Math.min(5, Math.max(1, baseQuality + rand(0) * 0.5 - 0.25)) * 100) / 100;

  const estimated_final_brix = Math.round((4 + rand(2) * 6) * 100) / 100; // 4–10 °Bx
  const estimated_final_acidity = Math.round((1.0 + rand(3) * 1.5) * 100) / 100; // 1.0–2.5
  const estimated_amino_acidity = Math.round((0.5 + rand(4) * 1.0) * 100) / 100; // 0.5–1.5
  const predicted_off_flavor_probability = Math.round(rand(8) * 0.4 * 100) / 100;
  const predicted_texture_astringency = Math.round((1.0 + rand(9) * 3.0) * 100) / 100;
  const predicted_alcohol_burn_intensity = Math.round((1.0 + rand(10) * 3.0) * 100) / 100;
  const predicted_floral_probability = Math.round(rand(11) * 0.8 * 10000) / 10000;

  // Determine QC status and flags (machine-readable, same as live mode)
  const qc_flags: string[] = [];

  if (predicted_off_flavor_probability > 0.3) {
    qc_flags.push("high_off_flavor_probability");
  }
  if (input.koji_incubation_hours > 50) {
    qc_flags.push("high_acidity_risk");
  }
  if (estimated_final_brix > 9) {
    qc_flags.push("elevated_brix");
  }

  const qc_status = qc_flags.length === 0 ? "pass" : "review";

  return {
    batch_id: input.batch_id,
    predictions: {
      predicted_quality_score,
      prediction_error_band: {
        quality_score_1to5: Math.round((0.1 + rand(1) * 0.3) * 100) / 100,
        method: "mock",
      },
      estimated_final_brix,
      estimated_final_acidity,
      estimated_amino_acidity,
      predicted_off_flavor_probability,
      predicted_texture_astringency,
      predicted_alcohol_burn_intensity,
      predicted_floral_probability,
    },
    qc_status,
    qc_flags,
    warnings: [],
    model_version: "mock-1.0",
    schema_version: "v0.2",
  };
}
