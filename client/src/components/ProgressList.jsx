import { Link } from 'react-router-dom';

export default function ProgressList({ title, items = [], labelKey, emptyHint, linkPrefix }) {
  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 font-display text-base font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{emptyHint}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const pct = item.total ? Math.round((item.solved / item.total) * 100) : 0;
            const row = (
              <>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-100">{item[labelKey]}</span>
                  <span className="text-xs text-muted">
                    {item.solved}/{item.total}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-accent-gradient transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </>
            );
            return linkPrefix ? (
              <Link
                key={item[labelKey]}
                to={`${linkPrefix}/${encodeURIComponent(item[labelKey])}`}
                className="block transition-opacity hover:opacity-80"
              >
                {row}
              </Link>
            ) : (
              <div key={item[labelKey]}>{row}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
