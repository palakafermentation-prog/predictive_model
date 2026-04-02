"use client";

import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { QueueStatus } from "@/hooks/use-prediction-queue";

interface QueueStatusProps {
  status: QueueStatus;
}

/**
 * Displays queue position, estimated wait, or CSV row progress.
 *
 * Renders an aria-live region so screen readers announce status changes.
 */
export function QueueStatusDisplay({ status }: QueueStatusProps) {
  const { position, estimatedWaitMs, processedRows, totalRows } = status;

  const isCsvProgress = processedRows !== undefined && totalRows !== undefined;
  const isProcessing = position === 0;
  const estimatedSecs = Math.ceil(estimatedWaitMs / 1000);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="flex flex-col items-center gap-3 py-4 text-center"
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />

      {isCsvProgress ? (
        // CSV upload row progress
        <>
          <p className="text-sm font-medium">
            Processing row {processedRows} of {totalRows}
          </p>
          <Progress
            value={Math.round((processedRows / totalRows) * 100)}
            className="w-48"
            aria-label={`Processing row ${processedRows} of ${totalRows}`}
          />
        </>
      ) : isProcessing ? (
        // Single prediction being processed
        <p className="text-sm text-muted-foreground">Processing your prediction…</p>
      ) : (
        // Queued — show position and wait estimate
        <>
          <p className="text-sm font-medium">Queue position #{position}</p>
          {estimatedSecs > 0 && (
            <p className="text-xs text-muted-foreground">
              Estimated wait: ~{estimatedSecs}s
            </p>
          )}
        </>
      )}
    </div>
  );
}
