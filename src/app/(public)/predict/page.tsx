import { PageHeader } from "@/components/page-header";
import { PredictionForm } from "./prediction-form";

export const metadata = {
  title: "Predict — Palaka Fermentation",
  description: "Enter fermentation parameters and receive quality predictions with QC status flags.",
};

export default function PredictPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Fermentation Prediction"
        description="Enter your process parameters to receive quality predictions with confidence intervals. All predictions carry error bands — they are estimates, not guarantees."
      />
      <PredictionForm />
    </div>
  );
}
