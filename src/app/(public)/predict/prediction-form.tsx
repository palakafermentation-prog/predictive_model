"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PredictionRequestSchema } from "@pferm/shared-schemas";
import type { PredictionRequest, PredictionResponse } from "@pferm/shared-schemas";
import { predict } from "@/services/frontend/prediction";
import { saveBatch } from "@/services/frontend/batch";
import { useSession } from "@/hooks/use-session";
import { usePredictionQueue } from "@/hooks/use-prediction-queue";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PredictionResults } from "@/components/prediction-results";
import { QueueStatusDisplay } from "@/components/queue-status";

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
      { name: "initial_temperature_c" as const, label: "Initial Temp", unit: "°C", step: 0.5, defaultValue: 10 },
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
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const queueStatus = usePredictionQueue(activeRequestId);

  const form = useForm<PredictionRequest>({
    resolver: zodResolver(PredictionRequestSchema),
    defaultValues: getDefaults(),
  });

  async function onSubmit(data: PredictionRequest) {
    setError(null);
    setResult(null);

    const requestId = crypto.randomUUID();
    setActiveRequestId(requestId);

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
          modelVersion: response.model_version,
          schemaVersion: response.schema_version,
        }).catch(() => toast.error("Results could not be saved to your batches."));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setActiveRequestId(null);
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Batch ID — inline */}
          <FormField control={form.control} name="batch_id" render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0">
              <FormLabel className="shrink-0">Batch ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g. MY_BATCH_001" className="max-w-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Input groups as flat sections */}
          {INPUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.fields.map((f) => (
                  <FormField key={f.name} control={form.control} name={f.name} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        {f.label}
                        {f.unit && (
                          <span className="ml-1 text-xs text-muted-foreground font-normal">
                            ({f.unit})
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={f.step}
                          className="mt-1"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage className="mt-0.5 text-xs" />
                    </FormItem>
                  )} />
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
            {isSubmitting ? "Running prediction…" : "Run Prediction"}
          </Button>
        </form>
      </Form>

      {/* Queue status — shown while waiting, hidden once complete */}
      {isSubmitting && queueStatus && (
        <QueueStatusDisplay status={queueStatus} />
      )}

      <div aria-live="polite">
        {result && <PredictionResults response={result} />}
      </div>
    </div>
  );
}
