import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Layers } from 'lucide-react';
import { fetchTopicProgress } from '../api/dashboard.js';
import FacetQuestionList from '../components/FacetQuestionList.jsx';

export default function TopicDetailPage() {
  const { name } = useParams();
  const topic = decodeURIComponent(name);

  const { data: topics } = useQuery({ queryKey: ['dashboard', 'topics'], queryFn: fetchTopicProgress });
  const stats = topics?.find((t) => t.topic === topic);

  return (
    <div className="space-y-6">
      <Link to="/topics" className="inline-flex items-center gap-1 text-sm text-muted hover:text-slate-100">
        <ChevronLeft size={16} /> Topics
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-accent-purple">
          <Layers size={20} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold">{topic}</h1>
          {stats && (
            <p className="mt-1 text-sm text-muted">
              {stats.solved}/{stats.total} solved
            </p>
          )}
        </div>
      </div>

      <FacetQuestionList filterKey="topic" filterValue={topic} />
    </div>
  );
}
