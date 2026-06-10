"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Position,
  Handle,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GitBranch } from "lucide-react";

import type { PartialVisaLensAnalysis, NodeStatus, NodeOwner } from "@/types/analysis";
import { resolveGraph, layoutGraph } from "@/lib/graphBuilder";
import {
  NODE_STATUS_LABEL,
  NODE_STATUS_STYLE,
  OWNER_BADGE,
  OWNER_LABEL,
} from "@/lib/riskColors";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/** Data carried by each custom blocker node. */
type BlockerNodeData = {
  label: string;
  status: NodeStatus;
  owner: NodeOwner;
  [key: string]: unknown;
};

type BlockerFlowNode = Node<BlockerNodeData, "blocker">;

/** Custom React Flow node: status color, status dot, owner badge. */
function BlockerNode({ data }: NodeProps<BlockerFlowNode>) {
  const style = NODE_STATUS_STYLE[data.status];
  return (
    <div
      className={`w-[240px] rounded-lg border-2 px-3.5 py-2.5 shadow-sm ${style.container}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
        <span className="text-[13px] font-medium leading-snug">{data.label}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 pl-[18px]">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${OWNER_BADGE[data.owner]}`}
        >
          {OWNER_LABEL[data.owner]}
        </span>
        <span className="text-[10px] text-slate-500">
          {NODE_STATUS_LABEL[data.status]}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
}

const nodeTypes = { blocker: BlockerNode };

const LEGEND: { status: NodeStatus; label: string }[] = [
  { status: "clear", label: "Clear" },
  { status: "warning", label: "Verify" },
  { status: "blocked", label: "Blocking risk" },
  { status: "pending", label: "Pending" },
];

export default function BlockerGraph({
  analysis,
}: {
  analysis: PartialVisaLensAnalysis;
}) {
  // Convert our schema -> positioned React Flow nodes/edges.
  const { nodes, edges } = useMemo(() => {
    const graph = resolveGraph(analysis);
    const positioned = layoutGraph(graph);

    const flowNodes: BlockerFlowNode[] = positioned.map((n) => ({
      id: n.id,
      type: "blocker",
      position: { x: n.x, y: n.y },
      data: { label: n.label, status: n.status, owner: n.owner },
      draggable: false,
      connectable: false,
    }));

    const flowEdges: Edge[] = graph.edges.map((e, i) => ({
      id: `e-${e.from}-${e.to}-${i}`,
      source: e.from,
      target: e.to,
      label: e.label,
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 1.75 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [analysis]);

  return (
    <Card>
      <CardHeader
        icon={<GitBranch size={16} />}
        title="Blocker graph"
        subtitle="What stands between you and a safe decision"
        right={
          <div className="flex flex-wrap items-center gap-2.5">
            {LEGEND.map((item) => (
              <span key={item.status} className="flex items-center gap-1 text-[11px] text-slate-600">
                <span className={`h-2 w-2 rounded-full ${NODE_STATUS_STYLE[item.status].dot}`} />
                {item.label}
              </span>
            ))}
          </div>
        }
      />
      <CardBody className="!p-0">
        <div className="h-[420px] w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnScroll={false}
            preventScrolling={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} color="#e2e8f0" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </CardBody>
    </Card>
  );
}
