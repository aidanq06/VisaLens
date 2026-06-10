import ResultsDashboard from "@/components/dashboard/ResultsDashboard";
import { mockAnalysis } from "@/data/mockAnalysis";

/**
 * Demo page: renders the full results dashboard from mock data.
 * Once the backend /analyze endpoint is live, replace mockAnalysis with
 * the fetched response (same schema) — nothing else changes.
 */
export default function Home() {
  return <ResultsDashboard analysis={mockAnalysis} />;
}
