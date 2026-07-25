import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { fetchAnalytics } from '../api/analytics.js';
import { Select } from '../components/ui.jsx';

const DIFFICULTY_COLOR = { Easy: '#34D399', Medium: '#FBBF24', Hard: '#F87171' };
const TOOLTIP_STYLE = {
  background: '#161B26',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  fontSize: 12,
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('week');
  const { data, isLoading } = useQuery({ queryKey: ['analytics', period], queryFn: () => fetchAnalytics(period) });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Analytics</h1>
          <p className="mt-1 text-sm text-muted">How your prep is trending.</p>
        </div>
        <Select
          value={period}
          onChange={(v) => setPeriod(v || 'week')}
          options={['week', 'month']}
          placeholder="Period"
          className="w-36"
        />
      </div>

      {isLoading ? (
        <div className="glass-card p-16 text-center text-sm text-muted">Loading analytics…</div>
      ) : !data ? null : (
        <>
          <SolveRateChart timeline={data.solveRateTimeline} period={period} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DifficultyChart breakdown={data.difficultyBreakdown} />
            <RevisionAccuracyChart accuracy={data.revisionAccuracy} />
          </div>

          <TimeToSolveCard data={data.avgTimeToSolveDays} />
        </>
      )}
    </div>
  );
}

function SolveRateChart({ timeline, period }) {
  if (!timeline?.length) {
    return <EmptyCard title="Solve rate" hint="Add and solve questions to see your trend here." />;
  }
  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 font-display text-base font-semibold">
        Questions added vs. solved <span className="text-sm font-normal text-muted">per {period}</span>
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={timeline}>
          <defs>
            <linearGradient id="addedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5B8DEF" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#5B8DEF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="solvedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="period" stroke="#8B93A7" fontSize={11} tickLine={false} />
          <YAxis stroke="#8B93A7" fontSize={11} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#8B93A7' }} />
          <Area type="monotone" dataKey="added" name="Added" stroke="#5B8DEF" fill="url(#addedGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="solved" name="Solved" stroke="#34D399" fill="url(#solvedGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DifficultyChart({ breakdown }) {
  if (!breakdown?.length) {
    return <EmptyCard title="Difficulty breakdown" hint="Tag questions with a difficulty to see this chart." />;
  }
  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 font-display text-base font-semibold">Difficulty breakdown</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={breakdown}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="difficulty" stroke="#8B93A7" fontSize={11} tickLine={false} />
          <YAxis stroke="#8B93A7" fontSize={11} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#8B93A7' }} />
          <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]}>
            {breakdown.map((d) => (
              <Cell key={d.difficulty} fill="rgba(255,255,255,0.08)" />
            ))}
          </Bar>
          <Bar dataKey="solved" name="Solved" radius={[6, 6, 0, 0]}>
            {breakdown.map((d) => (
              <Cell key={d.difficulty} fill={DIFFICULTY_COLOR[d.difficulty] || '#5B8DEF'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevisionAccuracyChart({ accuracy }) {
  if (!accuracy?.timeline?.length) {
    return (
      <EmptyCard
        title="Revision accuracy"
        hint="Review a due question (remembered / forgot) to start tracking accuracy."
      />
    );
  }
  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Revision accuracy</h3>
        {accuracy.overall !== null && (
          <span className="font-display text-lg font-semibold text-accent-blue">{accuracy.overall}%</span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={accuracy.timeline}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" stroke="#8B93A7" fontSize={11} tickLine={false} />
          <YAxis stroke="#8B93A7" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `${v}%`} />
          <Line type="monotone" dataKey="pct" name="Remembered" stroke="#A855F7" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TimeToSolveCard({ data }) {
  if (!data?.byDifficulty?.length) {
    return <EmptyCard title="Time to solve" hint="Solve a question to see how long it typically takes you." />;
  }
  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-base font-semibold">Avg. days from adding to solving</h3>
      <p className="mt-1 text-xs text-muted">{data.note}</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {data.byDifficulty.map((d) => (
          <div key={d.difficulty} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{d.difficulty}</p>
            <p className="mt-1 font-display text-2xl font-semibold" style={{ color: DIFFICULTY_COLOR[d.difficulty] }}>
              {d.avgDays}d
            </p>
            <p className="text-xs text-muted">{d.count} solved</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyCard({ title, hint }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-2 p-10 text-center">
      <BarChart3 size={20} className="text-muted" />
      <h3 className="font-display text-sm font-semibold">{title}</h3>
      <p className="max-w-xs text-xs text-muted">{hint}</p>
    </div>
  );
}
