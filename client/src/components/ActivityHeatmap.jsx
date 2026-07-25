import { useMemo } from 'react';
import { Flame } from 'lucide-react';

const WEEKS_TO_SHOW = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

function toKey(date) {
  return date.toISOString().slice(0, 10);
}

function intensityClass(count) {
  if (!count) return 'bg-white/[0.04]';
  if (count === 1) return 'bg-accent-blue/30';
  if (count === 2) return 'bg-accent-blue/55';
  if (count === 3) return 'bg-accent-purple/70';
  return 'bg-accent-gradient';
}

export default function ActivityHeatmap({ data = [], currentStreak = 0, longestStreak = 0 }) {
  const countByDate = useMemo(() => {
    const map = new Map();
    data.forEach((d) => map.set(d.date, d.count));
    return map;
  }, [data]);

  const days = WEEKS_TO_SHOW * 7;
  const cells = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * DAY_MS);
      const key = toKey(date);
      result.push({ key, date, count: countByDate.get(key) || 0 });
    }
    return result;
  }, [countByDate, days]);

  // Group into weeks (columns), Sunday-start
  const weeks = useMemo(() => {
    const cols = [];
    let col = [];
    cells.forEach((cell, idx) => {
      col.push(cell);
      if (col.length === 7 || idx === cells.length - 1) {
        cols.push(col);
        col = [];
      }
    });
    return cols;
  }, [cells]);

  return (
    <div className="glass-card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold">Consistency</h3>
          <p className="text-xs text-muted">Every solved or reviewed question, day by day</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1.5">
          <Flame size={16} className="animate-flicker text-warning" />
          <span className="text-sm font-semibold">
            {currentStreak} day{currentStreak === 1 ? '' : 's'}
          </span>
          <span className="text-xs text-muted">· best {longestStreak}</span>
        </div>
      </div>

      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {weeks.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((cell) => (
              <div
                key={cell.key}
                title={`${cell.key}: ${cell.count} activit${cell.count === 1 ? 'y' : 'ies'}`}
                className={`h-3 w-3 rounded-[3px] ${intensityClass(cell.count)} transition-transform hover:scale-125`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted">
        <span>Less</span>
        <div className="h-3 w-3 rounded-[3px] bg-white/[0.04]" />
        <div className="h-3 w-3 rounded-[3px] bg-accent-blue/30" />
        <div className="h-3 w-3 rounded-[3px] bg-accent-blue/55" />
        <div className="h-3 w-3 rounded-[3px] bg-accent-purple/70" />
        <div className="h-3 w-3 rounded-[3px] bg-accent-gradient" />
        <span>More</span>
      </div>
    </div>
  );
}
