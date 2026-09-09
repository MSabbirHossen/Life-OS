import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import api from '../utils/api';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import {
  Dumbbell,
  Plus,
  Trash2,
  Flame,
  Activity,
  Scale,
  LineChart as LineChartIcon,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const TARGET_TYPES = ['Muscle', 'Cardio', 'Flexibility', 'Sports'];

const TARGET_COLORS = {
  Muscle: 'indigo',
  Cardio: 'rose',
  Flexibility: 'purple',
  Sports: 'emerald',
};

export const FitnessTracker = ({ selectedDate }) => {
  const currentDate = selectedDate || getFormattedDate();

  const [workouts, setWorkouts] = useState([]);
  const [bodyMetrics, setBodyMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [deleteWorkoutId, setDeleteWorkoutId] = useState(null);

  // Workout Form State
  const [wDate, setWDate] = useState(currentDate);
  const [wName, setWName] = useState('');
  const [wTrackingType, setWTrackingType] = useState('sets_reps'); // 'sets_reps' | 'duration'
  const [wSets, setWSets] = useState(3);
  const [wReps, setWReps] = useState(10);
  const [wWeight, setWWeight] = useState('');
  const [wDuration, setWDuration] = useState(30);
  const [wCalories, setWCalories] = useState('');
  const [wIdealCalPerSet, setWIdealCalPerSet] = useState(8);
  const [wIdealCalPerMin, setWIdealCalPerMin] = useState(6);
  const [wTarget, setWTarget] = useState('Muscle');
  const [wNotes, setWNotes] = useState('');
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [savingMetric, setSavingMetric] = useState(false);

  // Workout Autocomplete Suggestions
  const [wSuggestions, setWSuggestions] = useState([]);
  const [showWSuggestions, setShowWSuggestions] = useState(false);

  // Metric Form State
  const [mDate, setMDate] = useState(currentDate);
  const [mWeight, setMWeight] = useState('');
  const [mWaist, setMWaist] = useState('');
  const [mChest, setMChest] = useState('');
  const [mArm, setMArm] = useState('');
  const [mNotes, setMNotes] = useState('');

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [workoutsRes, metricsRes] = await Promise.all([
        api.get(`/workouts?date=${currentDate}`),
        api.get('/body-metrics'),
      ]);
      setWorkouts(workoutsRes.data || []);
      setBodyMetrics(metricsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch fitness data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Autocomplete Workout Types Search
  useEffect(() => {
    if (!wName.trim()) {
      setWSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/workout-types/search?q=${encodeURIComponent(wName.trim())}`);
        setWSuggestions(res.data || []);
        setShowWSuggestions(true);
      } catch (err) {
        console.error('Failed workout search', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [wName]);

  const handleSelectWorkoutType = (wt) => {
    setWName(wt.name);
    setWTarget(wt.target || 'Muscle');
    setWTrackingType(wt.trackingType || 'sets_reps');
    if (wt.defaultSets) setWSets(wt.defaultSets);
    if (wt.defaultReps) setWReps(wt.defaultReps);
    if (wt.defaultWeight) setWWeight(wt.defaultWeight);
    if (wt.caloriesPerSet) setWIdealCalPerSet(wt.caloriesPerSet);
    if (wt.defaultCaloriesPerMinute) setWIdealCalPerMin(wt.defaultCaloriesPerMinute);

    if (wt.trackingType === 'duration' && wt.defaultCaloriesPerMinute) {
      setWCalories(Math.round(wt.defaultCaloriesPerMinute * wDuration));
    } else if (wt.caloriesPerSet && wt.defaultSets) {
      setWCalories(Math.round(wt.caloriesPerSet * wt.defaultSets));
    }

    setShowWSuggestions(false);
  };

  const handleWorkoutSubmit = async (e) => {
    e.preventDefault();
    if (!wName.trim()) return;

    setSavingWorkout(true);
    try {
      const res = await api.post('/workouts', {
        date: wDate,
        name: wName.trim(),
        trackingType: wTrackingType,
        sets: wTrackingType === 'sets_reps' ? Number(wSets) : 0,
        reps: wTrackingType === 'sets_reps' ? Number(wReps) : 0,
        weight: Number(wWeight) || 0,
        durationMinutes: wTrackingType === 'duration' ? Number(wDuration) : Number(wSets) * 3,
        caloriesBurned: wCalories ? Number(wCalories) : 0,
        idealCaloriesPerSet: Number(wIdealCalPerSet),
        idealCaloriesPerMin: Number(wIdealCalPerMin),
        target: wTarget,
        notes: wNotes.trim(),
      });
      setIsWorkoutModalOpen(false);
      setWName('');
      setWNotes('');
      setWCalories('');
      if (res.data) setWorkouts((prev) => [res.data, ...prev]);
      fetchData(false);
    } catch (err) {
      console.error('Failed to log workout', err);
    } finally {
      setSavingWorkout(false);
    }
  };

  const handleMetricSubmit = async (e) => {
    e.preventDefault();
    if (!mWeight && !mWaist) return;

    setSavingMetric(true);
    try {
      const res = await api.post('/body-metrics', {
        date: mDate,
        weightKg: mWeight ? Number(mWeight) : undefined,
        waistCm: mWaist ? Number(mWaist) : undefined,
        chestCm: mChest ? Number(mChest) : undefined,
        armCm: mArm ? Number(mArm) : undefined,
        notes: mNotes.trim(),
      });
      setIsMetricModalOpen(false);
      setMWeight('');
      setMWaist('');
      setMChest('');
      setMArm('');
      setMNotes('');
      if (res.data) setBodyMetrics((prev) => [...prev.filter((m) => m.date !== mDate), res.data]);
      fetchData(false);
    } catch (err) {
      console.error('Failed to log body metric', err);
    } finally {
      setSavingMetric(false);
    }
  };

  const handleDeleteWorkout = async () => {
    if (!deleteWorkoutId) return;
    const targetId = deleteWorkoutId;
    setDeleteWorkoutId(null);
    setWorkouts((prev) => prev.filter((w) => w._id !== targetId));

    try {
      await api.delete(`/workouts/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete workout', err);
      fetchData(false);
    }
  };

  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const totalWorkoutMinutes = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
  const latestWeight = bodyMetrics.slice().reverse().find((m) => m.weightKg)?.weightKg;

  const chartData = bodyMetrics.map((m) => ({
    date: m.date.slice(5),
    weight: m.weightKg,
    waist: m.waistCm,
  }));

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Health & Physicality"
        title="Fitness & Workouts"
        description={`Track strength, cardio, and energy expenditure with automatic server-calculated calorie burns for ${formatDisplayDate(currentDate)}`}
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              icon={Scale}
              onClick={() => {
                setMDate(currentDate);
                setIsMetricModalOpen(true);
              }}
            >
              Log Body Metric
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={() => {
                setWDate(currentDate);
                setIsWorkoutModalOpen(true);
              }}
            >
              Log Workout
            </Button>
          </div>
        }
      />

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Active Energy Burned"
          value={`${totalCaloriesBurned} kcal`}
          subtitle={`${workouts.length} exercises logged`}
          icon={Flame}
          color="rose"
        />
        <StatCard
          title="Exercise Duration"
          value={`${Math.floor(totalWorkoutMinutes / 60)}h ${totalWorkoutMinutes % 60}m`}
          subtitle="Total training time"
          icon={Dumbbell}
          color="indigo"
        />
        <StatCard
          title="Current Weight"
          value={latestWeight ? `${latestWeight} kg` : 'Not recorded'}
          subtitle="Latest logged scale measurement"
          icon={Scale}
          color="emerald"
        />
      </div>

      {/* Workouts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary tracking-tight">Today's Exercises & Workouts</h2>
          <span className="text-xs font-semibold text-secondary">{workouts.length} logged</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : workouts.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No workouts recorded today"
            description="Log your workout session to calculate calories burned and track physical progress."
            actionText="Log Workout"
            onAction={() => {
              setWDate(currentDate);
              setIsWorkoutModalOpen(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {workouts.map((w) => (
              <Card
                key={w._id}
                hover
                action={
                  <button
                    onClick={() => setDeleteWorkoutId(w._id)}
                    className="p-1.5 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Workout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                }
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={TARGET_COLORS[w.target] || 'neutral'} size="sm" dot>
                      {w.target}
                    </Badge>
                    <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                      {w.caloriesBurned} kcal
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-primary tracking-tight">{w.name}</h4>

                  {w.trackingType === 'sets_reps' || w.sets > 0 ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-primary bg-subtle p-2 rounded-xl border border-theme">
                      <Zap className="w-3.5 h-3.5 text-accent" />
                      <span>
                        {w.sets} Sets × {w.reps} Reps {w.weight > 0 ? `@ ${w.weight} kg` : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-secondary font-semibold bg-subtle p-2 rounded-xl border border-theme">
                      <Activity className="w-3.5 h-3.5 text-accent" />
                      <span>Duration: {w.durationMinutes} minutes</span>
                    </div>
                  )}

                  {w.notes && (
                    <p className="text-xs text-secondary font-medium leading-relaxed bg-subtle p-2 rounded-xl border border-theme">
                      {w.notes}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Body Metrics Trend & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
        <Card
          hover
          title="Weight & Waist Progress"
          subtitle="Sparse data line trend"
          icon={LineChartIcon}
          className="lg:col-span-2"
        >
          {chartData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-xs text-secondary italic bg-subtle/50 rounded-xl border border-dashed border-theme mt-2">
              <Scale className="w-8 h-8 text-muted mb-2 stroke-1" />
              No body metric records to plot.
            </div>
          ) : (
            <div className="h-60 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.15} />
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Weight (kg)"
                    stroke="var(--color-accent)"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="waist"
                    name="Waist (cm)"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card hover title="Measurement Log" subtitle="Recent metrics recorded" icon={Scale}>
          {bodyMetrics.length === 0 ? (
            <p className="text-xs text-secondary italic py-4">No measurements logged yet.</p>
          ) : (
            <div className="space-y-3 mt-2">
              {bodyMetrics
                .slice()
                .reverse()
                .slice(0, 4)
                .map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-subtle border border-theme flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-primary block">{formatDisplayDate(m.date)}</span>
                      <span className="text-[11px] text-secondary">
                        {m.waistCm ? `Waist: ${m.waistCm}cm ` : ''}
                        {m.chestCm ? `Chest: ${m.chestCm}cm` : ''}
                      </span>
                    </div>
                    {m.weightKg && (
                      <span className="text-sm font-extrabold text-accent">{m.weightKg} kg</span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* Workout Modal */}
      <Modal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        title="Log Workout & Exercise"
        subtitle="Automatic calorie burn calculation based on sets, reps, duration & weight"
      >
        <form onSubmit={handleWorkoutSubmit} className="space-y-4">
          <div className="flex bg-subtle p-1 rounded-xl border border-theme">
            <button
              type="button"
              onClick={() => setWTrackingType('sets_reps')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                wTrackingType === 'sets_reps'
                  ? 'bg-surface text-primary card-shadow'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Sets & Reps (Strength)
            </button>
            <button
              type="button"
              onClick={() => setWTrackingType('duration')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                wTrackingType === 'duration'
                  ? 'bg-surface text-primary card-shadow'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Time & Duration (Cardio/Sports)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={wDate}
                onChange={(e) => setWDate(e.target.value)}
                className="input-base"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Target Category
              </label>
              <select
                value={wTarget}
                onChange={(e) => setWTarget(e.target.value)}
                className="select-base"
              >
                {TARGET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Exercise Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bench Press, Squats, Treadmill Running"
              value={wName}
              onChange={(e) => {
                setWName(e.target.value);
                setShowWSuggestions(true);
              }}
              onFocus={() => setShowWSuggestions(true)}
              className="input-base"
            />
            {showWSuggestions && wSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-theme rounded-xl card-shadow z-30 max-h-40 overflow-y-auto">
                {wSuggestions.map((wt) => (
                  <div
                    key={wt._id}
                    onClick={() => handleSelectWorkoutType(wt)}
                    className="p-2.5 hover:bg-subtle cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-primary">{wt.name}</span>
                    <Badge variant={TARGET_COLORS[wt.target] || 'neutral'} size="xs">
                      {wt.target}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {wTrackingType === 'sets_reps' ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Sets
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={wSets}
                  onChange={(e) => setWSets(e.target.value)}
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Reps / Set
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={wReps}
                  onChange={(e) => setWReps(e.target.value)}
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  value={wWeight}
                  onChange={(e) => setWWeight(e.target.value)}
                  className="input-base"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                required
                value={wDuration}
                onChange={(e) => setWDuration(e.target.value)}
                className="input-base"
              />
            </div>
          )}

          <div className="p-3 bg-subtle rounded-2xl border border-theme space-y-2">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
              Calorie Burn Estimation
            </span>
            <div className="grid grid-cols-2 gap-3">
              {wTrackingType === 'sets_reps' ? (
                <div>
                  <label className="block text-[10px] font-bold text-secondary mb-1">
                    Ideal Burn (kcal / set)
                  </label>
                  <input
                    type="number"
                    value={wIdealCalPerSet}
                    onChange={(e) => setWIdealCalPerSet(e.target.value)}
                    className="input-base text-xs py-1.5"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-secondary mb-1">
                    Ideal Burn (kcal / min)
                  </label>
                  <input
                    type="number"
                    value={wIdealCalPerMin}
                    onChange={(e) => setWIdealCalPerMin(e.target.value)}
                    className="input-base text-xs py-1.5"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-secondary mb-1">
                  Total Burn (Optional Override)
                </label>
                <input
                  type="number"
                  placeholder="Auto-calculated"
                  value={wCalories}
                  onChange={(e) => setWCalories(e.target.value)}
                  className="input-base text-xs py-1.5"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Good form, increased resistance"
              value={wNotes}
              onChange={(e) => setWNotes(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsWorkoutModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingWorkout}>
              Save Exercise
            </Button>
          </div>
        </form>
      </Modal>

      {/* Body Metric Modal */}
      <Modal
        isOpen={isMetricModalOpen}
        onClose={() => setIsMetricModalOpen(false)}
        title="Log Weight & Measurements"
        subtitle="Track physical evolution over time"
      >
        <form onSubmit={handleMetricSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={mDate}
              onChange={(e) => setMDate(e.target.value)}
              className="input-base"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 74.5"
                value={mWeight}
                onChange={(e) => setMWeight(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Waist Circumference (cm)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 82"
                value={mWaist}
                onChange={(e) => setMWaist(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Chest (cm, optional)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 102"
                value={mChest}
                onChange={(e) => setMChest(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Arms (cm, optional)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 36"
                value={mArm}
                onChange={(e) => setMArm(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Fasted morning weigh-in"
              value={mNotes}
              onChange={(e) => setMNotes(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsMetricModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingMetric}>
              Save Measurements
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteWorkoutId}
        onClose={() => setDeleteWorkoutId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this workout log? It will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteWorkoutId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteWorkout}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FitnessTracker;
