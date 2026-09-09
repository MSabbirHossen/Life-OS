import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import api from '../utils/api';
import { formatDisplayDate } from '../utils/dateHelpers';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

const CATEGORIES = ['Health', 'Career', 'Learning', 'Spiritual', 'Financial', 'Personal'];

export const GoalsTracker = () => {
  const [goals, setGoals] = useState([]);
  const [availableHabits, setAvailableHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [filterType, setFilterType] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('short_term');
  const [category, setCategory] = useState('Career');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [linkedHabits, setLinkedHabits] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [goalsRes, habitsRes] = await Promise.all([
        api.get('/goals'),
        api.get('/habits'),
      ]);
      setGoals(goalsRes.data || []);
      setAvailableHabits(habitsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch goals data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await api.post('/goals', {
        title: title.trim(),
        type,
        category,
        targetDate: targetDate || undefined,
        description: description.trim(),
        linkedHabits,
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setTargetDate('');
      setLinkedHabits([]);
      fetchData();
    } catch (err) {
      console.error('Failed to create goal', err);
    }
  };

  const handleToggleHabitSelection = (habitId) => {
    setLinkedHabits((prev) =>
      prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]
    );
  };

  const handleDeleteGoal = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/goals/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete goal', err);
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (filterType === 'all') return true;
    const gType = g.type?.replace('-', '_');
    return gType === filterType;
  });

  const avgProgress =
    goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + (g.progressPercent || 0), 0) / goals.length)
      : 0;

  const achievedCount = goals.filter((g) => (g.progressPercent || 0) >= 100).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Vision & Long-Term Targets"
        title="Goals & Milestones"
        description="Connect daily habits and study sessions to milestones to track progress automatically."
        action={
          <Button variant="gradient" size="md" icon={Plus} onClick={() => setIsModalOpen(true)}>
            New Goal
          </Button>
        }
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Active Goals"
          value={goals.length}
          subtitle="Target objectives"
          icon={Target}
          color="indigo"
        />
        <StatCard
          title="Average Progress"
          value={`${avgProgress}%`}
          subtitle="Overall completion rate"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Achieved Milestones"
          value={achievedCount}
          subtitle="100% completed goals"
          icon={CheckCircle2}
          color="purple"
        />
      </div>

      {/* Goals Filter Tabs & Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex bg-subtle p-1 rounded-xl border border-theme">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-surface text-primary card-shadow'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              All ({goals.length})
            </button>
            <button
              onClick={() => setFilterType('short_term')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'short_term'
                  ? 'bg-surface text-primary card-shadow'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Short-Term
            </button>
            <button
              onClick={() => setFilterType('long_term')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'long_term'
                  ? 'bg-surface text-primary card-shadow'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Long-Term
            </button>
          </div>
          <span className="text-xs font-semibold text-secondary">{filteredGoals.length} goals</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredGoals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals found"
            description="Create your first goal and link daily habits to measure your trajectory."
            actionText="Create Goal"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredGoals.map((goal) => (
              <Card
                key={goal._id}
                hover
                className="flex flex-col justify-between"
                action={
                  <button
                    onClick={() => setDeleteId(goal._id)}
                    className="p-1.5 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                }
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={goal.type?.includes('long') ? 'purple' : 'primary'} size="xs" dot>
                      {goal.type?.includes('long') ? 'Long-Term' : 'Short-Term'}
                    </Badge>
                    <Badge variant="neutral" size="xs">
                      {goal.category}
                    </Badge>
                  </div>

                  <h3 className="text-base font-extrabold text-primary tracking-tight">{goal.title}</h3>

                  {goal.description && (
                    <p className="text-xs text-secondary font-medium leading-relaxed">
                      {goal.description}
                    </p>
                  )}

                  {/* Progress Gauge */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-secondary">Progress</span>
                      <span className="text-accent">{goal.progressPercent || 0}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-subtle rounded-full overflow-hidden border border-theme">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progressPercent || 0}%` }}
                      />
                    </div>
                  </div>

                  {goal.targetDate && (
                    <div className="flex items-center gap-1.5 text-xs text-secondary font-medium pt-2 border-t border-subtle">
                      <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span>Target: {formatDisplayDate(goal.targetDate)}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Goal Creator Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Vision Goal"
        subtitle="Set clear targets and link daily habits"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Goal Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Reach 70kg target weight, Master React & Node.js"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Horizon Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="select-base"
              >
                <option value="short_term">Short-Term (1-3 months)</option>
                <option value="long_term">Long-Term (6-12+ months)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select-base"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Target Deadline (Optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="input-base"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Description / Action Plan
            </label>
            <textarea
              rows={2}
              placeholder="What concrete steps will get you to this milestone?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea-base"
            />
          </div>

          {availableHabits.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Link Daily Habits (Auto-drives progress)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-subtle rounded-xl border border-theme">
                {availableHabits.map((habit) => (
                  <label
                    key={habit._id}
                    className="flex items-center gap-2 p-1.5 hover:bg-surface rounded-lg cursor-pointer text-xs font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={linkedHabits.includes(habit._id)}
                      onChange={() => handleToggleHabitSelection(habit._id)}
                      className="accent-indigo-600 rounded"
                    />
                    <span className="truncate">{habit.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Goal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this goal milestone?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteGoal}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GoalsTracker;
