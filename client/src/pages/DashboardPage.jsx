import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Star, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '../components/StatCard.jsx';
import ActivityHeatmap from '../components/ActivityHeatmap.jsx';
import ProgressList from '../components/ProgressList.jsx';
import RecentActivity from '../components/RecentActivity.jsx';
import { fetchSummary, fetchHeatmap, fetchTopicProgress, fetchCompanyProgress, fetchRecentActivity } from '../api/dashboard.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: summary } = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: fetchSummary });
  const { data: heatmap } = useQuery({ queryKey: ['dashboard', 'heatmap'], queryFn: () => fetchHeatmap(140) });
  const { data: topics } = useQuery({ queryKey: ['dashboard', 'topics'], queryFn: fetchTopicProgress });
  const { data: companies } = useQuery({ queryKey: ['dashboard', 'companies'], queryFn: fetchCompanyProgress });
  const { data: activity } = useQuery({ queryKey: ['dashboard', 'activity'], queryFn: () => fetchRecentActivity(10) });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <h1 className="font-display text-2xl font-semibold">
          {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span>
        </h1>
        <p className="mt-1 text-sm text-muted">Here's where your interview prep stands today.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Questions solved" value={summary?.solved ?? '–'} icon={CheckCircle2} accent="success" />
        <StatCard label="Pending" value={summary?.pending ?? '–'} icon={Clock} accent="blue" />
        <StatCard label="Revision due today" value={summary?.revisionDueToday ?? '–'} icon={RotateCcw} accent="purple" />
        <StatCard label="Favorites" value={summary?.favorites ?? '–'} icon={Star} accent="warning" />
      </div>

      <ActivityHeatmap
        data={heatmap || []}
        currentStreak={summary?.currentStreak ?? 0}
        longestStreak={summary?.longestStreak ?? 0}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ProgressList
          title="Topic progress"
          items={topics || []}
          labelKey="topic"
          emptyHint="Add questions with a topic to see progress here."
          linkPrefix="/topics"
        />
        <ProgressList
          title="Company progress"
          items={companies || []}
          labelKey="company"
          emptyHint="Tag questions with a company to see progress here."
          linkPrefix="/companies"
        />
        <RecentActivity items={activity || []} />
      </div>
    </div>
  );
}
