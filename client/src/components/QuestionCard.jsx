import { Link } from 'react-router-dom';
import { Star, CheckCircle2, Circle, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { DifficultyBadge } from './ui.jsx';

export default function QuestionCard({ question, onToggleFavorite }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="glass-card group relative flex flex-col gap-3 p-5 transition-colors hover:border-white/20"
    >
      <div className="flex items-start justify-between gap-2">
        <Link to={`/questions/${question._id}`} className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-semibold text-slate-100 group-hover:text-white">
            {question.title}
          </h3>
        </Link>
        <button
          onClick={() => onToggleFavorite(question._id)}
          aria-label={question.favorite ? 'Remove from favorites' : 'Add to favorites'}
          className="shrink-0 text-muted transition-colors hover:text-warning"
        >
          <Star size={18} fill={question.favorite ? '#FBBF24' : 'none'} className={question.favorite ? 'text-warning' : ''} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <DifficultyBadge difficulty={question.difficulty} />
        {question.company && (
          <span className="badge">
            <Building2 size={12} /> {question.company}
          </span>
        )}
        {question.topic && <span className="badge">{question.topic}</span>}
      </div>

      {question.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {question.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-white/[0.03] px-2 py-0.5 text-[11px] text-muted">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          {question.solved ? (
            <>
              <CheckCircle2 size={14} className="text-success" /> Solved
            </>
          ) : (
            <>
              <Circle size={14} /> Pending
            </>
          )}
        </span>
        <Link to={`/questions/${question._id}`} className="font-medium text-accent-blue hover:underline">
          Open →
        </Link>
      </div>
    </motion.div>
  );
}
