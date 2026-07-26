import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Search, LayoutGrid, Rows3, Plus, Star, Upload } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { fetchQuestions, fetchFacets, toggleFavoriteRequest, createQuestionRequest } from '../api/questions.js';
import { exportQuestions as exportQuestionsRequest, importQuestionsFromFile } from '../api/exportImport.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { Select } from '../components/ui.jsx';
import QuestionCard from '../components/QuestionCard.jsx';
import QuestionTable from '../components/QuestionTable.jsx';
import NewQuestionModal from '../components/NewQuestionModal.jsx';
import ExportMenu from '../components/ExportMenu.jsx';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'];
const STATUSES = ['solved', 'pending', 'revisionDue'];

export default function QuestionLibraryPage() {
  const [view, setView] = useState('card'); // 'card' | 'table'
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ difficulty: undefined, company: undefined, topic: undefined, language: undefined, status: undefined, favorite: undefined });
  const [sortBy, setSortBy] = useState('createdAt');
  const [modalOpen, setModalOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search);
  const queryClient = useQueryClient();
  const sentinelRef = useRef(null);
  const importInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState(null); // { kind: 'success'|'error', message }

  const { data: facets } = useQuery({ queryKey: ['facets'], queryFn: fetchFacets });

  const queryParams = useMemo(
    () => ({ search: debouncedSearch || undefined, sortBy, ...filters }),
    [debouncedSearch, sortBy, filters]
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
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

  const createMutation = useMutation({
    mutationFn: createQuestionRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['facets'] });
      setModalOpen(false);
    },
  });

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setImportStatus(null);
    try {
      const result = await importQuestionsFromFile(file);
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['facets'] });
      setImportStatus({
        kind: 'success',
        message: `Imported ${result.imported} question${result.imported === 1 ? '' : 's'}${
          result.skipped ? ` · skipped ${result.skipped} invalid` : ''
        }.`,
      });
    } catch (err) {
      setImportStatus({
        kind: 'error',
        message: err?.response?.data?.message || err.message || 'Import failed.',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Question Library</h1>
          <p className="mt-1 text-sm text-muted">{total} question{total === 1 ? '' : 's'} in your vault</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportMenu label="Export all" onExport={(format) => exportQuestionsRequest({ format })} />
          <button onClick={() => importInputRef.current?.click()} className="btn-ghost">
            <Upload size={16} /> Import
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New question
          </button>
        </div>
      </div>

      {importStatus && (
        <div
          className={`glass-card px-4 py-3 text-sm ${
            importStatus.kind === 'success' ? 'text-success' : 'text-danger'
          }`}
        >
          {importStatus.message}
        </div>
      )}

      <div className="glass-card space-y-3 p-4">
        <div className="relative w-full">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input-field w-full pl-9"
            placeholder="Search title, notes, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.difficulty}
            onChange={(v) => updateFilter('difficulty', v)}
            options={DIFFICULTIES}
            placeholder="Difficulty"
            className="w-[calc(50%-4px)] sm:w-36"
          />
          <Select
            value={filters.company}
            onChange={(v) => updateFilter('company', v)}
            options={facets?.companies || []}
            placeholder="Company"
            className="w-[calc(50%-4px)] sm:w-40"
          />
          <Select
            value={filters.topic}
            onChange={(v) => updateFilter('topic', v)}
            options={facets?.topics || []}
            placeholder="Topic"
            className="w-[calc(50%-4px)] sm:w-40"
          />
          <Select
            value={filters.language}
            onChange={(v) => updateFilter('language', v)}
            options={LANGUAGES}
            placeholder="Language"
            className="w-[calc(50%-4px)] sm:w-36"
          />
          <Select
            value={filters.status}
            onChange={(v) => updateFilter('status', v)}
            options={STATUSES}
            placeholder="Status"
            className="w-[calc(50%-4px)] sm:w-40"
          />

          <button
            onClick={() => updateFilter('favorite', filters.favorite === 'true' ? undefined : 'true')}
            className={`btn-ghost w-[calc(50%-4px)] justify-center sm:w-auto sm:justify-start ${
              filters.favorite === 'true' ? 'border-warning/40 text-warning' : ''
            }`}
          >
            <Star size={16} fill={filters.favorite === 'true' ? '#FBBF24' : 'none'} /> Favorites
          </button>

          <Select
            value={sortBy}
            onChange={(v) => setSortBy(v || 'createdAt')}
            options={['createdAt', 'updatedAt', 'title', 'difficulty', 'personalRating']}
            placeholder="Sort by"
            className="w-[calc(50%-4px)] sm:ml-auto sm:w-40"
          />

          <div className="flex w-full overflow-hidden rounded-lg border border-white/10 sm:w-auto">
            <button
              onClick={() => setView('card')}
              className={`flex-1 p-2 sm:flex-none ${view === 'card' ? 'bg-white/[0.08] text-white' : 'text-muted'}`}
              aria-label="Card view"
            >
              <LayoutGrid size={16} className="mx-auto" />
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex-1 p-2 sm:flex-none ${view === 'table' ? 'bg-white/[0.08] text-white' : 'text-muted'}`}
              aria-label="Table view"
            >
              <Rows3 size={16} className="mx-auto" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : questions.length === 0 ? (
        <EmptyState onCreate={() => setModalOpen(true)} />
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

      <NewQuestionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={createMutation.mutate}
        creating={createMutation.isPending}
        companies={facets?.companies || []}
        topics={facets?.topics || []}
      />
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

function EmptyState({ onCreate }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 p-16 text-center">
      <div className="rounded-full bg-white/[0.04] p-4">
        <Search size={24} className="text-muted" />
      </div>
      <h3 className="font-display text-lg font-semibold">No questions match yet</h3>
      <p className="max-w-sm text-sm text-muted">
        Try clearing a filter, or add the first question to your vault.
      </p>
      <button onClick={onCreate} className="btn-primary mt-2">
        <Plus size={16} /> New question
      </button>
    </div>
  );
}
