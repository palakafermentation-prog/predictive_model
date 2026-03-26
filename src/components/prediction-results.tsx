"use client";

import type { PredictionResponse } from "@pferm/shared-schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QcStatusBanner } from "@/components/ui/qc-status-banner";

interface PredictionResultsProps {
  response: PredictionResponse;
}

const BIOCHEMICAL_FIELDS = [
  { key: "residual_sugar", label: "Residual Sugar" },
  { key: "acidity", label: "Acidity" },
  { key: "amino_acidity", label: "Amino Acidity" },
  { key: "astringency", label: "Astringency" },
  { key: "alcohol_intensity", label: "Alcohol Intensity" },
] as const;

const FLAVOR_FIELDS = [
  { key: "fruity_prob", label: "Fruity" },
  { key: "floral_prob", label: "Floral" },
  { key: "off_flavor_prob", label: "Off-Flavor" },
] as const;

export function PredictionResults({ response }: PredictionResultsProps) {
  const { predictions, qc_status, qc_flags, batch_id } = response;

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
              {predictions.quality_score.toFixed(1)}
            </span>
            <span className="text-lg text-muted-foreground font-mono">
              &plusmn; {predictions.quality_score_error_band.toFixed(1)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground font-mono">
            Score range: {(predictions.quality_score - predictions.quality_score_error_band).toFixed(1)} &ndash;{" "}
            {(predictions.quality_score + predictions.quality_score_error_band).toFixed(1)}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Biochemical Mediators */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Biochemical Mediators</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {BIOCHEMICAL_FIELDS.map(({ key, label }) => (
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
              {FLAVOR_FIELDS.map(({ key, label }) => {
                const value = predictions[key];
                const percent = (value * 100).toFixed(0);
                const isHighRisk = key === "off_flavor_prob" && value > 0.3;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className={`text-sm font-medium font-mono ${isHighRisk ? "text-destructive" : ""}`}>
                        {percent}%
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
    </div>
  );
}
