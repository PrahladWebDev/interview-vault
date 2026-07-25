import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { LayoutGrid, Rows3 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { fetchQuestions, toggleFavoriteRequest } from '../api/questions.js';
import { Select } from './ui.jsx';
import QuestionCard from './QuestionCard.jsx';
import QuestionTable from './QuestionTable.jsx';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const STATUSES = ['solved', 'pending', 'revisionDue'];

// Renders a paginated, filterable grid/table of questions scoped to a single
// facet value (e.g. one company or one topic). filterKey/filterValue pin the
// scope; the rest behaves like a trimmed-down QuestionLibraryPage.
export default function FacetQuestionList({ filterKey, filterValue }) {
  const [view, setView] = useState('card');
  const [difficulty, setDifficulty] = useState(undefined);
  const [status, setStatus] = useState(undefined);
  const [sortBy, setSortBy] = useState('createdAt');

  const queryClient = useQueryClient();
  const sentinelRef = useRef(null);

  const queryParams = useMemo(
    () => ({ [filterKey]: filterValue, difficulty, status, sortBy }),
    [filterKey, filterValue, difficulty, status, sortBy]
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['questions', queryParams],
    queryFn: ({ pageParam = 1 }) => fetchQuestions({ ...queryParams, page: pageParam, limit: 12 }),
    getNextPageParam: (lastPage) => (lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined),
    initialPageParam: 1,
  });

  const questions = data?.pages.flatMap((p) => p.items) || [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const favoriteMutation = useMutation({
    mutationFn: toggleFavoriteRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions'] }),
  });

  return (
    <div className="space-y-6">
      <div className="glass-card flex flex-wrap items-center gap-3 p-4">
        <span className="text-sm text-muted">{total} question{total === 1 ? '' : 's'}</span>

        <Select value={difficulty} onChange={setDifficulty} options={DIFFICULTIES} placeholder="Difficulty" className="w-36" />
        <Select value={status} onChange={setStatus} options={STATUSES} placeholder="Status" className="w-40" />
        <Select
          value={sortBy}
          onChange={(v) => setSortBy(v || 'createdAt')}
          options={['createdAt', 'updatedAt', 'title', 'difficulty', 'personalRating']}
          placeholder="Sort by"
          className="w-40"
        />

        <div className="ml-auto flex overflow-hidden rounded-lg border border-white/10">
          <button
            onClick={() => setView('card')}
            className={`p-2 ${view === 'card' ? 'bg-white/[0.08] text-white' : 'text-muted'}`}
            aria-label="Card view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-2 ${view === 'table' ? 'bg-white/[0.08] text-white' : 'text-muted'}`}
            aria-label="Table view"
          >
            <Rows3 size={16} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : questions.length === 0 ? (
        <div className="glass-card p-16 text-center text-sm text-muted">No questions match these filters.</div>
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {questions.map((q) => (
              <QuestionCard key={q._id} question={q} onToggleFavorite={favoriteMutation.mutate} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <QuestionTable questions={questions} onToggleFavorite={favoriteMutation.mutate} />
      )}

      <div ref={sentinelRef} className="h-6" />
      {isFetchingNextPage && <p className="text-center text-sm text-muted">Loading more…</p>}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card h-40 animate-pulse p-5">
          <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
          <div className="mt-3 h-3 w-1/2 rounded bg-white/[0.04]" />
          <div className="mt-6 h-3 w-1/3 rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}
