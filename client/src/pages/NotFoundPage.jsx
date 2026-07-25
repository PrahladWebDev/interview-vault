import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-base text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] border border-white/10">
        <Compass size={26} className="text-accent-blue" />
      </div>
      <h1 className="font-display text-2xl font-semibold">This page doesn't exist</h1>
      <p className="max-w-sm text-sm text-muted">
        The page you're looking for was never saved to the vault, or the link is out of date.
      </p>
      <Link to="/" className="btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}
