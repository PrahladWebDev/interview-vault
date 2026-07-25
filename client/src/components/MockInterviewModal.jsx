import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { mockInterviewMessageRequest } from '../api/ai.js';

export default function MockInterviewModal({ open, onClose, questionId, questionTitle }) {
  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      setHistory([]);
      setDraft('');
      setError(null);
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    kickoff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [history, sending]);

  async function kickoff() {
    setSending(true);
    setError(null);
    try {
      const reply = await mockInterviewMessageRequest(
        questionId,
        [],
        "Let's begin the interview."
      );
      setHistory([{ role: 'assistant', text: reply }]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not start the mock interview.');
    } finally {
      setSending(false);
    }
  }

  async function send() {
    const message = draft.trim();
    if (!message || sending) return;
    const nextHistory = [...history, { role: 'user', text: message }];
    setHistory(nextHistory);
    setDraft('');
    setSending(true);
    setError(null);
    try {
      const reply = await mockInterviewMessageRequest(questionId, history, message);
      setHistory([...nextHistory, { role: 'assistant', text: reply }]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong sending that message.');
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card flex h-[600px] w-full max-w-lg flex-col p-0"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-accent-blue" />
              <div>
                <h2 className="font-display text-sm font-semibold">Mock interview</h2>
                <p className="text-xs text-muted">{questionTitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted hover:text-slate-100" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {history.map((h, i) => (
              <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm ${
                    h.role === 'user'
                      ? 'bg-accent-gradient text-white'
                      : 'border border-white/[0.06] bg-white/[0.03] text-slate-100'
                  }`}
                >
                  {h.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm text-muted">
                  <Loader2 size={13} className="animate-spin" /> Thinking…
                </div>
              </div>
            )}
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>

          <div className="flex items-center gap-2 border-t border-white/[0.06] p-3">
            <input
              autoFocus
              className="input-field flex-1"
              placeholder="Talk through your approach…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={sending}
            />
            <button
              onClick={send}
              disabled={sending || !draft.trim()}
              className="btn-primary shrink-0 disabled:opacity-50"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
