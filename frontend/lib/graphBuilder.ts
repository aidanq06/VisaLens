import type {
  GraphEdge,
  GraphNode,
  PartialVisaLensAnalysis,
  RiskLevel,
} from "@/types/analysis";

/**
 * Graph builder for the blocker/dependency graph.
 *
 * Two jobs:
 *  1. resolveGraph(): use the backend graph if present, otherwise derive
 *     a graph from risk categories (fallback so the UI never renders empty).
 *  2. layoutGraph(): assign x/y positions with a simple layered
 *     (topological) layout so React Flow can render without dagre.
 */

export type BlockerGraphData = { nodes: GraphNode[]; edges: GraphEdge[] };

const AT_LEAST_MODERATE: RiskLevel[] = ["moderate", "medium_high", "high"];

function levelAtLeastModerate(level?: RiskLevel): boolean {
  return !!level && AT_LEAST_MODERATE.includes(level);
}

/**
 * Build a blocker graph from risk categories when the backend did not
 * send one. Mirrors backend/services/workflow/graph_builder.py.
 */
export function buildGraphFromRisk(
  analysis: PartialVisaLensAnalysis
): BlockerGraphData {
  const risk = analysis.risk ?? {};
  const categories = risk.categories;
  const overallLevel = risk.level;

  const nodes: GraphNode[] = [
    {
      id: "opportunity_uploaded",
      label: "Opportunity uploaded",
      status: "clear",
      owner: "student",
    },
  ];
  const edges: GraphEdge[] = [];

  // Risk-signal layer. Each detected signal hangs off the root.
  const signalIds: string[] = [];

  if (levelAtLeastModerate(categories?.paid_role?.level)) {
    nodes.push({
      id: "paid_role",
      label: "Paid role detected",
      status: "warning",
      owner: "organizer",
    });
    edges.push({ from: "opportunity_uploaded", to: "paid_role" });
    signalIds.push("paid_role");
  }

  if (levelAtLeastModerate(categories?.work_authorization?.level)) {
    nodes.push({
      id: "work_auth",
      label: "Work authorization may be required",
      status: "blocked",
      owner: "student",
    });
    // Work auth follows the paid-role signal when present, else the root.
    edges.push({
      from: signalIds.includes("paid_role") ? "paid_role" : "opportunity_uploaded",
      to: "work_auth",
    });
    signalIds.push("work_auth");
  }

  if (categories?.citizenship?.level === "high") {
    nodes.push({
      id: "citizenship_restricted",
      label: "Citizenship restriction detected",
      status: "blocked",
      owner: "system",
    });
    edges.push({ from: "opportunity_uploaded", to: "citizenship_restricted" });
    signalIds.push("citizenship_restricted");
  }

  if (categories?.ambiguity?.level === "high") {
    nodes.push({
      id: "eligibility_unclear",
      label: "International eligibility unclear",
      status: "blocked",
      owner: "system",
    });
    // Ambiguity is downstream of whichever signals exist.
    const parents = signalIds.filter((id) => id !== "eligibility_unclear");
    if (parents.length === 0) {
      edges.push({ from: "opportunity_uploaded", to: "eligibility_unclear" });
    } else {
      for (const p of parents) edges.push({ from: p, to: "eligibility_unclear" });
    }
    signalIds.push("eligibility_unclear");
  }

  // Verification layer for risky opportunities.
  const verificationNeeded =
    overallLevel === "high" || overallLevel === "medium_high";

  const leafSignals =
    signalIds.length > 0 ? [signalIds[signalIds.length - 1]] : ["opportunity_uploaded"];

  if (verificationNeeded) {
    nodes.push(
      {
        id: "organizer_verify",
        label: "Organizer verification needed",
        status: "pending",
        owner: "organizer",
      },
      {
        id: "advisor_verify",
        label: "Advisor/DSO verification recommended",
        status: "pending",
        owner: "advisor",
      },
      {
        id: "decision",
        label: "Do not assume eligibility until confirmed",
        status: "blocked",
        owner: "student",
      }
    );
    for (const leaf of leafSignals) {
      edges.push({ from: leaf, to: "organizer_verify" });
      edges.push({ from: leaf, to: "advisor_verify" });
    }
    edges.push({ from: "organizer_verify", to: "decision" });
    edges.push({ from: "advisor_verify", to: "decision" });
  } else {
    nodes.push({
      id: "decision",
      label:
        signalIds.length > 0
          ? "Verify remaining questions, then proceed"
          : "No major blockers detected — safe to proceed",
      status: signalIds.length > 0 ? "warning" : "clear",
      owner: "student",
    });
    for (const leaf of leafSignals) edges.push({ from: leaf, to: "decision" });
  }

  return { nodes, edges };
}

/**
 * Prefer the backend graph; fall back to risk-derived graph; final
 * fallback is a minimal two-node graph so the canvas is never empty.
 */
export function resolveGraph(
  analysis: PartialVisaLensAnalysis
): BlockerGraphData {
  const g = analysis.graph;
  if (g?.nodes && g.nodes.length > 0) {
    return { nodes: g.nodes, edges: g.edges ?? [] };
  }
  if (analysis.risk?.categories) {
    return buildGraphFromRisk(analysis);
  }
  return {
    nodes: [
      {
        id: "opportunity_uploaded",
        label: "Opportunity uploaded",
        status: "clear",
        owner: "student",
      },
      {
        id: "awaiting_analysis",
        label: "Awaiting analysis",
        status: "pending",
        owner: "system",
      },
    ],
    edges: [{ from: "opportunity_uploaded", to: "awaiting_analysis" }],
  };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export type PositionedNode = GraphNode & { x: number; y: number };

const NODE_WIDTH = 240;
const X_GAP = 60;
const Y_GAP = 110;

/**
 * Simple layered layout: level = longest path from a root node.
 * Nodes in the same level are spread horizontally and centered.
 * Good enough for our ~6-9 node workflow graphs, no dagre needed.
 */
export function layoutGraph(graph: BlockerGraphData): PositionedNode[] {
  const { nodes, edges } = graph;
  const ids = new Set(nodes.map((n) => n.id));
  const validEdges = edges.filter((e) => ids.has(e.from) && ids.has(e.to));

  // Longest-path level assignment (graphs are small; O(V*E) is fine).
  const level = new Map<string, number>();
  for (const n of nodes) level.set(n.id, 0);
  for (let i = 0; i < nodes.length; i++) {
    let changed = false;
    for (const e of validEdges) {
      const next = (level.get(e.from) ?? 0) + 1;
      if (next > (level.get(e.to) ?? 0)) {
        level.set(e.to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Group by level, then center each row.
  const rows = new Map<number, GraphNode[]>();
  for (const n of nodes) {
    const l = level.get(n.id) ?? 0;
    if (!rows.has(l)) rows.set(l, []);
    rows.get(l)!.push(n);
  }

  const maxRowWidth = Math.max(
    ...Array.from(rows.values()).map(
      (row) => row.length * NODE_WIDTH + (row.length - 1) * X_GAP
    )
  );

  const positioned: PositionedNode[] = [];
  for (const [l, row] of Array.from(rows.entries()).sort((a, b) => a[0] - b[0])) {
    const rowWidth = row.length * NODE_WIDTH + (row.length - 1) * X_GAP;
    const startX = (maxRowWidth - rowWidth) / 2;
    row.forEach((n, i) => {
      positioned.push({
        ...n,
        x: startX + i * (NODE_WIDTH + X_GAP),
        y: l * Y_GAP,
      });
    });
  }
  return positioned;
}
