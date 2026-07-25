import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Star,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Youtube,
  BookOpen,
  FileText,
  Link as LinkIcon,
  Play,
  Loader2,
  Terminal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  Plus,
} from 'lucide-react';
import {
  fetchQuestion,
  updateQuestionRequest,
  deleteQuestionRequest,
  toggleFavoriteRequest,
  markSolvedRequest,
  reviewQuestionRequest,
  createQuestionRequest,
} from '../api/questions.js';
import { runCodeRequest } from '../api/execute.js';
import { explainCodeRequest, suggestSimilarQuestionsRequest, summarizeNotesRequest } from '../api/ai.js';
import { exportQuestions as exportQuestionsRequest } from '../api/exportImport.js';
import { DifficultyBadge, Select } from '../components/ui.jsx';
import AddToCollectionsMenu from '../components/AddToCollectionsMenu.jsx';
import MockInterviewModal from '../components/MockInterviewModal.jsx';
import ExportMenu from '../components/ExportMenu.jsx';

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'];
const MONACO_LANG = { cpp: 'cpp', javascript: 'javascript', typescript: 'typescript', python: 'python', java: 'java', go: 'go', rust: 'rust' };
const TABS = ['Code', 'Theory Answer', 'Explanation', 'Resources', 'Notes'];

export default function QuestionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: question, isLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => fetchQuestion(id),
  });

  const [tab, setTab] = useState('Code');
  const [activeLang, setActiveLang] = useState('javascript');
  const [draft, setDraft] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [copied, setCopied] = useState(false);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [showInterview, setShowInterview] = useState(false);

  useEffect(() => {
    if (question) {
      setDraft(question);
      const firstLang = question.codeExamples?.[0]?.language;
      if (firstLang) setActiveLang(firstLang);
    }
  }, [question]);

  const updateMutation = useMutation({
    mutationFn: (payload) => updateQuestionRequest(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['question', id], updated);
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setSavedAt(new Date());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteQuestionRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      navigate('/library');
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: () => toggleFavoriteRequest(id),
    onSuccess: (updated) => queryClient.setQueryData(['question', id], updated),
  });

  const solveMutation = useMutation({
    mutationFn: (solved) => markSolvedRequest(id, solved),
    onSuccess: (updated) => {
      queryClient.setQueryData(['question', id], updated);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (remembered) => reviewQuestionRequest(id, remembered),
    onSuccess: (updated) => {
      queryClient.setQueryData(['question', id], updated);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const runMutation = useMutation({
    mutationFn: ({ language, code, stdin: input }) => runCodeRequest({ language, code, stdin: input }),
  });

  const explainMutation = useMutation({
    mutationFn: (language) => explainCodeRequest(id, language),
  });

  const similarMutation = useMutation({
    mutationFn: () => suggestSimilarQuestionsRequest(id),
  });

  const addSuggestedMutation = useMutation({
    mutationFn: (payload) => createQuestionRequest(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions'] }),
  });

  const summarizeMutation = useMutation({
    mutationFn: () => summarizeNotesRequest(id),
  });

  if (isLoading || !draft) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/3 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-64 animate-pulse rounded-xl2 bg-white/[0.04]" />
      </div>
    );
  }

  function saveField(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function saveNested(path, value) {
    setDraft((d) => ({ ...d, [path[0]]: { ...d[path[0]], [path[1]]: value } }));
  }

  function persist(partial) {
    updateMutation.mutate(partial);
  }

  function updateCodeExample(language, code) {
    const examples = draft.codeExamples || [];
    const idx = examples.findIndex((c) => c.language === language);
    let next;
    if (idx >= 0) {
      next = examples.map((c, i) => (i === idx ? { ...c, code } : c));
    } else {
      next = [...examples, { language, code }];
    }
    setDraft((d) => ({ ...d, codeExamples: next }));
  }

  function saveCodeExamples() {
    persist({ codeExamples: draft.codeExamples });
  }

  function copyCode() {
    const code = draft.codeExamples?.find((c) => c.language === activeLang)?.code || '';
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const activeCode = draft.codeExamples?.find((c) => c.language === activeLang)?.code ?? '';
  const revision = draft.revision || {};

  return (
    <div className="space-y-6 pb-16">
      <Link to="/library" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-slate-100">
        <ArrowLeft size={15} /> Back to library
      </Link>

      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <input
              className="w-full bg-transparent font-display text-2xl font-semibold text-slate-100 outline-none"
              value={draft.title}
              onChange={(e) => saveField('title', e.target.value)}
              onBlur={() => persist({ title: draft.title })}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <DifficultyBadge difficulty={draft.difficulty} />
              {draft.company && <span className="badge">{draft.company}</span>}
              {draft.topic && <span className="badge">{draft.topic}</span>}
              {draft.round && <span className="badge">{draft.round}</span>}
              {draft.experienceLevel && <span className="badge">{draft.experienceLevel}</span>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => favoriteMutation.mutate()}
              className="btn-ghost"
              aria-label="Toggle favorite"
            >
              <Star size={16} fill={draft.favorite ? '#FBBF24' : 'none'} className={draft.favorite ? 'text-warning' : ''} />
            </button>
            <button
              onClick={() => solveMutation.mutate(!draft.solved)}
              className={`btn-ghost ${draft.solved ? 'border-success/40 text-success' : ''}`}
            >
              <CheckCircle2 size={16} /> {draft.solved ? 'Solved' : 'Mark solved'}
            </button>
            <AddToCollectionsMenu questionId={id} />
            <ExportMenu
              label="Export"
              onExport={(format) => exportQuestionsRequest({ format, ids: [id] })}
            />
            <button onClick={() => setShowInterview(true)} className="btn-ghost">
              <MessageSquare size={16} /> Mock interview
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this question? This cannot be undone.')) deleteMutation.mutate();
              }}
              className="btn-ghost border-danger/30 text-danger hover:bg-danger/10"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {draft.solved && (
        <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-medium">Spaced repetition</p>
            <p className="text-xs text-muted">
              Status: <span className="capitalize text-slate-100">{revision.status}</span>
              {revision.nextRevisionDate && (
                <> · next review {new Date(revision.nextRevisionDate).toLocaleDateString()}</>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => reviewMutation.mutate(false)} className="btn-ghost">
              <RotateCcw size={14} /> Forgot it
            </button>
            <button onClick={() => reviewMutation.mutate(true)} className="btn-primary">
              <Check size={14} /> Remembered it
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-white/[0.06]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'border-b-2 border-accent-blue text-white' : 'text-muted hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Code' && (
        <div className="glass-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] p-3">
            <div className="flex flex-wrap gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setActiveLang(lang);
                    runMutation.reset();
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeLang === lang ? 'bg-white/[0.08] text-white' : 'text-muted hover:bg-white/[0.03]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={copyCode} className="btn-ghost">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={saveCodeExamples} className="btn-primary" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save code'}
              </button>
              <button
                onClick={() => runMutation.mutate({ language: activeLang, code: activeCode, stdin })}
                className="btn-primary bg-success/90 hover:bg-success disabled:opacity-60"
                disabled={runMutation.isPending || !activeCode.trim()}
              >
                {runMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}{' '}
                {runMutation.isPending ? 'Running…' : 'Run'}
              </button>
              <button
                onClick={() => explainMutation.mutate(activeLang)}
                className="btn-ghost"
                disabled={explainMutation.isPending || !activeCode.trim()}
              >
                {explainMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}{' '}
                Explain with AI
              </button>
            </div>
          </div>
          <Editor
            height="420px"
            theme="vs-dark"
            language={MONACO_LANG[activeLang]}
            value={activeCode}
            onChange={(v) => updateCodeExample(activeLang, v ?? '')}
            options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 16 } }}
          />

          <div className="border-t border-white/[0.06]">
            <button
              onClick={() => setShowStdin((s) => !s)}
              className="flex w-full items-center gap-1.5 px-4 py-2 text-xs font-medium text-muted hover:text-slate-200"
            >
              {showStdin ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Stdin (optional)
            </button>
            {showStdin && (
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Input passed to your program's stdin…"
                className="input-field mx-4 mb-3 min-h-[70px] w-[calc(100%-2rem)] resize-y font-mono text-xs"
              />
            )}
          </div>

          <RunOutput result={runMutation.data} error={runMutation.error} pending={runMutation.isPending} />
          <ExplainPanel
            result={explainMutation.data}
            error={explainMutation.error}
            pending={explainMutation.isPending}
          />
        </div>
      )}

      {tab === 'Theory Answer' && (
        <TheoryTab
          theoryAnswer={draft.theoryAnswer || ''}
          onChange={(v) => saveField('theoryAnswer', v)}
          onSave={() => persist({ theoryAnswer: draft.theoryAnswer })}
          saving={updateMutation.isPending}
        />
      )}

      {tab === 'Explanation' && (
        <ExplanationTab
          explanation={draft.explanation || {}}
          onChange={(field, value) => saveNested(['explanation', field], value)}
          onSave={() => persist({ explanation: draft.explanation })}
          saving={updateMutation.isPending}
          similarMutation={similarMutation}
          addSuggestedMutation={addSuggestedMutation}
        />
      )}

      {tab === 'Resources' && (
        <ResourcesTab
          resources={draft.resources || { youtube: [], blog: [], docs: [], pdf: [] }}
          onChange={(next) => saveField('resources', next)}
          onSave={() => persist({ resources: draft.resources })}
          saving={updateMutation.isPending}
        />
      )}

      {tab === 'Notes' && (
        <NotesTab
          notes={draft.notes || ''}
          onChange={(v) => saveField('notes', v)}
          onSave={() => persist({ notes: draft.notes })}
          saving={updateMutation.isPending}
          summarizeMutation={summarizeMutation}
        />
      )}

      {savedAt && <p className="text-right text-xs text-muted">Saved {savedAt.toLocaleTimeString()}</p>}

      <MockInterviewModal
        open={showInterview}
        onClose={() => setShowInterview(false)}
        questionId={id}
        questionTitle={draft.title}
      />
    </div>
  );
}

function RunOutput({ result, error, pending }) {
  if (!pending && !result && !error) return null;

  const stdout = result?.run?.stdout ?? '';
  const stderr = result?.run?.stderr ?? '';
  const compileStderr = result?.compile?.stderr ?? '';
  const exitCode = result?.run?.code;
  const errorMessage = error?.response?.data?.message || (error ? 'Something went wrong while running your code.' : null);

  return (
    <div className="border-t border-white/[0.06] bg-black/20 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <Terminal size={13} /> Output
        </p>
        {result && (
          <span className={`text-xs ${exitCode === 0 ? 'text-success' : 'text-danger'}`}>
            Exit code {exitCode ?? '—'}
          </span>
        )}
      </div>

      {pending && <p className="font-mono text-xs text-muted">Running…</p>}

      {errorMessage && <p className="font-mono text-xs text-danger">{errorMessage}</p>}

      {result && (
        <div className="space-y-2">
          {compileStderr && (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs text-warning">
              {compileStderr}
            </pre>
          )}
          {stdout && (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs text-slate-100">
              {stdout}
            </pre>
          )}
          {stderr && (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs text-danger">{stderr}</pre>
          )}
          {!stdout && !stderr && !compileStderr && (
            <p className="font-mono text-xs text-muted">Program ran with no output.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ExplainPanel({ result, error, pending }) {
  if (!pending && !result && !error) return null;

  const errorMessage = error?.response?.data?.message || (error ? 'Could not generate an explanation.' : null);

  return (
    <div className="border-t border-white/[0.06] bg-white/[0.015] p-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
        <Sparkles size={13} /> AI explanation
      </p>
      {pending && <p className="text-xs text-muted">Reading through your solution…</p>}
      {errorMessage && <p className="text-xs text-danger">{errorMessage}</p>}
      {result && (
        <div className="prose prose-invert max-w-none text-sm">
          <ReactMarkdown>{result.explanation}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, onBlur, textarea = true, placeholder }) {
  const Comp = textarea ? 'textarea' : 'input';
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted">{label}</label>
      <Comp
        className={`input-field ${textarea ? 'min-h-[80px] resize-y' : ''}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}

function ExplanationTab({ explanation, onChange, onSave, saving, similarMutation, addSuggestedMutation }) {
  const fields = [
    ['detailed', 'Detailed explanation'],
    ['timeComplexity', 'Time complexity'],
    ['spaceComplexity', 'Space complexity'],
    ['edgeCases', 'Edge cases'],
    ['commonMistakes', 'Common mistakes'],
    ['interviewTips', 'Interview tips'],
    ['alternativeSolutions', 'Alternative solutions'],
  ];
  return (
    <div className="space-y-4">
      <div className="glass-card space-y-4 p-6">
        {fields.map(([key, label]) => (
          <Field
            key={key}
            label={label}
            value={explanation[key] || ''}
            onChange={(v) => onChange(key, v)}
            onBlur={onSave}
          />
        ))}
        <button onClick={onSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save explanation'}
        </button>
      </div>

      {similarMutation && <SimilarQuestionsPanel similarMutation={similarMutation} addSuggestedMutation={addSuggestedMutation} />}
    </div>
  );
}

function SimilarQuestionsPanel({ similarMutation, addSuggestedMutation }) {
  const [addedTitles, setAddedTitles] = useState([]);
  const errorMessage =
    similarMutation.error?.response?.data?.message || (similarMutation.error ? 'Could not generate suggestions.' : null);

  function addQuestion(q) {
    addSuggestedMutation.mutate(
      { title: q.title, description: q.description, difficulty: q.difficulty, topic: q.topic || '' },
      { onSuccess: () => setAddedTitles((t) => [...t, q.title]) }
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles size={15} className="text-accent-purple" /> Similar &amp; follow-up questions
        </h4>
        <button onClick={() => similarMutation.mutate()} disabled={similarMutation.isPending} className="btn-ghost">
          {similarMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}{' '}
          {similarMutation.isPending ? 'Thinking…' : similarMutation.data ? 'Regenerate' : 'Suggest with AI'}
        </button>
      </div>

      {errorMessage && <p className="text-xs text-danger">{errorMessage}</p>}

      {similarMutation.data && (
        <ul className="space-y-3">
          {similarMutation.data.map((q, i) => {
            const added = addedTitles.includes(q.title);
            return (
              <li key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100">{q.title}</p>
                    <p className="mt-1 text-xs text-muted">{q.description}</p>
                    <p className="mt-1.5 text-xs italic text-muted">{q.whyRelated}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      <DifficultyBadge difficulty={q.difficulty} />
                      {q.topic && <span className="badge">{q.topic}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => addQuestion(q)}
                    disabled={added || addSuggestedMutation.isPending}
                    className="btn-ghost shrink-0 disabled:opacity-60"
                  >
                    {added ? <Check size={14} /> : <Plus size={14} />} {added ? 'Added' : 'Add'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const RESOURCE_TYPES = [
  { key: 'youtube', label: 'YouTube', icon: Youtube },
  { key: 'blog', label: 'Blog posts', icon: BookOpen },
  { key: 'docs', label: 'Official docs', icon: LinkIcon },
  { key: 'pdf', label: 'PDFs', icon: FileText },
];

function ResourcesTab({ resources, onChange, onSave, saving }) {
  const [drafts, setDrafts] = useState({ youtube: '', blog: '', docs: '', pdf: '' });

  function addLink(type) {
    const url = drafts[type].trim();
    if (!url) return;
    const next = { ...resources, [type]: [...(resources[type] || []), { label: url, url }] };
    onChange(next);
    setDrafts({ ...drafts, [type]: '' });
  }

  function removeLink(type, idx) {
    const next = { ...resources, [type]: resources[type].filter((_, i) => i !== idx) };
    onChange(next);
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {RESOURCE_TYPES.map(({ key, label, icon: Icon }) => (
        <div key={key} className="glass-card p-5">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Icon size={16} className="text-accent-blue" /> {label}
          </h4>
          <div className="mb-3 flex gap-2">
            <input
              className="input-field"
              placeholder="https://…"
              value={drafts[key]}
              onChange={(e) => setDrafts({ ...drafts, [key]: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addLink(key)}
            />
            <button onClick={() => addLink(key)} className="btn-ghost">
              Add
            </button>
          </div>
          <ul className="space-y-1.5">
            {(resources[key] || []).map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <a href={r.url} target="_blank" rel="noreferrer" className="truncate text-accent-blue hover:underline">
                  {r.url}
                </a>
                <button onClick={() => removeLink(key, i)} className="text-xs text-muted hover:text-danger">
                  remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button onClick={onSave} disabled={saving} className="btn-primary col-span-full w-fit">
        {saving ? 'Saving…' : 'Save resources'}
      </button>
    </div>
  );
}

function TheoryTab({ theoryAnswer, onChange, onSave, saving }) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="glass-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Theory answer</h4>
          <p className="text-xs text-muted">Write out the full theoretical answer, e.g. "What is JS?"</p>
        </div>
        <button onClick={() => setPreview((p) => !p)} className="btn-ghost">
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>
      {preview ? (
        <div className="prose prose-invert max-w-none rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm">
          <ReactMarkdown>{theoryAnswer || '*Nothing written yet.*'}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          className="input-field min-h-[280px] resize-y font-mono text-sm"
          placeholder="Write your theoretical answer here…"
          value={theoryAnswer}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onSave}
        />
      )}
      <button onClick={onSave} disabled={saving} className="btn-primary mt-3">
        {saving ? 'Saving…' : 'Save theory answer'}
      </button>
    </div>
  );
}

function NotesTab({ notes, onChange, onSave, saving, summarizeMutation }) {
  const [preview, setPreview] = useState(false);
  const errorMessage =
    summarizeMutation?.error?.response?.data?.message || (summarizeMutation?.error ? 'Could not summarize notes.' : null);

  return (
    <div className="glass-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold">Personal notes</h4>
        <div className="flex gap-2">
          {summarizeMutation && (
            <button
              onClick={() => summarizeMutation.mutate()}
              disabled={summarizeMutation.isPending || !notes.trim()}
              className="btn-ghost"
            >
              {summarizeMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}{' '}
              Summarize with AI
            </button>
          )}
          <button onClick={() => setPreview((p) => !p)} className="btn-ghost">
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>
      {preview ? (
        <div className="prose prose-invert max-w-none rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm">
          <ReactMarkdown>{notes || '*Nothing written yet.*'}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          className="input-field min-h-[280px] resize-y font-mono text-sm"
          placeholder="Write markdown notes: checklists, tables, code blocks…"
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onSave}
        />
      )}
      <button onClick={onSave} disabled={saving} className="btn-primary mt-3">
        {saving ? 'Saving…' : 'Save notes'}
      </button>

      {errorMessage && <p className="mt-3 text-xs text-danger">{errorMessage}</p>}
      {summarizeMutation?.data && (
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
            <Sparkles size={13} /> AI summary
          </p>
          <div className="prose prose-invert max-w-none text-sm">
            <ReactMarkdown>{summarizeMutation.data}</ReactMarkdown>
          </div>
          <button
            onClick={() => {
              onChange(`${notes ? notes + '\n\n' : ''}## AI summary\n${summarizeMutation.data}`);
              onSave();
            }}
            className="btn-ghost mt-3"
          >
            Append to notes
          </button>
        </div>
      )}
    </div>
  );
}