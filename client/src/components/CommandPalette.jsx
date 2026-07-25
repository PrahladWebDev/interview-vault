import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, CornerDownLeft, Building2, Layers, FileText, Code2, Tag } from 'lucide-react';
import { searchQuestions } from '../api/search.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { DifficultyBadge } from './ui.jsx';

const MATCH_ICON = { title: FileText, notes: FileText, tags: Tag, code: Code2 };

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebouncedValue(query, 250);

  const { data: results, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchQuestions(debouncedQuery),
    enabled: open && debouncedQuery.trim().length >= 2,
  });

  const items = useMemo(() => results || [], [results]);

  // Global Ctrl/Cmd+K toggles the palette from anywhere in the app.
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    function onOpenRequest() {
      setOpen(true);
    }
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('open-command-palette', onOpenRequest);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('open-command-palette', onOpenRequest);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [items.length]);

  function go(question) {
    setOpen(false);
    navigate(`/questions/${question._id}`);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && items[activeIndex]) {
      e.preventDefault();
      go(items[activeIndex]);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/60 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="glass-card w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <Search size={17} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-muted"
            placeholder="Search titles, notes, tags, code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd className="shrink-0 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-muted">
            esc
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {debouncedQuery.trim().length < 2 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">Type at least 2 characters to search.</p>
          ) : isFetching && items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">Searching…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">No matches for "{debouncedQuery}".</p>
          ) : (
            items.map((item, i) => {
              const Icon = MATCH_ICON[item.matchedIn[0]] || FileText;
              return (
                <button
                  key={item._id}
                  onClick={() => go(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    i === activeIndex ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={16} className="mt-0.5 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-100">{item.title}</span>
                      <DifficultyBadge difficulty={item.difficulty} />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {item.company && (
                        <span className="flex items-center gap-1">
                          <Building2 size={11} /> {item.company}
                        </span>
                      )}
                      {item.topic && (
                        <span className="flex items-center gap-1">
                          <Layers size={11} /> {item.topic}
                        </span>
                      )}
                    </div>
                    {item.snippet && (
                      <p className="mt-1 truncate text-xs text-muted/80">
                        matched in <span className="capitalize">{item.matchedIn.join(', ')}</span> — {item.snippet}
                      </p>
                    )}
                  </div>
                  {i === activeIndex && <CornerDownLeft size={14} className="mt-1 shrink-0 text-muted" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
