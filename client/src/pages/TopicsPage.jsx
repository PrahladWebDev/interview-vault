import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchTopicProgress } from '../api/dashboard.js';

export default function TopicsPage() {
  const { data: topics, isLoading } = useQuery({
    queryKey: ['dashboard', 'topics'],
    queryFn: fetchTopicProgress,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Topics</h1>
        <p className="mt-1 text-sm text-muted">Progress broken down by topic tag.</p>
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : !topics?.length ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {topics.map((t, i) => (
            <TopicCard key={t.topic} topic={t} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicCard({ topic, index }) {
  const pct = topic.total ? Math.round((topic.solved / topic.total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.02 }}
    >
      <Link
        to={`/topics/${encodeURIComponent(topic.topic)}`}
        className="glass-card group flex flex-col gap-4 p-5 transition-colors hover:border-white/20"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-accent-purple">
              <Layers size={16} />
            </div>
            <h3 className="truncate font-display text-base font-semibold text-slate-100 group-hover:text-white">
              {topic.topic}
            </h3>
          </div>
          <span className="shrink-0 text-xs text-muted">
            {topic.solved}/{topic.total}
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-accent-gradient transition-all" style={{ width: `${pct}%` }} />
        </div>

        <span className="text-xs text-muted">{pct}% solved</span>
      </Link>
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card h-28 animate-pulse p-5">
          <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
          <div className="mt-4 h-1.5 w-full rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 p-16 text-center">
      <div className="rounded-full bg-white/[0.04] p-4">
        <Layers size={24} className="text-muted" />
      </div>
      <h3 className="font-display text-lg font-semibold">No topics yet</h3>
      <p className="max-w-sm text-sm text-muted">Tag questions with a topic to see them grouped here.</p>
    </div>
  );
}
