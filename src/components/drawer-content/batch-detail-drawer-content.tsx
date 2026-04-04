"use client";

import * as React from "react";
import { getBatch } from "@/services/frontend/batch";
import { PredictionResults } from "@/components/prediction-results";
import type { BatchDetail } from "@pferm/shared-schemas";

interface BatchDetailDrawerContentProps {
  id: string;
}

const PARAMETER_LABELS: Record<string, string> = {
  rice_polish_ratio: "Polish Ratio (%)",
  water_hardness_ppm: "Water Hardness (ppm)",
  water_ph: "Water pH",
  koji_incubation_hours: "Koji Incubation Hours",
  yeast_pitch_rate_cells_ml: "Yeast Pitch Rate (cells/mL)",
  moromi_duration_days: "Moromi Duration (days)",
  initial_temperature_c: "Initial Temperature (°C)",
};

export default function BatchDetailDrawerContent({ id }: BatchDetailDrawerContentProps) {
  const [batch, setBatch] = React.useState<BatchDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getBatch(id)
      .then(setBatch)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load batch"));
  }, [id]);

  if (error) {
    return (
      <div role="alert" className="rounded-md bg-destructive/10 border border-destructive p-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!batch) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="space-y-4"
      >
        <span className="sr-only">Loading batch details…</span>
        <div
          aria-hidden="true"
          className="h-6 w-32 bg-muted rounded animate-pulse motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="h-40 bg-muted rounded animate-pulse motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="h-40 bg-muted rounded animate-pulse motion-reduce:animate-none"
        />
      </div>
    );
  }

  // Convert BatchDetail to PredictionResponse shape for PredictionResults
  const predictionResponse = {
    batch_id: batch.batchId,
    predictions: batch.predictions,
    qc_status: batch.qcStatus,
    qc_flags: batch.qcFlags,
    warnings: [],
    model_version: batch.modelVersion ?? undefined,
    schema_version: batch.schemaVersion ?? undefined,
  };

  return (
    <div className="space-y-6">
      {/* Parameters — read-only display */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Parameters
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          {Object.entries(batch.parameters as Record<string, number>).map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs text-muted-foreground">
                {PARAMETER_LABELS[key] ?? key}
              </dt>
              <dd className="text-sm font-medium font-mono">
                {typeof value === "number" && key === "yeast_pitch_rate_cells_ml"
                  ? value.toLocaleString()
                  : value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-t pt-6">
        <PredictionResults response={predictionResponse} headingLevel="h3" />
      </div>
    </div>
  );
}
