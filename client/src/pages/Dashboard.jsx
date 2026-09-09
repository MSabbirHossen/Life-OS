import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import api from '../utils/api';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import {
  Clock,
  Utensils,
  Compass,
  CheckSquare,
  Plus,
  Flame,
  Wallet,
  Sparkles,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Target,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export const Dashboard = ({ selectedDate }) => {
  const navigate = useNavigate();
  const activeDate = selectedDate || getFormattedDate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.get(`/dashboard/summary?date=${activeDate}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard summary', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeDate]);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh when window regains focus
    const handleFocus = () => {
      fetchDashboardData(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-secondary">Loading Live Dashboard Overview...</span>
      </div>
    );
  }

  const defaultSummary = {
    journal: null,
    prompt: null,
    time: { totalMinutes: 0, byCategory: {}, count: 0 },
    study: { totalMinutes: 0, sessionsCount: 0 },
    calories: { consumed: 0, protein: 0, goal: 2000 },
    fitness: { caloriesBurned: 0, workoutsCount: 0 },
    salah: { completedCount: 0, total: 5, logs: [] },
    finance: { expensesToday: 0, expensesMonth: 0 },
    habits: { activeCount: 0, completedTodayCount: 0 },
    goalsCount: 0,
  };

  const summary = data?.summary || defaultSummary;

  // Time Chart Data
  const timeChartData = Object.entries(summary.time?.byCategory || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Calorie Chart Data
  const calorieChartData = [
    { name: 'Consumed', amount: summary.calories?.consumed || 0 },
    { name: 'Goal', amount: summary.calories?.goal || 2000 },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Daily Synthesis"
        title="Dashboard Overview"
        description={`Aggregated live summary and metrics for ${formatDisplayDate(activeDate)}`}
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => fetchDashboardData(true)}
              className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-subtle border border-theme transition-all cursor-pointer"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-accent' : ''}`} />
            </button>
            <Button variant="secondary" size="md" icon={CheckSquare} onClick={() => navigate('/habits')}>
              Habits
            </Button>
            <Button variant="gradient" size="md" icon={Plus} onClick={() => navigate('/journal')}>
              Quick Journal
            </Button>
          </div>
        }
      />

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Time Logged"
          value={`${Math.floor((summary.time?.totalMinutes || 0) / 60)}h ${(summary.time?.totalMinutes || 0) % 60}m`}
          subtitle={`${summary.time?.count || 0} blocks logged`}
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Salah Completion"
          value={`${summary.salah?.completedCount || 0} / ${summary.salah?.total || 5}`}
          subtitle={`${Math.max(0, (summary.salah?.total || 5) - (summary.salah?.completedCount || 0))} remaining today`}
          icon={Compass}
          color="emerald"
        />
        <StatCard
          title="Calories Consumed"
          value={`${summary.calories?.consumed || 0} kcal`}
          subtitle={`Goal: ${summary.calories?.goal || 2000} kcal`}
          icon={Utensils}
          color="amber"
        />
        <StatCard
          title="Habits Done Today"
          value={`${summary.habits?.completedTodayCount || 0} / ${summary.habits?.activeCount || 0}`}
          subtitle="Daily discipline"
          icon={Flame}
          color="rose"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-7">
          {/* Time Distribution Donut */}
          <Card
            hover
            title="Today's Time Distribution"
            subtitle="Logged minutes aggregated by category"
            icon={Clock}
            action={
              <Button variant="ghost" size="xs" onClick={() => navigate('/time-tracker')}>
                View Timeline <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            }
          >
            {timeChartData.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-xs text-secondary italic bg-subtle/50 rounded-xl border border-dashed border-theme mt-2">
                <Clock className="w-8 h-8 text-muted mb-2 stroke-1" />
                No time blocks recorded for this date.
              </div>
            ) : (
              <div className="h-64 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={timeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {timeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`${val} mins`, 'Duration']}
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow-hover)',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Calorie & Finance 2-Col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <Card
              hover
              title="Calorie Intake"
              subtitle="Consumed vs Target"
              icon={Utensils}
              action={
                <Button variant="ghost" size="xs" onClick={() => navigate('/calories')}>
                  Details <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              }
            >
              <div className="h-44 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calorieChartData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="amount" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card
              hover
              title="Finance Overview"
              subtitle="Expenses summary in SAR"
              icon={Wallet}
              action={
                <Button variant="ghost" size="xs" onClick={() => navigate('/finance')}>
                  Ledger <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              }
            >
              <div className="space-y-4 py-2 mt-2">
                <div className="p-3 rounded-xl bg-subtle border border-theme">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                    Today's Expenses
                  </span>
                  <span className="text-2xl font-extrabold text-[var(--color-danger)] tracking-tight mt-0.5 block">
                    {(summary.finance?.expensesToday || 0).toFixed(2)} SAR
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-subtle border border-theme">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                    Month-to-Date Expenses
                  </span>
                  <span className="text-xl font-extrabold text-primary tracking-tight mt-0.5 block">
                    {(summary.finance?.expensesMonth || 0).toFixed(2)} SAR
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6 sm:space-y-7">
          {/* Guided Reflection Prompt Card */}
          <Card
            hover
            title="Daily Guided Reflection"
            subtitle="Prompt of the Day"
            icon={BookOpen}
            badge={<Badge variant="primary" size="xs">Journal</Badge>}
          >
            {summary.prompt ? (
              <div className="space-y-3 mt-1">
                <Badge variant="purple" size="xs">
                  {summary.prompt.category}
                </Badge>
                <p className="text-sm font-bold text-primary italic leading-relaxed">
                  "{summary.prompt.question}"
                </p>
                {summary.journal && summary.journal.promptAnswer ? (
                  <div className="p-3.5 bg-subtle rounded-xl text-xs text-primary border border-theme font-medium">
                    {summary.journal.promptAnswer}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    icon={Plus}
                    onClick={() => navigate('/journal')}
                  >
                    Answer in Journal
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-xs text-secondary italic">No prompt available.</p>
            )}
          </Card>

          {/* Daily Deen Snippet */}
          <Card
            hover
            title="Spiritual Anchor"
            subtitle="Daily Islamic Wisdom"
            icon={Compass}
            badge={<Badge variant="success" size="xs">Deen</Badge>}
          >
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2 mt-1">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Hadith of the Day
              </p>
              <p className="text-xs text-primary font-medium italic leading-relaxed">
                "The most beloved of deeds to Allah are those that are most consistent, even if they are small."
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
