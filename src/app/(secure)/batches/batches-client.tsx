"use client";

import * as React from "react";
import { useSession } from "@/hooks/use-session";
import { useDrawerStore } from "@/stores/drawer-store";
import { getBatches, uploadCsv } from "@/services/frontend/batch";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@pferm/shared-lib";
import { Eye, Download } from "lucide-react";
import { PredictionRequestSchema } from "@pferm/shared-schemas";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { CsvUploadRequestSchema } from "@pferm/shared-schemas";
import type { BatchListItem, PredictionRequest } from "@pferm/shared-schemas";

// --- CSV Parsing ---

const NUMERIC_FIELDS = [
  "Rice_Polish_Ratio",
  "Water_Hardness_ppm",
  "Water_pH",
  "Koji_Incubation_Temp_C",
  "Koji_Incubation_Hours",
  "Yeast_Pitch_Rate_cells_mL",
  "Moromi_Duration_Days",
  "Initial_Temperature_C",
] as const;

function parseCsv(text: string): PredictionRequest[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");

  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line, i) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string | number> = {};

    headers.forEach((header, j) => {
      const value = values[j] ?? "";
      if (NUMERIC_FIELDS.includes(header as typeof NUMERIC_FIELDS[number])) {
        const num = parseFloat(value);
        if (isNaN(num)) throw new Error(`Row ${i + 2}: "${header}" must be a number, got "${value}"`);
        row[header] = num;
      } else {
        row[header] = value;
      }
    });

    return row as unknown as PredictionRequest;
  });
}

function downloadTemplateCsv() {
  const headers = Object.keys(PredictionRequestSchema.shape).join(",");
  const blob = new Blob([headers + "\n"], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "batch_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// --- Batches Client ---

export function BatchesClient() {
  const { user, isLoading } = useSession();
  const { openDrawer } = useDrawerStore();
  const [batches, setBatches] = React.useState<BatchListItem[]>([]);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const [csvFile, setCsvFile] = React.useState<File | null>(null);
  const [csvErrors, setCsvErrors] = React.useState<string[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!user) return;
    getBatches()
      .then((result) => setBatches(result.items))
      .catch((err) => setFetchError(err instanceof Error ? err.message : "Failed to load batches"));
  }, [user]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvErrors([]);
  }

  async function handleCsvUpload() {
    if (!csvFile) return;
    setCsvErrors([]);
    setIsUploading(true);

    try {
      const text = await csvFile.text();
      const rows = parseCsv(text);

      // Validate before sending
      const result = CsvUploadRequestSchema.safeParse({ rows });
      if (!result.success) {
        const msgs = result.error.issues.map((i) => i.message);
        setCsvErrors(msgs);
        setCsvFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const newBatches = await uploadCsv(result.data.rows);
      setBatches((prev) => {
        // Merge: replace existing by batchId, append new
        const existingIds = new Set(prev.map((b) => b.batchId));
        const updated = prev.map((b) => {
          const updated = newBatches.find((nb) => nb.batchId === b.batchId);
          return updated ?? b;
        });
        newBatches.forEach((nb) => {
          if (!existingIds.has(nb.batchId)) updated.push(nb);
        });
        return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });

      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setCsvErrors([err instanceof Error ? err.message : "Upload failed"]);
      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <PageHeader title="Batches" />

          <p className="mt-1 text-sm text-muted-foreground">
            Your saved prediction runs. Click a row to view parameters and results.
          </p>
        </div>

        {/* CSV upload */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h2 className="text-sm font-medium md:flex-1">Upload CSV <span className="text-xs font-normal text-muted-foreground">(max 100 rows)</span></h2>

            <div className="md:flex-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={downloadTemplateCsv}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Template
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
            <p className="text-xs text-muted-foreground md:flex-1">
              CSV with columns: <span className="font-mono">batch_id</span> and parameter fields. Matching batch IDs will update existing records.
            </p>

            <div className="space-y-3 md:flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  aria-label="Select CSV file"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {csvFile ? csvFile.name : "Choose file"}
                </Button>
                {csvFile && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCsvUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? "Processing…" : "Upload & Run"}
                  </Button>
                )}
              </div>

              {csvErrors.length > 0 && (
                <div role="alert" className="space-y-1">
                  <ul className="space-y-1">
                    {csvErrors.map((err, i) => (
                      <li key={i} className="text-sm text-destructive">
                        {err}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    Fix the file and choose it again to retry.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {fetchError && (
          <div role="alert" className="rounded-md bg-destructive/10 border border-destructive p-3 text-sm text-destructive">
            {fetchError}
          </div>
        )}

        {/* Batch table */}
        {batches.length === 0 && !fetchError ? (
          <p className="text-sm text-muted-foreground">No batches saved yet. Run a prediction to get started.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Quality Score</TableHead>
                <TableHead>QC Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow
                  key={batch.id}
                  className="cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={`View batch ${batch.batchId}`}
                  onClick={() => openDrawer("batch_detail", { id: batch.id })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDrawer("batch_detail", { id: batch.id });
                    }
                  }}
                >
                  <TableCell className="font-mono text-sm">{batch.batchId}</TableCell>
                  <TableCell className="font-mono">{batch.qualityScore.toFixed(1)}</TableCell>
                  <TableCell className="text-sm">{batch.qcStatus}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(batch.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span><Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" /></span>
                        </TooltipTrigger>
                        <TooltipContent>View Results</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
