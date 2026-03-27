"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PredictionRequestSchema } from "@pferm/shared-schemas";
import type { PredictionRequest, PredictionResponse } from "@pferm/shared-schemas";
import { predict } from "@/services/frontend/prediction";
import { saveBatch } from "@/services/frontend/batch";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PredictionResults } from "@/components/prediction-results";

const INPUT_GROUPS = [
  {
    title: "Rice",
    fields: [
      { name: "rice_polish_ratio" as const, label: "Polish Ratio", unit: "%", step: 1, defaultValue: 60 },
    ],
  },
  {
    title: "Water",
    fields: [
      { name: "water_hardness_ppm" as const, label: "Hardness", unit: "ppm", step: 1, defaultValue: 45 },
      { name: "water_ph" as const, label: "pH", unit: "", step: 0.1, defaultValue: 6.5 },
    ],
  },
  {
    title: "Koji",
    fields: [
      { name: "koji_incubation_hours" as const, label: "Incubation Hours", unit: "hrs", step: 1, defaultValue: 44 },
      { name: "yeast_pitch_rate_cells_ml" as const, label: "Yeast Pitch Rate", unit: "cells/mL", step: 1000000, defaultValue: 100000000 },
    ],
  },
  {
    title: "Fermentation",
    fields: [
      { name: "moromi_duration_days" as const, label: "Moromi Duration", unit: "days", step: 1, defaultValue: 25 },
      { name: "initial_temperature_c" as const, label: "Initial Temp", unit: "\u00B0C", step: 0.5, defaultValue: 10 },
    ],
  },
];

function getDefaults(): PredictionRequest {
  const defaults: Record<string, unknown> = { batch_id: "" };
  for (const group of INPUT_GROUPS) {
    for (const field of group.fields) {
      defaults[field.name] = field.defaultValue;
    }
  }
  return defaults as PredictionRequest;
}

export function PredictionForm() {
  const { user } = useSession();
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PredictionRequest>({
    resolver: zodResolver(PredictionRequestSchema),
    defaultValues: getDefaults(),
  });

  async function onSubmit(data: PredictionRequest) {
    setError(null);
    try {
      const response = await predict(data);
      setResult(response);

      if (user) {
        const { batch_id, ...parameters } = data;
        saveBatch({
          batchId: batch_id,
          parameters,
          predictions: response.predictions,
          qcStatus: response.qc_status,
          qcFlags: response.qc_flags,
        }).catch(() => toast.error("Results could not be saved to your batches."));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setResult(null);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Batch ID — inline */}
        <div className="flex items-center gap-3">
          <Label htmlFor="batch_id" className="shrink-0">Batch ID</Label>
          <Input
            id="batch_id"
            placeholder="e.g. MY_BATCH_001"
            className="max-w-xs"
            aria-invalid={!!errors.batch_id}
            aria-describedby={errors.batch_id ? "batch_id-error" : undefined}
            {...register("batch_id")}
          />
          {errors.batch_id && (
            <p id="batch_id-error" className="text-sm text-destructive">{errors.batch_id.message}</p>
          )}
        </div>

        {/* Input groups as flat sections */}
        {INPUT_GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.fields.map((field) => (
                <div key={field.name}>
                  <Label htmlFor={field.name} className="text-sm">
                    {field.label}
                    {field.unit && (
                      <span className="ml-1 text-xs text-muted-foreground font-normal">
                        ({field.unit})
                      </span>
                    )}
                  </Label>
                  <Input
                    id={field.name}
                    type="number"
                    step={field.step}
                    className="mt-1"
                    aria-invalid={!!errors[field.name]}
                    aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                    {...register(field.name, { valueAsNumber: true })}
                  />
                  {errors[field.name] && (
                    <p id={`${field.name}-error`} className="mt-0.5 text-xs text-destructive">
                      {errors[field.name]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && (
          <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
          {isSubmitting ? "Running prediction\u2026" : "Run Prediction"}
        </Button>
      </form>

      <div aria-live="polite">
        {result && <PredictionResults response={result} />}
      </div>
    </div>
  );
}
