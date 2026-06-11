import { Suspense } from "react";
import ResultsContent from "./ResultsContent";

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            background: "#080910",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: "#7a7f99",
              fontFamily: "var(--font-mono)",
            }}
          >
            Loading analysis…
          </p>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
