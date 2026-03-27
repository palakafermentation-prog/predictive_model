"use client";

import type { PredictionResponse } from "@pferm/shared-schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QcStatusBanner } from "@/components/ui/qc-status-banner";

interface PredictionResultsProps {
  response: PredictionResponse;
}

const MEDIATOR_FIELDS = [
  { key: "estimated_final_brix", label: "Final Brix" },
  { key: "estimated_final_acidity", label: "Acidity" },
  { key: "estimated_amino_acidity", label: "Amino Acidity" },
  { key: "predicted_texture_astringency", label: "Texture Astringency" },
  { key: "predicted_alcohol_burn_intensity", label: "Alcohol Burn Intensity" },
] as const;

const PROBABILITY_FIELDS = [
  { key: "predicted_floral_probability", label: "Floral" },
  { key: "predicted_off_flavor_probability", label: "Off-Flavor" },
] as const;

export function PredictionResults({ response }: PredictionResultsProps) {
  const { predictions, qc_status, qc_flags, batch_id, model_version, schema_version } = response;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Results</h2>
        <span className="text-sm text-muted-foreground font-mono">Batch: {batch_id}</span>
      </div>

      {/* QC Status — most prominent element per brief */}
      <QcStatusBanner qcStatus={qc_status} qcFlags={qc_flags} />

      {/* Quality Score — always show with error band */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quality Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-mono font-semibold">
              {predictions.predicted_quality_score.toFixed(1)}
            </span>
            <span className="text-lg text-muted-foreground font-mono">/ 5</span>
            <span className="text-lg text-muted-foreground font-mono">
              &plusmn; {predictions.prediction_error_band.toFixed(1)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground font-mono">
            Score range: {(predictions.predicted_quality_score - predictions.prediction_error_band).toFixed(1)} &ndash;{" "}
            {(predictions.predicted_quality_score + predictions.prediction_error_band).toFixed(1)}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mediator Estimates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mediator Estimates</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {MEDIATOR_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium font-mono">
                    {predictions[key].toFixed(2)}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* Flavor Probabilities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Flavor Probabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {PROBABILITY_FIELDS.map(({ key, label }) => {
                const value = predictions[key];
                const percent = (value * 100).toFixed(0);
                const isHighRisk = key === "predicted_off_flavor_probability" && value > 0.3;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className={`text-sm font-medium font-mono ${isHighRisk ? "text-destructive" : ""}`}>
                        {percent}%{isHighRisk && <span className="sr-only"> (high risk)</span>}
                      </dd>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={Number(percent)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${label} probability: ${percent}%`}
                      className="h-2 rounded-sm bg-muted overflow-hidden"
                    >
                      <div
                        className={`h-full rounded-sm transition-all ${isHighRisk ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Metadata footer — only shown when version info is available */}
      {(model_version || schema_version) && (
        <p className="text-xs text-muted-foreground font-mono text-right">
          {model_version && <>Model: {model_version}</>}
          {model_version && schema_version && <> &middot; </>}
          {schema_version && <>Schema: {schema_version}</>}
        </p>
      )}
    </div>
  );
}
