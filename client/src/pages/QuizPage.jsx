import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sparkles, Loader2, ClipboardList, Check, X, RotateCcw } from 'lucide-react';
import { fetchFacets } from '../api/questions.js';
import { generateQuizRequest } from '../api/ai.js';
import { Select } from '../components/ui.jsx';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const COUNTS = ['3', '5', '8', '10'];

export default function QuizPage() {
  const { data: facets } = useQuery({ queryKey: ['questions', 'facets'], queryFn: fetchFacets });

  const [topic, setTopic] = useState(undefined);
  const [company, setCompany] = useState(undefined);
  const [difficulty, setDifficulty] = useState(undefined);
  const [count, setCount] = useState('5');

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const quizMutation = useMutation({
    mutationFn: () => generateQuizRequest({ topic, company, difficulty, count: Number(count) }),
    onSuccess: () => {
      setAnswers({});
      setSubmitted(false);
    },
  });

  const errorMessage =
    quizMutation.error?.response?.data?.message || (quizMutation.error ? 'Could not generate a quiz.' : null);

  const quiz = quizMutation.data;
  const score = quiz ? quiz.filter((q, i) => answers[i] === q.correctIndex).length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold">
          <ClipboardList size={22} className="text-accent-purple" /> AI Quiz
        </h1>
        <p className="mt-1 text-sm text-muted">
          Gemini generates a short multiple-choice quiz from the concepts behind your saved questions.
        </p>
      </div>

      <div className="glass-card flex flex-wrap items-end gap-3 p-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Topic</label>
          <Select value={topic} onChange={setTopic} options={facets?.topics || []} placeholder="Any topic" className="w-44" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Company</label>
          <Select
            value={company}
            onChange={setCompany}
            options={facets?.companies || []}
            placeholder="Any company"
            className="w-44"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Difficulty</label>
          <Select value={difficulty} onChange={setDifficulty} options={DIFFICULTIES} placeholder="Any difficulty" className="w-40" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted"># Questions</label>
          <Select value={count} onChange={(v) => setCount(v || '5')} options={COUNTS} placeholder="5" className="w-28" />
        </div>
        <button onClick={() => quizMutation.mutate()} disabled={quizMutation.isPending} className="btn-primary">
          {quizMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}{' '}
          {quizMutation.isPending ? 'Generating…' : quiz ? 'Regenerate quiz' : 'Generate quiz'}
        </button>
      </div>

      {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

      {quiz && quiz.length > 0 && (
        <div className="space-y-4">
          {quiz.map((q, i) => (
            <div key={i} className="glass-card p-5">
              <p className="mb-3 text-sm font-medium text-slate-100">
                {i + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[i] === oi;
                  const isCorrect = oi === q.correctIndex;
                  let style = 'border-white/[0.08] hover:bg-white/[0.03]';
                  if (submitted) {
                    if (isCorrect) style = 'border-success/50 bg-success/10';
                    else if (isSelected) style = 'border-danger/50 bg-danger/10';
                  } else if (isSelected) {
                    style = 'border-accent-blue/60 bg-white/[0.04]';
                  }
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors ${style}`}
                    >
                      <span>{opt}</span>
                      {submitted && isCorrect && <Check size={14} className="shrink-0 text-success" />}
                      {submitted && isSelected && !isCorrect && <X size={14} className="shrink-0 text-danger" />}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className="mt-3 rounded-lg bg-white/[0.02] p-3 text-xs text-muted">{q.explanation}</p>
              )}
            </div>
          ))}

          <div className="glass-card flex items-center justify-between p-5">
            {submitted ? (
              <>
                <p className="text-sm font-medium">
                  Score: <span className="text-accent-blue">{score}</span> / {quiz.length}
                </p>
                <button
                  onClick={() => {
                    setAnswers({});
                    setSubmitted(false);
                  }}
                  className="btn-ghost"
                >
                  <RotateCcw size={14} /> Retake
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted">
                  {Object.keys(answers).length} / {quiz.length} answered
                </p>
                <button
                  onClick={() => setSubmitted(true)}
                  disabled={Object.keys(answers).length < quiz.length}
                  className="btn-primary disabled:opacity-50"
                >
                  Submit quiz
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
