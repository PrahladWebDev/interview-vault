import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Vault, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AuthShell from '../components/AuthShell.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      const details = err.response?.data?.details;
      setError(
        (Array.isArray(details) ? details.map((d) => d.msg || d.message).join(' ') : null) ||
          err.response?.data?.message ||
          'Could not create your account.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="glass-card w-full max-w-md p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gradient shadow-glow">
            <Vault size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold">Create your vault</h1>
            <p className="text-sm text-muted">Start tracking your interview prep</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-muted">
              Name
            </label>
            <input
              id="name"
              required
              className="input-field"
              placeholder="Ada Lovelace"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input-field"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              className="input-field"
              placeholder="At least 8 characters, with a number"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            <UserPlus size={16} />
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent-blue hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthShell>
  );
}
