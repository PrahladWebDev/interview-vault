import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, User, Monitor, Smartphone, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  updateProfileRequest,
  fetchSessions,
  revokeSessionRequest,
  revokeOtherSessionsRequest,
} from '../api/auth.js';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', avatarUrl: user?.avatarUrl || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateProfileRequest(form);
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your profile and preferences.</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass-card space-y-4 p-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-accent-gradient text-xl font-semibold text-white">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              form.name?.[0]?.toUpperCase() || <User size={24} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-100">{user?.email}</p>
            <p className="text-xs text-muted">Member since {new Date(user?.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Display name</label>
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Avatar URL</label>
          <input
            className="input-field"
            placeholder="https://…"
            value={form.avatarUrl}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          <Save size={16} /> {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
        </button>
      </motion.form>

      <div className="glass-card p-6">
        <h3 className="mb-2 font-display text-base font-semibold">Streak</h3>
        <p className="text-sm text-muted">
          Current streak: <span className="font-medium text-slate-100">{user?.currentStreak ?? 0} days</span> · Longest:{' '}
          <span className="font-medium text-slate-100">{user?.longestStreak ?? 0} days</span>
        </p>
      </div>

      <SessionsPanel />
    </div>
  );
}

function parseDevice(userAgent = '') {
  const ua = userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad/.test(ua);
  let browser = 'Unknown browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/')) browser = 'Safari';

  let os = '';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  return { isMobile, label: [browser, os].filter(Boolean).join(' · ') || 'Unknown device' };
}

function SessionsPanel() {
  const queryClient = useQueryClient();
  const { data: sessions, isLoading } = useQuery({ queryKey: ['sessions'], queryFn: fetchSessions });

  const revokeMutation = useMutation({
    mutationFn: revokeSessionRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const revokeOthersMutation = useMutation({
    mutationFn: revokeOtherSessionsRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const hasOtherSessions = (sessions || []).some((s) => !s.current);

  return (
    <div className="glass-card space-y-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold">Active sessions</h3>
          <p className="mt-1 text-xs text-muted">Devices currently signed in to your account.</p>
        </div>
        <button
          onClick={() => {
            if (confirm('Log out of every other session? This device will stay signed in.')) {
              revokeOthersMutation.mutate();
            }
          }}
          disabled={!hasOtherSessions || revokeOthersMutation.isPending}
          className="btn-ghost shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShieldCheck size={15} /> Log out other sessions
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(sessions || []).map((s) => {
            const { isMobile, label } = parseDevice(s.userAgent);
            const Icon = isMobile ? Smartphone : Monitor;
            return (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon size={18} className="shrink-0 text-muted" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-slate-100">
                      {label}
                      {s.current && (
                        <span className="badge border-success/30 bg-success/10 text-success">This device</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {s.ip ? `${s.ip} · ` : ''}Last active {new Date(s.lastUsedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!s.current && (
                  <button
                    onClick={() => revokeMutation.mutate(s.id)}
                    disabled={revokeMutation.isPending}
                    className="shrink-0 text-muted hover:text-danger"
                    aria-label="Revoke session"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
