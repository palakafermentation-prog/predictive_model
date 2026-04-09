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
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { PredictionResults } from "@/components/prediction-results";
import { QueueStatusDisplay } from "@/components/queue-status";

type NumberField = {
  type: "number";
  name: Exclude<keyof PredictionRequest, "batch_id" | "rice_variety" | "yeast_strain">;
  label: string;
  unit: string;
  step: number;
  optional?: boolean;
  tooltip?: string;
};

type TextSuggestField = {
  type: "text-suggest";
  name: "rice_variety" | "yeast_strain";
  label: string;
  suggestions: readonly string[];
  placeholder?: string;
  optional?: boolean;
};

type Field = NumberField | TextSuggestField;

const INPUT_GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: "Rice",
    fields: [
      { type: "number", name: "rice_polish_ratio", label: "Polish Ratio", unit: "%", step: 1 },
      {
        type: "text-suggest",
        name: "rice_variety",
        label: "Rice Variety",
        optional: true,
        suggestions: ["Yamada Nishiki", "Gohyakumangoku", "Omachi", "Table rice"],
        placeholder: "e.g. Yamada Nishiki",
      },
    ],
  },
  {
    title: "Water",
    fields: [
      { type: "number", name: "water_hardness_ppm", label: "Hardness", unit: "ppm", step: 1 },
      { type: "number", name: "water_ph", label: "pH", unit: "", step: 0.1 },
    ],
  },
  {
    title: "Koji",
    fields: [
      { type: "number", name: "koji_incubation_hours", label: "Incubation Hours", unit: "hrs", step: 1 },
      {
        type: "number",
        name: "yeast_pitch_rate_cells_ml",
        label: "Yeast Pitch Rate",
        unit: "cells/mL",
        step: 1000000,
        optional: true,
        tooltip:
          "The concentration of yeast cells added at the start of fermentation. Optional — leave blank if unknown and the model will estimate it.",
      },
      {
        type: "text-suggest",
        name: "yeast_strain",
        label: "Yeast Strain",
        optional: true,
        suggestions: ["Kyokai 7", "Kyokai 9", "Kyokai 14", "EC-1118"],
        placeholder: "e.g. Kyokai 7",
      },
    ],
  },
  {
    title: "Fermentation",
    fields: [
      { type: "number", name: "moromi_duration_days", label: "Moromi Duration", unit: "days", step: 1 },
      { type: "number", name: "initial_temperature_c", label: "Initial Temp", unit: "°C", step: 0.5 },
    ],
  },
];

function getDefaults(): Partial<PredictionRequest> {
  const defaults: Record<string, unknown> = { batch_id: "" };
  for (const group of INPUT_GROUPS) {
    for (const field of group.fields) {
      if (field.type === "text-suggest") {
        defaults[field.name] = "";
      }
    }
  }
  return defaults as Partial<PredictionRequest>;
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

    // Normalize optional fields: empty strings and NaN (blank number inputs) become undefined
    // so they are not persisted as noise in the parameters JSONB or sent to the model.
    const cleaned: PredictionRequest = {
      ...data,
      yeast_pitch_rate_cells_ml:
        typeof data.yeast_pitch_rate_cells_ml === "number" && !isNaN(data.yeast_pitch_rate_cells_ml)
          ? data.yeast_pitch_rate_cells_ml
          : undefined,
      rice_variety: data.rice_variety?.trim() || undefined,
      yeast_strain: data.yeast_strain?.trim() || undefined,
    };

    const requestId = crypto.randomUUID();
    setActiveRequestId(requestId);

    try {
      const response = await predict(cleaned, requestId);
      setResult(response);

      if (user) {
        const { batch_id, ...parameters } = cleaned;
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
                {group.fields.map((f) =>
                  f.type === "number" ? (
                    <FormField key={f.name} control={form.control} name={f.name} render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-1">
                          <FormLabel className="text-sm">
                            {f.label}
                            {f.unit && (
                              <span className="ml-1 text-xs text-muted-foreground font-normal">
                                ({f.unit})
                              </span>
                            )}
                            {f.optional && (
                              <span className="ml-1 text-xs text-muted-foreground font-normal">
                                (optional)
                              </span>
                            )}
                          </FormLabel>
                          {f.tooltip && (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center p-1 -m-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                                    aria-label={`About ${f.label}`}
                                  >
                                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                  {f.tooltip}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            step={f.step}
                            className="mt-1"
                            {...field}
                            value={
                              typeof field.value === "number" && !Number.isNaN(field.value)
                                ? field.value
                                : ""
                            }
                            onChange={(e) => {
                              const v = e.target.value;
                              field.onChange(v === "" ? undefined : Number(v));
                            }}
                          />
                        </FormControl>
                        <FormMessage className="mt-0.5 text-xs" />
                      </FormItem>
                    )} />
                  ) : (
                    <FormField key={f.name} control={form.control} name={f.name} render={({ field }) => {
                      const listId = `suggest-${f.name}`;
                      return (
                        <FormItem>
                          <FormLabel className="text-sm">
                            {f.label}
                            {f.optional && (
                              <span className="ml-1 text-xs text-muted-foreground font-normal">
                                (optional)
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              list={listId}
                              placeholder={f.placeholder}
                              className="mt-1"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <datalist id={listId}>
                            {f.suggestions.map((s) => (
                              <option key={s} value={s} />
                            ))}
                          </datalist>
                          <FormMessage className="mt-0.5 text-xs" />
                        </FormItem>
                      );
                    }} />
                  )
                )}
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
