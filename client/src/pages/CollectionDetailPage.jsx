import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, FolderKanban, Trash2, Star, X, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  fetchCollection,
  updateCollectionRequest,
  deleteCollectionRequest,
  removeQuestionFromCollectionRequest,
  reorderCollectionQuestionsRequest,
} from '../api/collections.js';
import { toggleFavoriteRequest } from '../api/questions.js';
import { exportCollection as exportCollectionRequest } from '../api/exportImport.js';
import { DifficultyBadge } from '../components/ui.jsx';
import ExportMenu from '../components/ExportMenu.jsx';

export default function CollectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: collection, isLoading } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => fetchCollection(id),
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Local, optimistic ordering while a drag is in flight / being persisted -
  // kept separate from server data so the list doesn't jump during the save.
  const [orderedQuestions, setOrderedQuestions] = useState([]);

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || '');
      setOrderedQuestions(collection.questions);
    }
  }, [collection]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateMutation = useMutation({
    mutationFn: (payload) => updateCollectionRequest(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['collection', id], updated);
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCollectionRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      navigate('/collections');
    },
  });

  const removeQuestionMutation = useMutation({
    mutationFn: (questionId) => removeQuestionFromCollectionRequest(id, questionId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['collection', id], updated);
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: toggleFavoriteRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collection', id] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (questionIds) => reorderCollectionQuestionsRequest(id, questionIds),
    onSuccess: (updated) => {
      queryClient.setQueryData(['collection', id], updated);
    },
    onError: () => {
      // Roll back to server order if the persist failed.
      if (collection) setOrderedQuestions(collection.questions);
    },
  });

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedQuestions((items) => {
      const oldIndex = items.findIndex((q) => q._id === active.id);
      const newIndex = items.findIndex((q) => q._id === over.id);
      const next = arrayMove(items, oldIndex, newIndex);
      reorderMutation.mutate(next.map((q) => q._id));
      return next;
    });
  }

  if (isLoading || !collection) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/3 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-40 animate-pulse rounded-xl2 bg-white/[0.04]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/collections" className="inline-flex items-center gap-1 text-sm text-muted hover:text-slate-100">
        <ChevronLeft size={16} /> Collections
      </Link>

      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${collection.color}22`, color: collection.color }}
            >
              <FolderKanban size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <input
                className="w-full bg-transparent font-display text-2xl font-semibold text-slate-100 outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => name.trim() && name !== collection.name && updateMutation.mutate({ name: name.trim() })}
              />
              <textarea
                className="mt-2 w-full resize-none bg-transparent text-sm text-muted outline-none"
                placeholder="Add a description…"
                value={description}
                rows={1}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => description !== (collection.description || '') && updateMutation.mutate({ description })}
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ExportMenu
              label="Export"
              disabled={collection.questions.length === 0}
              onExport={(format) => exportCollectionRequest(collection._id, collection.name, { format })}
            />
            <button
              onClick={() => {
                if (confirm(`Delete "${collection.name}"? Questions themselves won't be deleted.`)) {
                  deleteMutation.mutate();
                }
              }}
              className="btn-ghost border-danger/30 text-danger hover:bg-danger/10"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </div>

      {orderedQuestions.length === 0 ? (
        <div className="glass-card p-16 text-center text-sm text-muted">
          No questions in this collection yet. Open a question and use "Collections" to add it here.
        </div>
      ) : (
        <>
          <p className="text-xs text-muted">Drag the handle to reorder.</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedQuestions.map((q) => q._id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {orderedQuestions.map((q) => (
                  <SortableQuestionRow
                    key={q._id}
                    question={q}
                    onToggleFavorite={() => favoriteMutation.mutate(q._id)}
                    onRemove={() => removeQuestionMutation.mutate(q._id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}

function SortableQuestionRow({ question: q, onToggleFavorite, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="glass-card flex items-center justify-between gap-3 p-4"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab touch-none text-muted hover:text-slate-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
        <button onClick={onToggleFavorite} aria-label="Toggle favorite" className="shrink-0 text-muted hover:text-warning">
          <Star size={16} fill={q.favorite ? '#FBBF24' : 'none'} className={q.favorite ? 'text-warning' : ''} />
        </button>
        <Link to={`/questions/${q._id}`} className="truncate text-sm font-medium text-slate-100 hover:text-white">
          {q.title}
        </Link>
        <DifficultyBadge difficulty={q.difficulty} />
        {q.company && <span className="badge hidden sm:inline-flex">{q.company}</span>}
        {q.topic && <span className="badge hidden sm:inline-flex">{q.topic}</span>}
      </div>
      <button onClick={onRemove} className="shrink-0 text-muted hover:text-danger" aria-label="Remove from collection">
        <X size={16} />
      </button>
    </div>
  );
}
