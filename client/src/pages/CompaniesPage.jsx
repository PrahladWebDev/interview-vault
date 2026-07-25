import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchCompanyProgress } from '../api/dashboard.js';

export default function CompaniesPage() {
  const { data: companies, isLoading } = useQuery({
    queryKey: ['dashboard', 'companies'],
    queryFn: fetchCompanyProgress,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Companies</h1>
        <p className="mt-1 text-sm text-muted">Progress broken down by company tag.</p>
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : !companies?.length ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {companies.map((c, i) => (
            <CompanyCard key={c.company} company={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyCard({ company, index }) {
  const pct = company.total ? Math.round((company.solved / company.total) * 100) : 0;
  const { easy = 0, medium = 0, hard = 0 } = company.difficulty || {};
  const total = easy + medium + hard || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.02 }}
    >
      <Link
        to={`/companies/${encodeURIComponent(company.company)}`}
        className="glass-card group flex flex-col gap-4 p-5 transition-colors hover:border-white/20"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-accent-blue">
              <Building2 size={16} />
            </div>
            <h3 className="truncate font-display text-base font-semibold text-slate-100 group-hover:text-white">
              {company.company}
            </h3>
          </div>
          <span className="shrink-0 text-xs text-muted">
            {company.solved}/{company.total}
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-accent-gradient transition-all" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          {easy > 0 && <div className="h-full bg-success" style={{ width: `${(easy / total) * 100}%` }} />}
          {medium > 0 && <div className="h-full bg-warning" style={{ width: `${(medium / total) * 100}%` }} />}
          {hard > 0 && <div className="h-full bg-danger" style={{ width: `${(hard / total) * 100}%` }} />}
        </div>

        <div className="flex items-center justify-between text-xs text-muted">
          <span>{pct}% solved</span>
          <span>
            {easy}E · {medium}M · {hard}H
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card h-32 animate-pulse p-5">
          <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
          <div className="mt-4 h-1.5 w-full rounded bg-white/[0.04]" />
          <div className="mt-3 h-1.5 w-full rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 p-16 text-center">
      <div className="rounded-full bg-white/[0.04] p-4">
        <Building2 size={24} className="text-muted" />
      </div>
      <h3 className="font-display text-lg font-semibold">No companies yet</h3>
      <p className="max-w-sm text-sm text-muted">Tag questions with a company to see them grouped here.</p>
    </div>
  );
}
