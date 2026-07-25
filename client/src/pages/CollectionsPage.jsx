import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderKanban, Trash2, X } from 'lucide-react';
import { fetchCollections, createCollectionRequest, deleteCollectionRequest } from '../api/collections.js';

const SWATCHES = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#A855F7'];

export default function CollectionsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: collections, isLoading } = useQuery({ queryKey: ['collections'], queryFn: fetchCollections });

  const createMutation = useMutation({
    mutationFn: createCollectionRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCollectionRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collections'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Collections</h1>
          <p className="mt-1 text-sm text-muted">Group questions into custom study sets.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} /> New collection
        </button>
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : !collections?.length ? (
        <EmptyState onCreate={() => setModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {collections.map((c) => (
              <CollectionCard
                key={c._id}
                collection={c}
                onDelete={() => {
                  if (confirm(`Delete "${c.name}"? Questions themselves won't be deleted.`)) {
                    deleteMutation.mutate(c._id);
                  }
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <NewCollectionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(payload) => createMutation.mutate(payload)}
        creating={createMutation.isPending}
        error={createMutation.error?.response?.data?.message}
      />
    </div>
  );
}

function CollectionCard({ collection, onDelete }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} layout>
      <Link
        to={`/collections/${collection._id}`}
        className="glass-card group flex flex-col gap-4 p-5 transition-colors hover:border-white/20"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${collection.color}22`, color: collection.color }}
            >
              <FolderKanban size={16} />
            </div>
            <h3 className="truncate font-display text-base font-semibold text-slate-100 group-hover:text-white">
              {collection.name}
            </h3>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            className="shrink-0 text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
            aria-label="Delete collection"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {collection.description && <p className="line-clamp-2 text-sm text-muted">{collection.description}</p>}

        <span className="mt-auto text-xs text-muted">
          {collection.questionCount} question{collection.questionCount === 1 ? '' : 's'}
        </span>
      </Link>
    </motion.div>
  );
}

function NewCollectionModal({ open, onClose, onCreate, creating, error }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(SWATCHES[0]);

  if (!open) return null;

  function submit() {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim(), color });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">New collection</h3>
          <button onClick={onClose} className="text-muted hover:text-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Name</label>
            <input
              autoFocus
              className="input-field"
              placeholder="e.g. FAANG onsite prep"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Description (optional)</label>
            <textarea
              className="input-field min-h-[70px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Color</label>
            <div className="flex gap-2">
              {SWATCHES.map((sw) => (
                <button
                  key={sw}
                  onClick={() => setColor(sw)}
                  className={`h-7 w-7 rounded-full transition-transform ${color === sw ? 'scale-110 ring-2 ring-white/60' : ''}`}
                  style={{ backgroundColor: sw }}
                  aria-label={sw}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <button onClick={submit} disabled={!name.trim() || creating} className="btn-primary w-full justify-center">
            {creating ? 'Creating…' : 'Create collection'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card h-32 animate-pulse p-5">
          <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
          <div className="mt-3 h-3 w-1/2 rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 p-16 text-center">
      <div className="rounded-full bg-white/[0.04] p-4">
        <FolderKanban size={24} className="text-muted" />
      </div>
      <h3 className="font-display text-lg font-semibold">No collections yet</h3>
      <p className="max-w-sm text-sm text-muted">
        Create a collection to group related questions into a custom study set.
      </p>
      <button onClick={onCreate} className="btn-primary mt-2">
        <Plus size={16} /> New collection
      </button>
    </div>
  );
}
