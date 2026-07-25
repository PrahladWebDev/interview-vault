import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Building2 } from 'lucide-react';
import { fetchCompanyProgress } from '../api/dashboard.js';
import FacetQuestionList from '../components/FacetQuestionList.jsx';

export default function CompanyDetailPage() {
  const { name } = useParams();
  const company = decodeURIComponent(name);

  const { data: companies } = useQuery({ queryKey: ['dashboard', 'companies'], queryFn: fetchCompanyProgress });
  const stats = companies?.find((c) => c.company === company);

  return (
    <div className="space-y-6">
      <Link to="/companies" className="inline-flex items-center gap-1 text-sm text-muted hover:text-slate-100">
        <ChevronLeft size={16} /> Companies
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-accent-blue">
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold">{company}</h1>
          {stats && (
            <p className="mt-1 text-sm text-muted">
              {stats.solved}/{stats.total} solved · {stats.difficulty.easy}E · {stats.difficulty.medium}M ·{' '}
              {stats.difficulty.hard}H
            </p>
          )}
        </div>
      </div>

      <FacetQuestionList filterKey="company" filterValue={company} />
    </div>
  );
}
