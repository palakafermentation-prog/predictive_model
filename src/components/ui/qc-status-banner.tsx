"use client";

import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";

interface QcStatusBannerProps {
  qcStatus: string;
  qcFlags: string[];
}

const QC_STATUS_LABELS: Record<string, { icon: string; text: string }> = {
  pass: { icon: "✅", text: "Optimal Spec" },
  review: { icon: "⚠️", text: "Needs Review" },
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

const severityToVariant = {
  optimal: "qc-optimal",
  warning: "qc-warning",
  alert: "qc-alert",
} as const;

export function QcStatusBanner({ qcStatus, qcFlags }: QcStatusBannerProps) {
  const severity = getSeverity(qcStatus);
  const label = QC_STATUS_LABELS[qcStatus];
  const variant = severityToVariant[severity];

  return (
    <div className="space-y-2" role="status">
      <Alert variant={variant} className="font-semibold">
        {label ? (
          <>
            <span aria-hidden="true">{label.icon}</span> {label.text}
          </>
        ) : (
          qcStatus
        )}
      </Alert>
      {qcFlags.length > 0 && (
        <ul className="space-y-1 list-none p-0">
          {qcFlags.map((flag) => (
            <li key={flag}>
              <Alert
                variant={variant}
                className={cn("py-2", "opacity-85")}
              >
                {QC_FLAG_LABELS[flag] ?? flag}
              </Alert>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
