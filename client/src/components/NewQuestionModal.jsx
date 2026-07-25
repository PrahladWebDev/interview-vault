import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Select } from './ui.jsx';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const ADD_NEW = '__add_new__';

export default function NewQuestionModal({ open, onClose, onCreate, creating, companies = [], topics = [] }) {
  const [form, setForm] = useState({ title: '', description: '', company: '', topic: '', difficulty: 'Medium', tags: '' });
  const [customCompany, setCustomCompany] = useState(false);
  const [customTopic, setCustomTopic] = useState(false);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onCreate({
      ...form,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card w-full max-w-md p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">New question</h2>
            <button onClick={onClose} className="text-muted hover:text-slate-100" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Title *</label>
              <input
                autoFocus
                required
                className="input-field"
                placeholder="e.g. Reverse a Linked List"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Description</label>
              <textarea
                className="input-field min-h-[80px] resize-y"
                placeholder="Write out the full question…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Company</label>
                {customCompany || companies.length === 0 ? (
                  <input
                    autoFocus={companies.length > 0}
                    className="input-field"
                    placeholder="Amazon"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                ) : (
                  <Select
                    value={form.company}
                    onChange={(v) => {
                      if (v === ADD_NEW) {
                        setCustomCompany(true);
                        setForm({ ...form, company: '' });
                      } else {
                        setForm({ ...form, company: v || '' });
                      }
                    }}
                    options={[...companies, ADD_NEW]}
                    optionLabels={{ [ADD_NEW]: '+ Add new company' }}
                    placeholder="Select company"
                  />
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Topic</label>
                {customTopic || topics.length === 0 ? (
                  <input
                    className="input-field"
                    placeholder="DSA"
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  />
                ) : (
                  <Select
                    value={form.topic}
                    onChange={(v) => {
                      if (v === ADD_NEW) {
                        setCustomTopic(true);
                        setForm({ ...form, topic: '' });
                      } else {
                        setForm({ ...form, topic: v || '' });
                      }
                    }}
                    options={[...topics, ADD_NEW]}
                    optionLabels={{ [ADD_NEW]: '+ Add new topic' }}
                    placeholder="Select topic"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Difficulty</label>
              <Select
                value={form.difficulty}
                onChange={(v) => setForm({ ...form, difficulty: v || 'Medium' })}
                options={DIFFICULTIES}
                placeholder="Medium"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Tags (comma separated)</label>
              <input
                className="input-field"
                placeholder="array, hash-map"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
            <button type="submit" disabled={creating} className="btn-primary w-full justify-center">
              {creating ? 'Creating…' : 'Create question'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}