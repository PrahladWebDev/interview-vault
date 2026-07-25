import { CheckCircle2, RotateCcw, PlusCircle, Pencil } from 'lucide-react';

const ICONS = {
  solved: { icon: CheckCircle2, color: 'text-success' },
  reviewed: { icon: RotateCcw, color: 'text-accent-blue' },
  added: { icon: PlusCircle, color: 'text-accent-purple' },
  updated: { icon: Pencil, color: 'text-muted' },
};

const LABELS = {
  solved: 'Solved',
  reviewed: 'Reviewed',
  added: 'Added',
  updated: 'Updated',
};

export default function RecentActivity({ items = [] }) {
  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 font-display text-base font-semibold">Recent activity</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Nothing here yet — solve or add a question to get started.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((event, i) => {
            const meta = ICONS[event.type] || ICONS.updated;
            const Icon = meta.icon;
            return (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Icon size={16} className={`mt-0.5 shrink-0 ${meta.color}`} />
                <div className="min-w-0">
                  <p className="truncate text-slate-100">
                    <span className="font-medium">{LABELS[event.type] || event.type}</span>{' '}
                    {event.title && <span className="text-muted">· {event.title}</span>}
                  </p>
                  <p className="text-xs text-muted">{new Date(event.at).toLocaleString()}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
