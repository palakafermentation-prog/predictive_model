import { z } from "zod/v4";

// --- Request Schema ---

export const PredictionRequestSchema = z.object({
  batch_id: z.string().min(1, "Batch ID is required").max(100, "Batch ID too long"),
  Rice_Polish_Ratio: z.number({ message: "Polish Ratio is required" }).min(1, "Min 1%").max(100, "Max 100%"),
  Water_Hardness_ppm: z.number({ message: "Hardness is required" }).min(0, "Min 0 ppm").max(500, "Max 500 ppm"),
  Water_pH: z.number({ message: "pH is required" }).min(3, "Min 3").max(10, "Max 10"),
  Koji_Incubation_Temp_C: z.number({ message: "Incubation Temp is required" }).min(15, "Min 15°C").max(50, "Max 50°C"),
  Koji_Incubation_Hours: z.number({ message: "Incubation Hours is required" }).min(10, "Min 10 hrs").max(55, "Max 55 hrs"),
  Yeast_Pitch_Rate_cells_mL: z.number({ message: "Pitch Rate is required" }).min(1_000_000, "Min 1,000,000").max(1_000_000_000, "Max 1,000,000,000"),
  Moromi_Duration_Days: z.number({ message: "Duration is required" }).min(10, "Min 10 days").max(60, "Max 60 days"),
  Initial_Temperature_C: z.number({ message: "Initial Temp is required" }).min(0, "Min 0°C").max(30, "Max 30°C"),
});

// --- Response Schema ---

export const PredictionPredictionsSchema = z.object({
  quality_score: z.number(),
  quality_score_error_band: z.number(),
  residual_sugar: z.number(),
  acidity: z.number(),
  amino_acidity: z.number(),
  astringency: z.number(),
  alcohol_intensity: z.number(),
  fruity_prob: z.number(),
  floral_prob: z.number(),
  off_flavor_prob: z.number(),
});

export const PredictionResponseSchema = z.object({
  batch_id: z.string(),
  predictions: PredictionPredictionsSchema,
  qc_status: z.string(),
  qc_flags: z.array(z.string()),
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
