"use client";

import type { PredictionResponse } from "@pferm/shared-schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QcStatusBanner } from "@/components/ui/qc-status-banner";

interface PredictionResultsProps {
  response: PredictionResponse;
  /**
   * Heading level for the "Results" title. Defaults to "h2" for standalone page
   * use. Pass "h3" when nested inside a container that already provides an h2
   * (e.g. the drawer's SheetTitle) so heading hierarchy stays valid.
   */
  headingLevel?: "h2" | "h3";
}

const MEDIATOR_FIELDS = [
  { key: "estimated_final_brix", label: "Final Brix" },
  { key: "estimated_final_acidity", label: "Acidity (San-do)" },
  { key: "estimated_amino_acidity", label: "Amino Acidity" },
] as const;

const PROBABILITY_FIELDS = [
  { key: "predicted_off_flavor_probability", label: "Off-Flavor" },
] as const;

export function PredictionResults({ response, headingLevel = "h2" }: PredictionResultsProps) {
  const { predictions, qc_status, qc_flags, warnings, batch_id, model_version, schema_version } = response;
  const HeadingTag = headingLevel;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <HeadingTag className="text-xl font-semibold tracking-tight">Results</HeadingTag>
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
              &plusmn; {predictions.prediction_error_band.quality_score_1to5.toFixed(1)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground font-mono">
            Score range:{" "}
            {(predictions.predicted_quality_score - predictions.prediction_error_band.quality_score_1to5).toFixed(1)}{" "}
            &ndash;{" "}
            {(predictions.predicted_quality_score + predictions.prediction_error_band.quality_score_1to5).toFixed(1)}
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
              {MEDIATOR_FIELDS.map(({ key, label }) => {
                const value = predictions[key];
                return (
                  <div key={key} className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium font-mono">
                      {value == null ? "N/A" : value.toFixed(2)}
                    </dd>
                  </div>
                );
              })}
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
                    <Progress
                      value={Number(percent)}
                      aria-label={`${label} probability: ${percent}%`}
                      className="h-2 rounded-sm bg-muted"
                      indicatorClassName={`rounded-sm ${isHighRisk ? "bg-destructive" : ""}`}
                    />
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Warnings — model soft-validation notices */}
      {warnings && warnings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-yellow-700 dark:text-yellow-400">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

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
