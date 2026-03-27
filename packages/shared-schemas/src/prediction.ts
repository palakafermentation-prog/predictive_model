import { z } from "zod/v4";

// --- Request Schema ---

export const PredictionRequestSchema = z.object({
  batch_id: z.string().min(1, "Batch ID is required").max(100, "Batch ID too long"),
  rice_polish_ratio: z.number({ message: "Polish Ratio is required" }).min(30, "Min 30%").max(90, "Max 90%"),
  koji_incubation_hours: z.number({ message: "Incubation Hours is required" }).min(12, "Min 12 hrs").max(60, "Max 60 hrs"),
  moromi_duration_days: z.number({ message: "Duration is required" }).min(15, "Min 15 days").max(45, "Max 45 days"),
  initial_temperature_c: z.number({ message: "Initial Temp is required" }).min(5, "Min 5°C").max(20, "Max 20°C"),
  water_ph: z.number({ message: "pH is required" }).min(3.0, "Min 3.0").max(8.0, "Max 8.0"),
  water_hardness_ppm: z.number({ message: "Hardness is required" }).min(5, "Min 5 ppm").max(100, "Max 100 ppm"),
  yeast_pitch_rate_cells_ml: z.number({ message: "Pitch Rate is required" }).positive("Must be positive"),
});

// --- Response Schema ---

export const PredictionPredictionsSchema = z.object({
  predicted_quality_score: z.number(),
  prediction_error_band: z.number(),
  estimated_final_brix: z.number(),
  estimated_final_acidity: z.number(),
  estimated_amino_acidity: z.number(),
  predicted_texture_astringency: z.number(),
  predicted_alcohol_burn_intensity: z.number(),
  predicted_floral_probability: z.number(),
  predicted_off_flavor_probability: z.number(),
});

export const PredictionResponseSchema = z.object({
  batch_id: z.string(),
  predictions: PredictionPredictionsSchema,
  qc_status: z.string(),
  qc_flags: z.array(z.string()),
  model_version: z.string(),
  schema_version: z.string(),
});

// --- Error Schema (422) ---

export const PredictionErrorSchema = z.object({
  error: z.string(),
  field: z.string(),
  message: z.string(),
});

// --- Types ---

export type PredictionRequest = z.infer<typeof PredictionRequestSchema>;
export type PredictionPredictions = z.infer<typeof PredictionPredictionsSchema>;
export type PredictionResponse = z.infer<typeof PredictionResponseSchema>;
export type PredictionError = z.infer<typeof PredictionErrorSchema>;
