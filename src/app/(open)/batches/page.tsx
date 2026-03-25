import { BatchesClient } from "./batches-client";

export const metadata = {
  title: "Batches — Palaka Fermentation",
  description: "View and manage your saved prediction batches.",
};

export default function BatchesPage() {
  return <BatchesClient />;
}
