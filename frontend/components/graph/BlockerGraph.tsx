"use client";

import type { VisaLensAnalysis } from "@/types/analysis";
import type { GraphNodeStatus } from "@/types/analysis";

type Props = { graph: VisaLensAnalysis["graph"] };

const STATUS_CONFIG: Record<
  GraphNodeStatus,
  { color: string; bg: string; border: string; dot: string }
> = {
  clear:   { color: "#2ecc71", bg: "rgba(46,204,113,0.08)",  border: "rgba(46,204,113,0.25)",  dot: "#2ecc71" },
  warning: { color: "#f0c040", bg: "rgba(240,192,64,0.08)",  border: "rgba(240,192,64,0.25)",  dot: "#f0c040" },
  blocked: { color: "#ef4343", bg: "rgba(239,67,67,0.08)",   border: "rgba(239,67,67,0.25)",   dot: "#ef4343" },
  pending: { color: "#7a7f99", bg: "rgba(122,127,153,0.06)", border: "rgba(122,127,153,0.18)", dot: "#484d66" },
};

const OWNER_LABELS: Record<string, string> = {
  student:   "student",
  organizer: "organizer",
  advisor:   "advisor / DSO",
  system:    "system",
};

export default function BlockerGraph({ graph }: Props) {
  const { nodes, edges } = graph;

  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    adjacency.get(edge.from)!.push(edge.to);
  }

  const hasIncoming = new Set(edges.map((e) => e.to));
  const roots = nodes.filter((n) => !hasIncoming.has(n.id));

  function topoLevels(): string[][] {
    const levels: string[][] = [];
    const visited = new Set<string>();

    function visit(id: string, depth: number) {
      if (visited.has(id)) return;
      visited.add(id);
      if (!levels[depth]) levels[depth] = [];
      levels[depth].push(id);
      for (const next of adjacency.get(id) ?? []) visit(next, depth + 1);
    }

    for (const root of roots) visit(root.id, 0);
    for (const n of nodes) if (!visited.has(n.id)) visit(n.id, levels.length);

    return levels;
  }

  const levels = topoLevels();
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "#0f1018", borderColor: "#252838" }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: "#1a1d2a" }}>
        <p
          className="text-[11px] uppercase tracking-widest mb-0.5"
          style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
        >
          Blocker Graph
        </p>
        <h3 className="text-sm font-medium" style={{ color: "#e4e6f0" }}>
          Verification Dependency Chain
        </h3>
      </div>

      {/* Legend */}
      <div
        className="px-6 py-3 border-b flex gap-5 flex-wrap"
        style={{ borderColor: "#1a1d2a", background: "#080910" }}
      >
        {(["clear", "warning", "blocked", "pending"] as GraphNodeStatus[]).map(
          (s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: cfg.dot,
                    boxShadow: s !== "pending" ? `0 0 5px ${cfg.dot}80` : undefined,
                  }}
                />
                <span
                  className="text-[10px] capitalize"
                  style={{ color: "#7a7f99", fontFamily: "var(--font-mono)" }}
                >
                  {s}
                </span>
              </div>
            );
          }
        )}
      </div>

      {/* Graph */}
      <div className="p-6 overflow-x-auto">
        <div className="flex flex-col gap-0 min-w-[420px]">
          {levels.map((levelIds, levelIdx) => (
            <div key={levelIdx}>
              {/* Nodes row */}
              <div className="flex gap-3 justify-center flex-wrap">
                {levelIds.map((id) => {
                  const node = nodeById.get(id);
                  if (!node) return null;
                  const cfg = STATUS_CONFIG[node.status];
                  return (
                    <div
                      key={id}
                      className="rounded-xl px-4 py-3 flex-1 min-w-[160px] max-w-[200px]"
                      style={{
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                          style={{
                            background: cfg.dot,
                            boxShadow:
                              node.status !== "pending"
                                ? `0 0 6px ${cfg.dot}80`
                                : undefined,
                          }}
                        />
                        <div>
                          <p
                            className="text-xs leading-snug font-medium"
                            style={{ color: cfg.color }}
                          >
                            {node.label}
                          </p>
                          <p
                            className="text-[10px] mt-0.5"
                            style={{
                              color: "#484d66",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {OWNER_LABELS[node.owner]}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Connector arrow (not after last level) */}
              {levelIdx < levels.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      className="w-px h-5"
                      style={{ background: "#252838" }}
                    />
                    <svg
                      width="8"
                      height="5"
                      viewBox="0 0 8 5"
                      fill="none"
                    >
                      <path
                        d="M4 5L0 0H8L4 5Z"
                        fill="#252838"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edges summary */}
      <div
        className="px-6 py-4 border-t"
        style={{ borderColor: "#1a1d2a", background: "#080910" }}
      >
        <p
          className="text-[11px] uppercase tracking-widest mb-3"
          style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
        >
          Dependency Chain
        </p>
        <div className="space-y-1.5">
          {edges.map((edge, i) => {
            const fromNode = nodeById.get(edge.from);
            const toNode = nodeById.get(edge.to);
            if (!fromNode || !toNode) return null;
            return (
              <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "#7a7f99" }}>
                <span style={{ color: STATUS_CONFIG[fromNode.status].color }}>
                  {fromNode.label}
                </span>
                <span style={{ color: "#484d66" }}>→</span>
                <span style={{ color: STATUS_CONFIG[toNode.status].color }}>
                  {toNode.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
