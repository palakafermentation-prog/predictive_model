"use client";

import { cn } from "@/lib/utils";

interface QcStatusBannerProps {
  qcStatus: string;
  qcFlags: string[];
}

const QC_STATUS_LABELS: Record<string, string> = {
  pass: "✅ Optimal Spec",
  review: "⚠️ Needs Review",
};

const QC_FLAG_LABELS: Record<string, string> = {
  high_acidity_risk: "High acidity risk",
  high_off_flavor_probability: "High off-flavor probability",
  out_of_domain_prediction_acidity: "Acidity prediction out of domain",
  elevated_brix: "Elevated Brix — potential sweetness imbalance",
};

function getSeverity(status: string): "optimal" | "warning" | "alert" {
  if (status === "pass" || status.includes("\u2705") || status.toLowerCase().includes("optimal")) {
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
        {QC_STATUS_LABELS[qcStatus] ?? qcStatus}
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
              {QC_FLAG_LABELS[flag] ?? flag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
