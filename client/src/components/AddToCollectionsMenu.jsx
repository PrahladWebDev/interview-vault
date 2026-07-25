import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Check, Plus } from 'lucide-react';
import {
  fetchCollectionsForQuestion,
  addQuestionsToCollectionRequest,
  removeQuestionFromCollectionRequest,
  createCollectionRequest,
} from '../api/collections.js';

export default function AddToCollectionsMenu({ questionId }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef(null);
  const queryClient = useQueryClient();

  const { data: collections } = useQuery({
    queryKey: ['collections', 'for-question', questionId],
    queryFn: () => fetchCollectionsForQuestion(questionId),
    enabled: open,
  });

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['collections', 'for-question', questionId] });
    queryClient.invalidateQueries({ queryKey: ['collections'] });
  }

  const addMutation = useMutation({
    mutationFn: (collectionId) => addQuestionsToCollectionRequest(collectionId, [questionId]),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (collectionId) => removeQuestionFromCollectionRequest(collectionId, questionId),
    onSuccess: invalidate,
  });

  const createMutation = useMutation({
    mutationFn: (name) => createCollectionRequest({ name }),
    onSuccess: async (collection) => {
      await addQuestionsToCollectionRequest(collection._id, [questionId]);
      invalidate();
      setNewName('');
      setCreating(false);
    },
  });

  function toggle(collection) {
    if (collection.included) removeMutation.mutate(collection._id);
    else addMutation.mutate(collection._id);
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="btn-ghost">
        <FolderPlus size={16} /> Collections
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-white/10 bg-surface p-2 shadow-xl">
          <div className="max-h-56 space-y-0.5 overflow-y-auto">
            {!collections?.length && <p className="px-2 py-2 text-xs text-muted">No collections yet.</p>}
            {collections?.map((c) => (
              <button
                key={c._id}
                onClick={() => toggle(c)}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-white/[0.05]"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="truncate">{c.name}</span>
                </span>
                {c.included && <Check size={14} className="shrink-0 text-accent-blue" />}
              </button>
            ))}
          </div>

          <div className="mt-2 border-t border-white/10 pt-2">
            {creating ? (
              <div className="flex gap-1.5">
                <input
                  autoFocus
                  className="input-field py-1 text-sm"
                  placeholder="Collection name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newName.trim()) createMutation.mutate(newName.trim());
                    if (e.key === 'Escape') setCreating(false);
                  }}
                />
                <button
                  disabled={!newName.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate(newName.trim())}
                  className="btn-primary px-2.5 py-1 text-sm"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-accent-blue hover:bg-white/[0.05]"
              >
                <Plus size={14} /> New collection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
