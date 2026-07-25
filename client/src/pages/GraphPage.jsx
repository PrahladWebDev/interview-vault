import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ReactFlow, { Background, Controls, MiniMap, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { Layers, Building2, FolderKanban, GitBranch } from 'lucide-react';
import { fetchGraph } from '../api/graph.js';
import { computeGraphLayout } from '../lib/graphLayout.js';
import { NODE_TYPES } from '../components/graph/GraphNodes.jsx';

const EDGE_COLOR = { topic: '#A855F7', company: '#5B8DEF', collection: '#22C55E' };
const TYPE_TOGGLES = [
  { key: 'topic', label: 'Topics', icon: Layers },
  { key: 'company', label: 'Companies', icon: Building2 },
  { key: 'collection', label: 'Collections', icon: FolderKanban },
];

export default function GraphPage() {
  const { data, isLoading } = useQuery({ queryKey: ['graph'], queryFn: fetchGraph });
  const [visibleTypes, setVisibleTypes] = useState({ topic: true, company: true, collection: true });
  const navigate = useNavigate();

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };

    const allowedHubTypes = new Set(Object.keys(visibleTypes).filter((t) => visibleTypes[t]));
    const keptNodes = data.nodes.filter((n) => n.type === 'question' || allowedHubTypes.has(n.type));
    const keptIds = new Set(keptNodes.map((n) => n.id));
    const keptEdges = data.edges.filter((e) => keptIds.has(e.source) && keptIds.has(e.target));

    const laidOut = computeGraphLayout(keptNodes, keptEdges);

    return {
      nodes: laidOut.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n,
        draggable: true,
      })),
      edges: keptEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        style: { stroke: EDGE_COLOR[e.kind] || '#8B93A7', strokeOpacity: 0.35 },
      })),
    };
  }, [data, visibleTypes]);

  function toggleType(key) {
    setVisibleTypes((v) => ({ ...v, [key]: !v[key] }));
  }

  function onNodeClick(_, node) {
    if (node.type === 'question') navigate(`/questions/${node.data.refId}`);
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Graph View</h1>
          <p className="mt-1 text-sm text-muted">
            Questions clustered by shared topic, company, and collection. Click a question to open it.
          </p>
        </div>
        <div className="flex gap-2">
          {TYPE_TOGGLES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => toggleType(key)}
              className={`btn-ghost ${visibleTypes[key] ? '' : 'opacity-40'}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card relative flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">Loading graph…</div>
        ) : !data?.nodes?.length ? (
          <EmptyState />
        ) : (
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              onNodeClick={onNodeClick}
              fitView
              minZoom={0.1}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="rgba(255,255,255,0.06)" gap={24} />
              <Controls className="!bg-surface !border-white/10 [&>button]:!bg-surface [&>button]:!border-white/10 [&>button]:!fill-slate-200" />
              <MiniMap
                pannable
                zoomable
                maskColor="rgba(10,13,20,0.75)"
                nodeColor={(n) => (n.type === 'question' ? '#5B8DEF' : '#A855F7')}
                className="!bg-surface !border !border-white/10"
              />
            </ReactFlow>
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="rounded-full bg-white/[0.04] p-4">
        <GitBranch size={24} className="text-muted" />
      </div>
      <h3 className="font-display text-lg font-semibold">Nothing to graph yet</h3>
      <p className="max-w-sm text-sm text-muted">Add questions with topics, companies, or collections to see them connected here.</p>
    </div>
  );
}
