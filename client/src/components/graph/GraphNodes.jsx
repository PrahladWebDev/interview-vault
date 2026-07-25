import { Handle, Position } from 'reactflow';
import { Building2, Layers, FolderKanban, CheckCircle2, Circle, Star } from 'lucide-react';

const DIFFICULTY_DOT = { Easy: 'bg-success', Medium: 'bg-warning', Hard: 'bg-danger' };

export function QuestionNode({ data, selected }) {
  return (
    <div
      className={`flex max-w-[190px] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs shadow-glass backdrop-blur-glass transition-colors ${
        selected ? 'border-accent-blue bg-white/[0.1]' : 'border-white/10 bg-surface/90'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <span className={`h-2 w-2 shrink-0 rounded-full ${DIFFICULTY_DOT[data.difficulty] || 'bg-muted'}`} />
      {data.solved ? (
        <CheckCircle2 size={12} className="shrink-0 text-success" />
      ) : (
        <Circle size={12} className="shrink-0 text-muted" />
      )}
      <span className="truncate text-slate-100">{data.label}</span>
      {data.favorite && <Star size={11} className="shrink-0 text-warning" fill="#FBBF24" />}
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

export function TopicNode({ data, selected }) {
  return <HubNode icon={Layers} color="#A855F7" label={data.label} selected={selected} />;
}

export function CompanyNode({ data, selected }) {
  return <HubNode icon={Building2} color="#5B8DEF" label={data.label} selected={selected} />;
}

export function CollectionNode({ data, selected }) {
  return <HubNode icon={FolderKanban} color={data.color || '#22C55E'} label={data.label} selected={selected} />;
}

function HubNode({ icon: Icon, color, label, selected }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-glow backdrop-blur-glass transition-colors ${
        selected ? 'border-white/40' : 'border-white/10'
      }`}
      style={{ backgroundColor: `${color}26`, color }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Icon size={14} />
      <span className="max-w-[160px] truncate text-slate-100">{label}</span>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

export const NODE_TYPES = {
  question: QuestionNode,
  topic: TopicNode,
  company: CompanyNode,
  collection: CollectionNode,
};
