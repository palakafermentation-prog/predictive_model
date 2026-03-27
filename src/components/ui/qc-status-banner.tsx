"use client";

import { cn } from "@/lib/utils";

interface QcStatusBannerProps {
  qcStatus: string;
  qcFlags: string[];
}

function getSeverity(status: string): "optimal" | "warning" | "alert" {
  if (status.includes("\u2705") || status.toLowerCase().includes("optimal")) {
    return "optimal";
  }
  if (status.includes("\uD83D\uDEA8") || status.toLowerCase().includes("risk") || status.toLowerCase().includes("alert")) {
    return "alert";
  }
  return "warning";
}

const severityStyles = {
  optimal: "bg-qc-optimal text-qc-optimal-foreground",
  warning: "bg-qc-warning text-qc-warning-foreground",
  alert: "bg-qc-alert text-qc-alert-foreground",
};

export function QcStatusBanner({ qcStatus, qcFlags }: QcStatusBannerProps) {
  const severity = getSeverity(qcStatus);

  return (
    <div className="space-y-2" role="status">
      <div
        className={cn(
          "rounded-lg px-4 py-3 text-sm font-semibold",
          severityStyles[severity],
        )}
      >
        {qcStatus}
      </div>
      {qcFlags.length > 0 && (
        <div className="space-y-1">
          {qcFlags.map((flag, i) => (
            <div
              key={i}
              className={cn(
                "rounded-md px-3 py-2 text-sm",
                severityStyles[severity],
                "opacity-85",
              )}
            >
              {flag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
