"use client";

import type { PredictionResponse } from "@pferm/shared-schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QcStatusBanner } from "@/components/ui/qc-status-banner";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const QUALITY_SCORE_TOOLTIP =
  "Predicted overall quality on a 1–5 scale. Scores above 4.0 indicate premium quality characteristics. Error band (±) reflects model uncertainty — wider bands indicate inputs further from the training distribution.";

const ERROR_BAND_TOOLTIP =
  "Uncertainty range around the quality score. Wider bands indicate inputs further from the model's training distribution. Derived from LOBO (leave-one-batch-out) residual analysis.";

const QC_STATUS_TOOLTIP =
  "Confirms that all input values fall within the allowed numerical ranges for the current model version. Does not validate whether the combination of inputs represents a sound brewing protocol. Cross-variable plausibility checking is planned for a future release.";

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
  {
    key: "estimated_final_brix",
    label: "Final Brix",
    tooltip:
      "Predicted residual sugar at completion. Lower values indicate drier sake. Typical finished sake: 4–8 Brix. This is a mediator estimate — an intermediate variable the model uses to arrive at quality predictions.",
  },
  {
    key: "estimated_final_acidity",
    label: "Acidity (San-do)",
    tooltip:
      "Predicted titratable acidity (San-do) at completion, in g/L. Higher acidity produces a crisper, more refreshing profile. Typical sake range: 1.0–2.4 g/L. May return N/A if inputs fall outside the model's training range for this variable.",
  },
  {
    key: "estimated_amino_acidity",
    label: "Amino Acidity",
    tooltip:
      "Predicted amino acid content, a proxy for umami and savory depth. Higher values (above 1.5) indicate more umami character. Influenced by rice protein content (polish ratio) and fermentation duration. Typical range: 0.8–2.8.",
  },
] as const;

const PROBABILITY_FIELDS = [
  {
    key: "predicted_off_flavor_probability",
    label: "Off-Flavor",
    tooltip:
      "Estimated probability of detectable off-flavor development. Values above 20% warrant process review. Current model trained primarily on research-grade records — real-world off-flavor detection will improve as brewer-submitted data accumulates.",
  },
  {
    key: "predicted_floral_probability",
    label: "Floral",
    tooltip:
      "Probability of detectable floral aromatic character (ginjo-ka). 100% indicates high confidence of floral character; 0% indicates non-floral profile. Note: current model uses binary classification — a gradient probability scale is planned for a future version as more sensory data is collected.",
  },
] as const;

const SENSORY_FIELDS = [
  {
    key: "predicted_texture_astringency",
    label: "Texture Astringency",
    tooltip:
      "Predicted astringency sensation on a 1–4 scale. 1 = none, 4 = drying/gripping. Values above 3 may indicate process issues worth investigating.",
  },
  {
    key: "predicted_alcohol_burn_intensity",
    label: "Alcohol Burn Intensity",
    tooltip:
      "Predicted alcohol heat sensation on a 1–5 scale. 1 = invisible, 5 = hot. Higher values are associated with warmer fermentation temperatures and shorter moromi duration.",
  },
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
      <QcStatusBanner qcStatus={qc_status} qcFlags={qc_flags} tooltip={QC_STATUS_TOOLTIP} />

      {/* Quality Score — always show with error band */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1">
            <CardTitle className="text-base leading-none">Quality Score</CardTitle>
            <InfoTooltip text={QUALITY_SCORE_TOOLTIP} label="Quality Score" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-mono font-semibold">
              {predictions.predicted_quality_score.toFixed(1)}
            </span>
            <span className="text-lg text-muted-foreground font-mono">/ 5</span>
            <span className="inline-flex items-center gap-1 text-lg text-muted-foreground font-mono leading-none">
              &plusmn; {predictions.prediction_error_band.quality_score_1to5.toFixed(1)}
              <InfoTooltip text={ERROR_BAND_TOOLTIP} label="Error Band" />
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
              {MEDIATOR_FIELDS.map(({ key, label, tooltip }) => {
                const value = predictions[key];
                return (
                  <div key={key} className="flex items-center justify-between">
                    <dt className="flex items-center gap-1 text-sm leading-none text-muted-foreground">
                      {label}
                      <InfoTooltip text={tooltip} label={label} />
                    </dt>
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
              {PROBABILITY_FIELDS.map(({ key, label, tooltip }) => {
                const value = predictions[key];
                if (value == null) return null;
                const percent = (value * 100).toFixed(0);
                const isHighRisk = key === "predicted_off_flavor_probability" && value > 0.3;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1 text-sm leading-none text-muted-foreground">
                        {label}
                        <InfoTooltip text={tooltip} label={label} />
                      </dt>
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

      {/* Sensory Predictions — only shown when live model provides them */}
      {SENSORY_FIELDS.some(({ key }) => predictions[key] != null) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sensory Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {SENSORY_FIELDS.map(({ key, label, tooltip }) => {
                const value = predictions[key];
                if (value == null) return null;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <dt className="flex items-center gap-1 text-sm leading-none text-muted-foreground">
                      {label}
                      <InfoTooltip text={tooltip} label={label} />
                    </dt>
                    <dd className="text-sm font-medium font-mono">{value.toFixed(2)}</dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      )}

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
