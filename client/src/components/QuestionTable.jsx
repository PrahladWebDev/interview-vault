import { Link } from 'react-router-dom';
import { Star, CheckCircle2, Circle } from 'lucide-react';
import { DifficultyBadge } from './ui.jsx';

export default function QuestionTable({ questions, onToggleFavorite }) {
  return (
    <div className="glass-card overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Difficulty</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Topic</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-center">Favorite</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q._id} className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.02]">
              <td className="max-w-[280px] truncate px-4 py-3">
                <Link to={`/questions/${q._id}`} className="font-medium text-slate-100 hover:text-accent-blue">
                  {q.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <DifficultyBadge difficulty={q.difficulty} />
              </td>
              <td className="px-4 py-3 text-muted">{q.company || '—'}</td>
              <td className="px-4 py-3 text-muted">{q.topic || '—'}</td>
              <td className="px-4 py-3">
                {q.solved ? (
                  <span className="flex items-center gap-1.5 text-success">
                    <CheckCircle2 size={14} /> Solved
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted">
                    <Circle size={14} /> Pending
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onToggleFavorite(q._id)}
                  aria-label={q.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  className="text-muted hover:text-warning"
                >
                  <Star size={16} fill={q.favorite ? '#FBBF24' : 'none'} className={q.favorite ? 'text-warning' : ''} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
