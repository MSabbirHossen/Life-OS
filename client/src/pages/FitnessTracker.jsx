import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { DateInput } from '../components/DateInput';
import api from '../utils/api';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import {
  Dumbbell,
  Plus,
  Trash2,
  Edit2,
  Flame,
  Activity,
  Scale,
  LineChart as LineChartIcon,
  Zap,
  Check,
  Search,
  CheckCircle2,
  Sparkles,
  X,
  Timer,
  Info,
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

const TARGET_CONFIG = {
  Muscle: { label: 'Muscle', icon: '🏋️', color: 'indigo' },
  Cardio: { label: 'Cardio', icon: '🏃', color: 'rose' },
  Flexibility: { label: 'Flexibility', icon: '🧘', color: 'purple' },
  Sports: { label: 'Sports', icon: '⚽', color: 'emerald' },
};

const POPULAR_WORKOUT_STAPLES = [
  {
    name: 'Barbell Bench Press',
    target: 'Muscle',
    trackingType: 'sets_reps',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeight: 60,
    met: 6.0,
    muscle: 'Chest',
    source: 'Verified Routine',
    icon: '🏋️',
  },
  {
    name: 'Barbell Back Squat',
    target: 'Muscle',
    trackingType: 'sets_reps',
    defaultSets: 4,
    defaultReps: 8,
    defaultWeight: 70,
    met: 7.5,
    muscle: 'Quads & Glutes',
    source: 'Verified Routine',
    icon: '🦵',
  },
  {
    name: 'Deadlift (Conventional)',
    target: 'Muscle',
    trackingType: 'sets_reps',
    defaultSets: 4,
    defaultReps: 6,
    defaultWeight: 80,
    met: 8.0,
    muscle: 'Full Posterior Chain',
    source: 'Verified Routine',
    icon: '💪',
  },
  {
    name: 'Outdoor Running',
    target: 'Cardio',
    trackingType: 'duration',
    defaultDuration: 30,
    met: 9.8,
    muscle: 'Cardiovascular',
    source: 'Verified Routine',
    icon: '🏃',
  },
  {
    name: 'Jump Rope (Skipping)',
    target: 'Cardio',
    trackingType: 'duration',
    defaultDuration: 20,
    met: 11.0,
    muscle: 'Full Body & Calves',
    source: 'Verified Routine',
    icon: '🦘',
  },
  {
    name: 'Stationary Cycling',
    target: 'Cardio',
    trackingType: 'duration',
    defaultDuration: 30,
    met: 7.0,
    muscle: 'Quads & Cardio',
    source: 'Verified Routine',
    icon: '🚴',
  },
  {
    name: 'Yoga (Vinyasa Flow)',
    target: 'Flexibility',
    trackingType: 'duration',
    defaultDuration: 45,
    met: 3.5,
    muscle: 'Mobility & Flexibility',
    source: 'Verified Routine',
    icon: '🧘',
  },
];

const TARGET_COLORS = {
  Muscle: 'indigo',
  Cardio: 'rose',
  Flexibility: 'purple',
  Sports: 'emerald',
};

// Metric Configuration with Colors, Units, and Icons
const METRIC_CONFIG = {
  weight: { key: 'weight', label: 'Weight', color: '#6366F1', unitMetric: 'kg', unitImperial: 'lbs', icon: '⚖️' },
  waist: { key: 'waist', label: 'Waist', color: '#10B981', unitMetric: 'cm', unitImperial: 'in', icon: '📏' },
  height: { key: 'height', label: 'Height', color: '#06B6D4', unitMetric: 'cm', unitImperial: 'in', icon: '🧍' },
  bodyFat: { key: 'bodyFat', label: 'Body Fat', color: '#F59E0B', unitMetric: '%', unitImperial: '%', icon: '📊' },
  chest: { key: 'chest', label: 'Chest', color: '#EC4899', unitMetric: 'cm', unitImperial: 'in', icon: '👕' },
  arms: { key: 'arms', label: 'Arms', color: '#8B5CF6', unitMetric: 'cm', unitImperial: 'in', icon: '💪' },
  shoulders: { key: 'shoulders', label: 'Shoulders', color: '#3B82F6', unitMetric: 'cm', unitImperial: 'in', icon: '🏋️' },
  hips: { key: 'hips', label: 'Hips', color: '#14B8A6', unitMetric: 'cm', unitImperial: 'in', icon: '👖' },
  thighs: { key: 'thighs', label: 'Thighs', color: '#F97316', unitMetric: 'cm', unitImperial: 'in', icon: '🦵' },
  calves: { key: 'calves', label: 'Calves', color: '#84CC16', unitMetric: 'cm', unitImperial: 'in', icon: '👟' },
  neck: { key: 'neck', label: 'Neck', color: '#A855F7', unitMetric: 'cm', unitImperial: 'in', icon: '🧣' },
};

// Unit Conversion Constants & Helpers
const KG_TO_LBS = 2.20462;
const CM_TO_IN = 0.393701;
const IN_TO_CM = 2.54;

const kgToLbs = (kg) => (kg !== undefined && kg !== null && kg !== '' ? Number((Number(kg) * KG_TO_LBS).toFixed(1)) : '');
const lbsToKg = (lbs) => (lbs !== undefined && lbs !== null && lbs !== '' ? Number((Number(lbs) / KG_TO_LBS).toFixed(2)) : '');
const cmToIn = (cm) => (cm !== undefined && cm !== null && cm !== '' ? Number((Number(cm) * CM_TO_IN).toFixed(1)) : '');
const inToCm = (inches) => (inches !== undefined && inches !== null && inches !== '' ? Number((Number(inches) * IN_TO_CM).toFixed(1)) : '');

export const FitnessTracker = ({ selectedDate }) => {
  const currentDate = selectedDate || getFormattedDate();

  const [workouts, setWorkouts] = useState([]);
  const [bodyMetrics, setBodyMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Unit System State ('metric' = kg, cm | 'imperial' = lbs, in)
  const [unitSystem, setUnitSystem] = useState(
    () => localStorage.getItem('lifeos_fitness_unit_system') || 'metric'
  );

  const handleUnitSystemChange = (newUnit) => {
    setUnitSystem(newUnit);
    try {
      localStorage.setItem('lifeos_fitness_unit_system', newUnit);
    } catch (e) {
      console.error(e);
    }
  };

  // Selected graph metric filter ('all' = all active metrics at once, or specific key)
  const [selectedGraphMetric, setSelectedGraphMetric] = useState('all');

  // Modals
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [deleteWorkoutId, setDeleteWorkoutId] = useState(null);
  const [editingMetricId, setEditingMetricId] = useState(null);
  const [deleteMetricId, setDeleteMetricId] = useState(null);

  // Workout Form State
  const [wDate, setWDate] = useState(currentDate);
  const [wName, setWName] = useState('');
  const [wTrackingType, setWTrackingType] = useState('sets_reps'); // 'sets_reps' | 'duration'
  const [wSets, setWSets] = useState('');
  const [wReps, setWReps] = useState('');
  const [wWeight, setWWeight] = useState('');
  const [wDuration, setWDuration] = useState('');
  const [wCalories, setWCalories] = useState('');
  const [wMet, setWMet] = useState(6.0);
  const [wIdealCalPerSet, setWIdealCalPerSet] = useState(8);
  const [wIdealCalPerMin, setWIdealCalPerMin] = useState(6);
  const [wTarget, setWTarget] = useState('Muscle');
  const [wNotes, setWNotes] = useState('');
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [savingMetric, setSavingMetric] = useState(false);

  // Workout Autocomplete Suggestions
  const [selectedWorkoutType, setSelectedWorkoutType] = useState(null);
  const [wSuggestions, setWSuggestions] = useState([]);
  const [showWSuggestions, setShowWSuggestions] = useState(false);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);

  // Metric Form State (placeholders instead of default values)
  const [mDate, setMDate] = useState(currentDate);
  const [mWeight, setMWeight] = useState('');
  const [mHeight, setMHeight] = useState('');
  const [mWaist, setMWaist] = useState('');
  const [mBodyFat, setMBodyFat] = useState('');
  const [mChest, setMChest] = useState('');
  const [mArm, setMArm] = useState('');
  const [mShoulders, setMShoulders] = useState('');
  const [mHips, setMHips] = useState('');
  const [mThighs, setMThighs] = useState('');
  const [mCalves, setMCalves] = useState('');
  const [mNeck, setMNeck] = useState('');
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

  // Latest user weight for calorie estimation (defaults to 70kg)
  const latestUserWeight = useMemo(() => {
    const found = bodyMetrics.slice().reverse().find((m) => m.weightKg && m.weightKg > 0);
    return found ? found.weightKg : 70;
  }, [bodyMetrics]);

  // Live calorie calculation formula based on MET, duration/sets, and user weight
  const estimatedCalories = useMemo(() => {
    const weightKg = latestUserWeight;
    if (wTrackingType === 'duration') {
      const met = Number(wMet) || (wTarget === 'Cardio' ? 8.5 : wTarget === 'Sports' ? 7.5 : wTarget === 'Flexibility' ? 3.5 : 6.0);
      const hours = (Number(wDuration) || 0) / 60;
      return Math.round(met * weightKg * hours);
    } else {
      // Strength sets & reps
      const sets = Number(wSets) || 0;
      const reps = Number(wReps) || 0;
      if (sets === 0 || reps === 0) return 0;
      const liftWeight = Number(wWeight) || 0;
      const weightBonus = liftWeight > 0 ? (liftWeight / 100) * 0.2 : 0;
      const calPerRep = 0.8 + weightBonus;
      const bodyFactor = weightKg / 70;
      return Math.max(5, Math.round(sets * reps * calPerRep * bodyFactor));
    }
  }, [wTrackingType, wDuration, wMet, wTarget, wSets, wReps, wWeight, latestUserWeight]);

  // Autocomplete Workout Types Search
  useEffect(() => {
    if (!wName.trim() || wName.length < 2 || selectedWorkoutType) {
      setWSuggestions([]);
      setShowWSuggestions(false);
      return;
    }

    setSearchingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/workout-types/search?q=${encodeURIComponent(wName.trim())}`);
        setWSuggestions(res.data || []);
        setShowWSuggestions(true);
      } catch (err) {
        console.error('Failed workout search', err);
      } finally {
        setSearchingSuggestions(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [wName, selectedWorkoutType]);

  const handleSelectWorkoutType = (wt) => {
    setSelectedWorkoutType(wt);
    setWName(wt.name);
    const target = wt.target || 'Muscle';
    setWTarget(target);
    const trackingType = wt.trackingType || (target === 'Cardio' || target === 'Sports' || target === 'Flexibility' ? 'duration' : 'sets_reps');
    setWTrackingType(trackingType);

    if (wt.met) setWMet(wt.met);
    if (wt.caloriesPerSet) setWIdealCalPerSet(wt.caloriesPerSet);
    if (wt.defaultCaloriesPerMinute) setWIdealCalPerMin(wt.defaultCaloriesPerMinute);

    if (trackingType === 'duration') {
      const dur = wt.defaultDuration || 30;
      setWDuration(dur);
      setWSets('');
      setWReps('');
      setWWeight('');
    } else {
      const sets = wt.defaultSets !== undefined && wt.defaultSets !== null ? wt.defaultSets : 3;
      const reps = wt.defaultReps !== undefined && wt.defaultReps !== null ? wt.defaultReps : 10;
      const weight = wt.defaultWeight !== undefined && wt.defaultWeight !== null && wt.defaultWeight !== 0 ? wt.defaultWeight : '';
      setWSets(sets);
      setWReps(reps);
      setWWeight(weight);
      setWDuration('');
    }

    setShowWSuggestions(false);
  };

  const openCreateWorkoutModal = () => {
    setEditingWorkoutId(null);
    setSelectedWorkoutType(null);
    setWDate(currentDate);
    setWName('');
    setWTrackingType('sets_reps');
    setWSets('');
    setWReps('');
    setWWeight('');
    setWDuration('');
    setWCalories('');
    setWTarget('Muscle');
    setWNotes('');
    setIsWorkoutModalOpen(true);
  };

  const handleEditWorkout = (w) => {
    setEditingWorkoutId(w._id);
    setSelectedWorkoutType(null);
    setWDate(w.date || currentDate);
    setWName(w.name || '');
    setWTrackingType(w.trackingType || (w.sets > 0 ? 'sets_reps' : 'duration'));
    setWSets(w.sets !== undefined && w.sets !== null ? w.sets : '');
    setWReps(w.reps !== undefined && w.reps !== null ? w.reps : '');
    setWWeight(w.weight !== undefined && w.weight !== 0 && w.weight !== null ? w.weight : '');
    setWDuration(w.durationMinutes !== undefined && w.durationMinutes !== null ? w.durationMinutes : '');
    setWCalories(w.caloriesBurned !== undefined && w.caloriesBurned !== null ? w.caloriesBurned : '');
    setWTarget(w.target || 'Muscle');
    setWNotes(w.notes || '');
    setIsWorkoutModalOpen(true);
  };

  const openCreateMetricModal = () => {
    setEditingMetricId(null);
    setMDate(currentDate);
    setMWeight('');
    setMHeight('');
    setMWaist('');
    setMBodyFat('');
    setMChest('');
    setMArm('');
    setMShoulders('');
    setMHips('');
    setMThighs('');
    setMCalves('');
    setMNeck('');
    setMNotes('');
    setIsMetricModalOpen(true);
  };

  const handleEditMetric = (metric) => {
    setEditingMetricId(metric._id);
    setMDate(metric.date || currentDate);
    if (unitSystem === 'imperial') {
      setMWeight(metric.weightKg ? kgToLbs(metric.weightKg) : '');
      setMHeight(metric.heightCm ? cmToIn(metric.heightCm) : '');
      setMWaist(metric.waistCm ? cmToIn(metric.waistCm) : '');
      setMBodyFat(metric.bodyFatPercent !== undefined && metric.bodyFatPercent !== null ? metric.bodyFatPercent : '');
      setMChest(metric.chestCm ? cmToIn(metric.chestCm) : '');
      setMArm(metric.armCm ? cmToIn(metric.armCm) : '');
      setMShoulders(metric.shouldersCm ? cmToIn(metric.shouldersCm) : '');
      setMHips(metric.hipsCm ? cmToIn(metric.hipsCm) : '');
      setMThighs(metric.thighsCm ? cmToIn(metric.thighsCm) : '');
      setMCalves(metric.calvesCm ? cmToIn(metric.calvesCm) : '');
      setMNeck(metric.neckCm ? cmToIn(metric.neckCm) : '');
    } else {
      setMWeight(metric.weightKg !== undefined && metric.weightKg !== null ? metric.weightKg : '');
      setMHeight(metric.heightCm !== undefined && metric.heightCm !== null ? metric.heightCm : '');
      setMWaist(metric.waistCm !== undefined && metric.waistCm !== null ? metric.waistCm : '');
      setMBodyFat(metric.bodyFatPercent !== undefined && metric.bodyFatPercent !== null ? metric.bodyFatPercent : '');
      setMChest(metric.chestCm !== undefined && metric.chestCm !== null ? metric.chestCm : '');
      setMArm(metric.armCm !== undefined && metric.armCm !== null ? metric.armCm : '');
      setMShoulders(metric.shouldersCm !== undefined && metric.shouldersCm !== null ? metric.shouldersCm : '');
      setMHips(metric.hipsCm !== undefined && metric.hipsCm !== null ? metric.hipsCm : '');
      setMThighs(metric.thighsCm !== undefined && metric.thighsCm !== null ? metric.thighsCm : '');
      setMCalves(metric.calvesCm !== undefined && metric.calvesCm !== null ? metric.calvesCm : '');
      setMNeck(metric.neckCm !== undefined && metric.neckCm !== null ? metric.neckCm : '');
    }
    setMNotes(metric.notes || '');
    setIsMetricModalOpen(true);
  };

  const handleToggleModalUnit = (targetUnit) => {
    if (targetUnit === unitSystem) return;
    if (targetUnit === 'imperial') {
      // metric -> imperial
      if (mWeight) setMWeight(kgToLbs(mWeight));
      if (mHeight) setMHeight(cmToIn(mHeight));
      if (mWaist) setMWaist(cmToIn(mWaist));
      if (mChest) setMChest(cmToIn(mChest));
      if (mArm) setMArm(cmToIn(mArm));
      if (mShoulders) setMShoulders(cmToIn(mShoulders));
      if (mHips) setMHips(cmToIn(mHips));
      if (mThighs) setMThighs(cmToIn(mThighs));
      if (mCalves) setMCalves(cmToIn(mCalves));
      if (mNeck) setMNeck(cmToIn(mNeck));
    } else {
      // imperial -> metric
      if (mWeight) setMWeight(lbsToKg(mWeight));
      if (mHeight) setMHeight(inToCm(mHeight));
      if (mWaist) setMWaist(inToCm(mWaist));
      if (mChest) setMChest(inToCm(mChest));
      if (mArm) setMArm(inToCm(mArm));
      if (mShoulders) setMShoulders(inToCm(mShoulders));
      if (mHips) setMHips(inToCm(mHips));
      if (mThighs) setMThighs(inToCm(mThighs));
      if (mCalves) setMCalves(inToCm(mCalves));
      if (mNeck) setMNeck(inToCm(mNeck));
    }
    handleUnitSystemChange(targetUnit);
  };

  const handleWorkoutSubmit = async (e) => {
    e.preventDefault();
    if (!wName.trim()) return;

    const finalCalories = wCalories ? Number(wCalories) : estimatedCalories;

    setSavingWorkout(true);
    try {
      const payload = {
        date: wDate,
        name: wName.trim(),
        trackingType: wTrackingType,
        sets: wSets ? Number(wSets) : 3,
        reps: wReps ? Number(wReps) : 10,
        weight: wWeight ? Number(wWeight) : 0,
        durationMinutes: wDuration ? Number(wDuration) : 30,
        caloriesBurned: finalCalories,
        idealCaloriesPerSet: Number(wIdealCalPerSet),
        idealCaloriesPerMin: Number(wIdealCalPerMin),
        target: wTarget,
        notes: wNotes.trim(),
      };

      if (editingWorkoutId) {
        const res = await api.put(`/workouts/${editingWorkoutId}`, payload);
        setIsWorkoutModalOpen(false);
        setEditingWorkoutId(null);
        if (res.data) {
          setWorkouts((prev) =>
            prev.map((w) => (w._id === editingWorkoutId ? res.data : w))
          );
        }
      } else {
        const res = await api.post('/workouts', payload);
        setIsWorkoutModalOpen(false);
        if (res.data) setWorkouts((prev) => [res.data, ...prev]);
      }
      setWName('');
      setWNotes('');
      setWCalories('');
      fetchData(false);
    } catch (err) {
      console.error('Failed to log workout', err);
    } finally {
      setSavingWorkout(false);
    }
  };

  const handleMetricSubmit = async (e) => {
    e.preventDefault();
    if (
      !mWeight &&
      !mHeight &&
      !mWaist &&
      !mBodyFat &&
      !mChest &&
      !mArm &&
      !mShoulders &&
      !mHips &&
      !mThighs &&
      !mCalves &&
      !mNeck
    ) {
      return;
    }

    setSavingMetric(true);
    try {
      const isImp = unitSystem === 'imperial';
      const weightInKg = isImp ? lbsToKg(mWeight) : (mWeight ? Number(mWeight) : undefined);
      const heightInCm = isImp ? inToCm(mHeight) : (mHeight ? Number(mHeight) : undefined);
      const waistInCm = isImp ? inToCm(mWaist) : (mWaist ? Number(mWaist) : undefined);
      const chestInCm = isImp ? inToCm(mChest) : (mChest ? Number(mChest) : undefined);
      const armInCm = isImp ? inToCm(mArm) : (mArm ? Number(mArm) : undefined);
      const shouldersInCm = isImp ? inToCm(mShoulders) : (mShoulders ? Number(mShoulders) : undefined);
      const hipsInCm = isImp ? inToCm(mHips) : (mHips ? Number(mHips) : undefined);
      const thighsInCm = isImp ? inToCm(mThighs) : (mThighs ? Number(mThighs) : undefined);
      const calvesInCm = isImp ? inToCm(mCalves) : (mCalves ? Number(mCalves) : undefined);
      const neckInCm = isImp ? inToCm(mNeck) : (mNeck ? Number(mNeck) : undefined);
      const bodyFatNum = mBodyFat !== '' && mBodyFat !== null && mBodyFat !== undefined ? Number(mBodyFat) : undefined;

      const payload = {
        date: mDate,
        weightKg: weightInKg !== undefined && weightInKg !== '' ? Number(weightInKg) : undefined,
        heightCm: heightInCm !== undefined && heightInCm !== '' ? Number(heightInCm) : undefined,
        waistCm: waistInCm !== undefined && waistInCm !== '' ? Number(waistInCm) : undefined,
        bodyFatPercent: bodyFatNum !== undefined && !isNaN(bodyFatNum) ? Number(bodyFatNum) : undefined,
        chestCm: chestInCm !== undefined && chestInCm !== '' ? Number(chestInCm) : undefined,
        armCm: armInCm !== undefined && armInCm !== '' ? Number(armInCm) : undefined,
        shouldersCm: shouldersInCm !== undefined && shouldersInCm !== '' ? Number(shouldersInCm) : undefined,
        hipsCm: hipsInCm !== undefined && hipsInCm !== '' ? Number(hipsInCm) : undefined,
        thighsCm: thighsInCm !== undefined && thighsInCm !== '' ? Number(thighsCm) : undefined,
        calvesCm: calvesInCm !== undefined && calvesInCm !== '' ? Number(calvesInCm) : undefined,
        neckCm: neckInCm !== undefined && neckInCm !== '' ? Number(neckInCm) : undefined,
        notes: mNotes.trim(),
      };

      if (editingMetricId) {
        const res = await api.put(`/body-metrics/${editingMetricId}`, payload);
        setIsMetricModalOpen(false);
        setEditingMetricId(null);
        if (res.data) {
          setBodyMetrics((prev) =>
            prev.map((m) => (m._id === editingMetricId ? res.data : m))
          );
        }
      } else {
        const res = await api.post('/body-metrics', payload);
        setIsMetricModalOpen(false);
        if (res.data) setBodyMetrics((prev) => [...prev.filter((m) => m.date !== mDate), res.data]);
      }
      openCreateMetricModal();
      setIsMetricModalOpen(false);
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

  const handleDeleteMetric = async () => {
    if (!deleteMetricId) return;
    const targetId = deleteMetricId;
    setDeleteMetricId(null);
    setBodyMetrics((prev) => prev.filter((m) => m._id !== targetId));

    try {
      await api.delete(`/body-metrics/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete body metric', err);
      fetchData(false);
    }
  };

  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const totalWorkoutMinutes = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
  const latestWeight = bodyMetrics.slice().reverse().find((m) => m.weightKg)?.weightKg;

  // Compute full multi-metric chart data
  const chartData = useMemo(() => {
    return bodyMetrics.map((m) => {
      const isImp = unitSystem === 'imperial';
      return {
        date: m.date.slice(5),
        fullDate: m.date,
        weight: m.weightKg !== undefined && m.weightKg !== null ? (isImp ? kgToLbs(m.weightKg) : m.weightKg) : null,
        waist: m.waistCm !== undefined && m.waistCm !== null ? (isImp ? cmToIn(m.waistCm) : m.waistCm) : null,
        height: m.heightCm !== undefined && m.heightCm !== null ? (isImp ? cmToIn(m.heightCm) : m.heightCm) : null,
        bodyFat: m.bodyFatPercent !== undefined && m.bodyFatPercent !== null ? m.bodyFatPercent : null,
        chest: m.chestCm !== undefined && m.chestCm !== null ? (isImp ? cmToIn(m.chestCm) : m.chestCm) : null,
        arms: m.armCm !== undefined && m.armCm !== null ? (isImp ? cmToIn(m.armCm) : m.armCm) : null,
        shoulders: m.shouldersCm !== undefined && m.shouldersCm !== null ? (isImp ? cmToIn(m.shouldersCm) : m.shouldersCm) : null,
        hips: m.hipsCm !== undefined && m.hipsCm !== null ? (isImp ? cmToIn(m.hipsCm) : m.hipsCm) : null,
        thighs: m.thighsCm !== undefined && m.thighsCm !== null ? (isImp ? cmToIn(m.thighsCm) : m.thighsCm) : null,
        calves: m.calvesCm !== undefined && m.calvesCm !== null ? (isImp ? cmToIn(m.calvesCm) : m.calvesCm) : null,
        neck: m.neckCm !== undefined && m.neckCm !== null ? (isImp ? cmToIn(m.neckCm) : m.neckCm) : null,
      };
    });
  }, [bodyMetrics, unitSystem]);

  // Determine active metrics that actually have at least one valid data point across the dataset
  const activeMetrics = useMemo(() => {
    const keys = Object.keys(METRIC_CONFIG);
    return keys.filter((k) =>
      chartData.some((d) => d[k] !== null && d[k] !== undefined && !isNaN(d[k]))
    );
  }, [chartData]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Health & Physicality"
        title="Fitness & Workouts"
        description={`Track strength, cardio, and energy expenditure with real MET-based calorie burn calculations for ${formatDisplayDate(currentDate)}`}
        action={
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={Scale}
              onClick={openCreateMetricModal}
            >
              Measurements
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={openCreateWorkoutModal}
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
          value={latestWeight ? `${latestWeight} kg` : `${latestUserWeight} kg (est)`}
          subtitle="Used for accurate calorie formula"
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
            onAction={openCreateWorkoutModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {workouts.map((w) => (
              <Card
                key={w._id}
                hover
                bottomAction={
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditWorkout(w)}
                      className="p-1.5 rounded-lg bg-surface/90 dark:bg-surface/90 backdrop-blur-xs border border-theme/60 text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/10 shadow-xs transition-all cursor-pointer"
                      title="Edit Workout"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteWorkoutId(w._id)}
                      className="p-1.5 rounded-lg bg-surface/90 dark:bg-surface/90 backdrop-blur-xs border border-theme/60 text-secondary hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 shadow-xs transition-all cursor-pointer"
                      title="Delete Workout"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                }
              >
                <div className="space-y-3 pb-2">
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
          title="Body Measurements Progress"
          subtitle="Interactive multi-metric trends and sparse data tracking"
          icon={LineChartIcon}
          className="lg:col-span-2"
          badge={
            <div className="flex bg-subtle p-0.5 rounded-xl border border-theme">
              <button
                type="button"
                onClick={() => handleUnitSystemChange('metric')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  unitSystem === 'metric'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                kg / cm
              </button>
              <button
                type="button"
                onClick={() => handleUnitSystemChange('imperial')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  unitSystem === 'imperial'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                lbs / in
              </button>
            </div>
          }
        >
          {activeMetrics.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-secondary italic bg-subtle/50 rounded-2xl border border-dashed border-theme mt-2 p-6 text-center">
              <Scale className="w-10 h-10 text-muted mb-2 stroke-1" />
              <p className="font-bold text-primary text-sm not-italic">No measurements recorded yet</p>
              <p className="text-secondary mt-1 max-w-xs">
                Log your weight, height, waist, or body circumferences to visualize your physical transformation trajectory.
              </p>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={openCreateMetricModal}
                className="mt-4"
              >
                Log First Measurement
              </Button>
            </div>
          ) : (
            <div className="space-y-3 mt-1">
              {/* Interactive Metric Filter Pill Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedGraphMetric('all')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                    selectedGraphMetric === 'all'
                      ? 'bg-accent text-white border-accent shadow-xs'
                      : 'bg-subtle text-secondary border-theme hover:text-primary hover:bg-surface'
                  }`}
                >
                  All Data ({activeMetrics.length})
                </button>
                {activeMetrics.map((key) => {
                  const cfg = METRIC_CONFIG[key];
                  const isSelected = selectedGraphMetric === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedGraphMetric(key)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-surface text-primary border-accent shadow-xs'
                          : 'bg-subtle text-secondary border-theme hover:text-primary hover:bg-surface'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Multi-Line Recharts Plot */}
              <div className="h-64 sm:h-72 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.12} />
                    <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const fullDate = payload[0]?.payload?.fullDate || label;
                          return (
                            <div className="bg-surface/98 dark:bg-surface/95 backdrop-blur-xl border border-theme rounded-2xl shadow-xl p-3 text-xs space-y-1.5 min-w-[180px]">
                              <span className="font-bold text-primary block pb-1 border-b border-subtle">
                                {formatDisplayDate(fullDate)}
                              </span>
                              <div className="space-y-1">
                                {payload.map((entry) => {
                                  const cfg = METRIC_CONFIG[entry.dataKey];
                                  if (!cfg || entry.value === null || entry.value === undefined) return null;
                                  const unit = unitSystem === 'imperial' ? cfg.unitImperial : cfg.unitMetric;
                                  return (
                                    <div key={entry.dataKey} className="flex items-center justify-between gap-3">
                                      <span className="flex items-center gap-1.5 font-medium text-secondary">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                                        {cfg.label}:
                                      </span>
                                      <span className="font-extrabold text-primary">
                                        {entry.value} {unit}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      formatter={(val) => <span className="text-xs font-semibold text-primary">{val}</span>}
                    />
                    {activeMetrics.map((key) => {
                      const cfg = METRIC_CONFIG[key];
                      const isVisible = selectedGraphMetric === 'all' || selectedGraphMetric === key;
                      if (!isVisible) return null;
                      const unit = unitSystem === 'imperial' ? cfg.unitImperial : cfg.unitMetric;
                      return (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={`${cfg.label} (${unit})`}
                          stroke={cfg.color}
                          strokeWidth={2.5}
                          dot={{ r: 3.5, strokeWidth: 1 }}
                          activeDot={{ r: 6 }}
                          connectNulls
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>

        {/* Recent Measurement Log History Card */}
        <Card
          hover
          title="Measurement Log"
          subtitle="Recent metrics recorded"
          icon={Scale}
          action={
            <Button variant="ghost" size="xs" icon={Plus} onClick={openCreateMetricModal}>
              Log
            </Button>
          }
        >
          {bodyMetrics.length === 0 ? (
            <p className="text-xs text-secondary italic py-4">No measurements logged yet.</p>
          ) : (
            <div className="space-y-3 mt-1 max-h-[380px] overflow-y-auto pr-1">
              {bodyMetrics
                .slice()
                .reverse()
                .slice(0, 10)
                .map((m, idx) => (
                  <div
                    key={m._id || idx}
                    className="p-3.5 rounded-2xl bg-subtle border border-theme flex flex-col justify-between gap-2.5 transition-all hover:border-theme-strong"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary block">{formatDisplayDate(m.date)}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditMetric(m)}
                          className="p-1.5 rounded-lg bg-surface/90 dark:bg-surface/90 backdrop-blur-xs border border-theme/60 text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/10 shadow-xs transition-all cursor-pointer"
                          title="Edit Measurement"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteMetricId(m._id)}
                          className="p-1.5 rounded-lg bg-surface/90 dark:bg-surface/90 backdrop-blur-xs border border-theme/60 text-secondary hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 shadow-xs transition-all cursor-pointer"
                          title="Delete Measurement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {m.weightKg && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                          Weight: {unitSystem === 'metric' ? `${m.weightKg} kg` : `${kgToLbs(m.weightKg)} lbs`}
                        </span>
                      )}
                      {m.heightCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-semibold">
                          Height: {unitSystem === 'metric' ? `${m.heightCm} cm` : `${cmToIn(m.heightCm)} in`}
                        </span>
                      )}
                      {m.waistCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                          Waist: {unitSystem === 'metric' ? `${m.waistCm} cm` : `${cmToIn(m.waistCm)} in`}
                        </span>
                      )}
                      {m.bodyFatPercent !== undefined && m.bodyFatPercent !== null && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                          BF: {m.bodyFatPercent}%
                        </span>
                      )}
                      {m.chestCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 font-semibold">
                          Chest: {unitSystem === 'metric' ? `${m.chestCm} cm` : `${cmToIn(m.chestCm)} in`}
                        </span>
                      )}
                      {m.armCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold">
                          Arms: {unitSystem === 'metric' ? `${m.armCm} cm` : `${cmToIn(m.armCm)} in`}
                        </span>
                      )}
                      {m.shouldersCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold">
                          Shoulders: {unitSystem === 'metric' ? `${m.shouldersCm} cm` : `${cmToIn(m.shouldersCm)} in`}
                        </span>
                      )}
                      {m.hipsCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-semibold">
                          Hips: {unitSystem === 'metric' ? `${m.hipsCm} cm` : `${cmToIn(m.hipsCm)} in`}
                        </span>
                      )}
                      {m.thighsCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-semibold">
                          Thighs: {unitSystem === 'metric' ? `${m.thighsCm} cm` : `${cmToIn(m.thighsCm)} in`}
                        </span>
                      )}
                      {m.calvesCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-lime-500/10 text-lime-600 dark:text-lime-400 border border-lime-500/20 font-semibold">
                          Calves: {unitSystem === 'metric' ? `${m.calvesCm} cm` : `${cmToIn(m.calvesCm)} in`}
                        </span>
                      )}
                      {m.neckCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 font-semibold">
                          Neck: {unitSystem === 'metric' ? `${m.neckCm} cm` : `${cmToIn(m.neckCm)} in`}
                        </span>
                      )}
                    </div>

                    {m.notes && (
                      <p className="text-[11px] text-secondary italic border-t border-subtle/80 pt-1.5">
                        "{m.notes}"
                      </p>
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
        title={editingWorkoutId ? 'Edit Workout Log' : 'Log Exercise / Workout'}
        subtitle={editingWorkoutId ? 'Update exercises, sets, reps, and energy burn' : 'Smart autocomplete with auto-deduced sets, reps, weight, duration, and MET calorie burns'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleWorkoutSubmit} className="space-y-4">
          {/* Tracking Type Mode Switcher */}
          <div className="flex bg-subtle p-1 rounded-xl border border-theme">
            <button
              type="button"
              onClick={() => {
                setWTrackingType('sets_reps');
                if (wTarget === 'Cardio' || wTarget === 'Flexibility') setWTarget('Muscle');
                if (!wSets) setWSets(3);
                if (!wReps) setWReps(10);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                wTrackingType === 'sets_reps'
                  ? 'bg-surface text-primary card-shadow ring-1 ring-accent/20'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <span>🏋️</span> Sets & Reps (Strength)
            </button>
            <button
              type="button"
              onClick={() => {
                setWTrackingType('duration');
                if (wTarget === 'Muscle') setWTarget('Cardio');
                if (!wDuration) setWDuration(30);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                wTrackingType === 'duration'
                  ? 'bg-surface text-primary card-shadow ring-1 ring-accent/20'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <span>⏱️</span> Time & Duration (Cardio/Sports)
            </button>
          </div>

          {/* Date & Target Category Pills */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Target Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TARGET_TYPES.map((t) => {
                  const conf = TARGET_CONFIG[t] || { icon: '🎯', label: t, color: 'indigo' };
                  const isSelected = wTarget === t;
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => {
                        setWTarget(t);
                        if ((t === 'Cardio' || t === 'Sports' || t === 'Flexibility') && wTrackingType === 'sets_reps') {
                          setWTrackingType('duration');
                          if (!wDuration) setWDuration(30);
                        } else if (t === 'Muscle' && wTrackingType === 'duration') {
                          setWTrackingType('sets_reps');
                          if (!wSets) setWSets(3);
                          if (!wReps) setWReps(10);
                        }
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-accent/15 border-accent text-accent shadow-sm shadow-accent/20 ring-1 ring-accent/30'
                          : 'bg-surface hover:bg-subtle border-theme text-secondary hover:text-primary'
                      }`}
                    >
                      <span className="text-base">{conf.icon}</span>
                      <span>{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <DateInput
              label="Workout Date"
              value={wDate}
              onChange={setWDate}
              required
            />
          </div>

          {/* Autocomplete Exercise Search Input & Quick Staples */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
                Exercise Name (Search server library)
              </label>
              {selectedWorkoutType && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Auto-deduced from {selectedWorkoutType.source || 'Verified Library'}
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="Search exercise e.g. Bench Press, Squats, Running, Jump Rope..."
                value={wName}
                onChange={(e) => {
                  setWName(e.target.value);
                  setSelectedWorkoutType(null);
                  setShowWSuggestions(true);
                }}
                onFocus={() => {
                  if (wSuggestions.length > 0) setShowWSuggestions(true);
                }}
                className="input-base pl-10 pr-10"
              />
              {wName && (
                <button
                  type="button"
                  onClick={() => {
                    setWName('');
                    setSelectedWorkoutType(null);
                    setShowWSuggestions(false);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {searchingSuggestions && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Popular Staples Quick Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
              <span className="text-[10px] font-bold text-secondary uppercase shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-accent" /> Staples:
              </span>
              {POPULAR_WORKOUT_STAPLES.map((staple) => {
                const isCurrent = selectedWorkoutType?.name === staple.name || wName === staple.name;
                return (
                  <button
                    type="button"
                    key={staple.name}
                    onClick={() => handleSelectWorkoutType(staple)}
                    className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-accent/15 border-accent text-accent shadow-xs'
                        : 'bg-subtle/70 hover:bg-subtle border-theme text-secondary hover:text-primary'
                    }`}
                  >
                    <span>{staple.icon}</span>
                    <span>{staple.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Exercise Guidance Banner */}
            {!selectedWorkoutType && wName.trim().length >= 2 && wSuggestions.length === 0 && !searchingSuggestions && (
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2 text-[11px] text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">New Custom Exercise</span>
                  <span className="text-secondary text-[10px]">
                    Set your target Sets, Reps / Set, Weight (kg), or Duration below. Life OS will calculate your energy burn and save this exercise to your routine for future logs!
                  </span>
                </div>
              </div>
            )}

            {/* Suggestions Dropdown */}
            {showWSuggestions && wSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-surface border border-theme rounded-2xl card-shadow z-30 max-h-60 overflow-y-auto divide-y divide-theme/40 shadow-xl">
                {wSuggestions.map((wt, idx) => (
                  <div
                    key={wt._id || idx}
                    onClick={() => handleSelectWorkoutType(wt)}
                    className="p-3 hover:bg-subtle cursor-pointer flex items-center justify-between text-xs transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-primary group-hover:text-accent transition-colors">
                          {wt.name}
                        </span>
                        {wt.equipment && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-subtle text-secondary border border-theme">
                            {wt.equipment}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-secondary font-medium">
                        {wt.trackingType === 'duration'
                          ? `⏱️ ${wt.defaultDuration || 30} mins`
                          : `🏋️ ${wt.defaultSets || 3} sets × ${wt.defaultReps || 10} reps ${wt.defaultWeight ? `@ ${wt.defaultWeight}kg` : ''}`}
                        {wt.met ? ` · MET: ${wt.met}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={TARGET_COLORS[wt.target] || 'neutral'} size="xs">
                        {wt.target || 'Exercise'}
                      </Badge>
                      {wt.source && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface border border-theme text-secondary font-medium">
                          {wt.source}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Direct Custom Selection Option */}
                {wName.trim().length >= 2 && (
                  <div
                    onClick={() => {
                      setSelectedWorkoutType({ name: wName.trim(), isCustom: true });
                      setShowWSuggestions(false);
                    }}
                    className="p-2.5 bg-accent/5 hover:bg-accent/10 cursor-pointer flex items-center justify-between text-xs text-accent font-bold transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Set custom workout parameters for "{wName}"
                    </span>
                    <Badge variant="primary" size="xs">Custom Item</Badge>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Exercise Numeric Parameters (Sets & Reps vs Duration) */}
          {wTrackingType === 'sets_reps' ? (
            <div className="space-y-3 p-4 bg-subtle/50 rounded-2xl border border-theme">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-accent" /> Strength Configuration
                </span>
                {(!wSets || !wReps) && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <Info className="w-3 h-3" /> Please set sets & reps
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Sets */}
                <div className="p-2.5 rounded-xl bg-surface border border-theme shadow-xs">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                    Sets
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={wSets}
                    onChange={(e) => setWSets(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full bg-subtle/60 border border-theme rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                  />
                  <div className="flex items-center gap-1 mt-2">
                    {[3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setWSets(s)}
                        className={`flex-1 py-0.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                          Number(wSets) === s
                            ? 'bg-accent text-white border-accent'
                            : 'bg-subtle text-secondary hover:text-primary border-theme'
                        }`}
                      >
                        {s} sets
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reps */}
                <div className="p-2.5 rounded-xl bg-surface border border-theme shadow-xs">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                    Reps / Set
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={wReps}
                    onChange={(e) => setWReps(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full bg-subtle/60 border border-theme rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                  />
                  <div className="flex items-center gap-1 mt-2">
                    {[8, 10, 12, 15].map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setWReps(r)}
                        className={`flex-1 py-0.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                          Number(wReps) === r
                            ? 'bg-accent text-white border-accent'
                            : 'bg-subtle text-secondary hover:text-primary border-theme'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weight */}
                <div className="p-2.5 rounded-xl bg-surface border border-theme shadow-xs">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                    Lifted Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 20"
                    value={wWeight}
                    onChange={(e) => setWWeight(e.target.value)}
                    className="w-full bg-subtle/60 border border-theme rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                  />
                  <div className="flex items-center gap-1 mt-2">
                    {[0, 20, 40, 60, 80].map((wtVal) => (
                      <button
                        type="button"
                        key={wtVal}
                        onClick={() => setWWeight(wtVal)}
                        className={`flex-1 py-0.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                          String(wWeight) === String(wtVal)
                            ? 'bg-accent text-white border-accent'
                            : 'bg-subtle text-secondary hover:text-primary border-theme'
                        }`}
                      >
                        {wtVal}{wtVal === 0 ? ' (BW)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Incomplete Strength Prompt */}
              {(!wSets || !wReps) && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[10px] text-amber-700 dark:text-amber-300">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Missing Sets or Reps:</strong> Enter your target Sets and Reps / Set so Life OS can calculate your total volume and energy expenditure.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 p-4 bg-subtle/50 rounded-2xl border border-theme">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-rose-500" /> Duration Configuration
                </span>
                {!wDuration && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <Info className="w-3 h-3" /> Please set duration
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-surface border border-theme shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
                    Workout Duration
                  </label>
                  <span className="text-[9px] text-secondary font-semibold">minutes</span>
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  value={wDuration}
                  onChange={(e) => setWDuration(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-rose-500"
                />

                <div className="flex items-center gap-1.5 mt-2">
                  {[15, 20, 30, 45, 60].map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setWDuration(d)}
                      className={`flex-1 py-1 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                        Number(wDuration) === d
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-subtle text-secondary hover:text-primary border-theme'
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Incomplete Duration Prompt */}
              {!wDuration && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[10px] text-amber-700 dark:text-amber-300">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Missing Duration:</strong> Enter your workout Duration in minutes to calculate MET-based calorie burn.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Live Calorie Burn Estimation HUD */}
          <div className="p-4 bg-gradient-to-br from-surface to-subtle rounded-2xl border border-theme shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                  Live Calorie Estimation
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold border border-rose-500/20">
                  {wTrackingType === 'sets_reps'
                    ? `${wSets || 0}s × ${wReps || 0}r ${wWeight ? `@ ${wWeight}kg` : ''}`
                    : `${wDuration || 0} mins`}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                  ~{estimatedCalories}
                </span>
                <span className="text-xs font-bold text-secondary">kcal</span>
              </div>
            </div>

            <p className="text-[11px] text-secondary">
              Formula based on MET {wMet || 6.0} and your weight ({latestUserWeight} kg).
            </p>

            <div>
              <label className="block text-[10px] font-bold text-secondary mb-1">
                Custom Calorie Override (Leave blank to use calculated ~{estimatedCalories} kcal)
              </label>
              <input
                type="number"
                placeholder={`Auto: ${estimatedCalories} kcal`}
                value={wCalories}
                onChange={(e) => setWCalories(e.target.value)}
                className="input-base text-xs py-1.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Good form, increased resistance, peak heart rate"
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
              {editingWorkoutId ? 'Update Workout' : 'Save Exercise'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Body Metric Modal */}
      <Modal
        isOpen={isMetricModalOpen}
        onClose={() => setIsMetricModalOpen(false)}
        title={editingMetricId ? 'Edit Body Measurements' : 'Log Body Measurements'}
        subtitle={
          editingMetricId
            ? 'Update weight, height, body fat %, and body circumferences'
            : 'Track weight, height, body fat %, and physical dimensions with live multi-metric progress charts'
        }
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleMetricSubmit} className="space-y-4">
          {/* Unit System Switcher inside Modal */}
          <div className="flex bg-subtle p-1 rounded-xl border border-theme">
            <button
              type="button"
              onClick={() => handleToggleModalUnit('metric')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                unitSystem === 'metric'
                  ? 'bg-surface text-primary card-shadow ring-1 ring-accent/20'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <span>⚖️</span> Metric (kg, cm)
            </button>
            <button
              type="button"
              onClick={() => handleToggleModalUnit('imperial')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                unitSystem === 'imperial'
                  ? 'bg-surface text-primary card-shadow ring-1 ring-accent/20'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <span>📏</span> Imperial (lbs, in)
            </button>
          </div>

          <DateInput
            label="Measurement Date"
            value={mDate}
            onChange={setMDate}
            required
          />

          {/* Section 1: Core Body Vitals */}
          <div className="space-y-3 p-3.5 bg-subtle/50 rounded-2xl border border-theme">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-accent" /> Core Body Vitals
              </span>
              <span className="text-[10px] text-accent font-bold">Primary & Essential</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Weight */}
              <div className="p-2.5 rounded-xl bg-surface border border-theme shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
                    Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                  </label>
                  <span className="text-[9px] text-accent font-bold">Primary</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 74.5"
                    value={mWeight}
                    onChange={(e) => setMWeight(e.target.value)}
                    className="w-full bg-subtle/60 border border-theme rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                  />
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setMWeight((prev) => (prev ? (Number(prev) + 0.5).toFixed(1) : '70.5'))}
                      className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-subtle hover:bg-surface border border-theme text-secondary hover:text-primary cursor-pointer"
                      title="Add 0.5"
                    >
                      +0.5
                    </button>
                    <button
                      type="button"
                      onClick={() => setMWeight((prev) => (prev && Number(prev) > 0.5 ? (Number(prev) - 0.5).toFixed(1) : '69.5'))}
                      className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-subtle hover:bg-surface border border-theme text-secondary hover:text-primary cursor-pointer"
                      title="Subtract 0.5"
                    >
                      -0.5
                    </button>
                  </div>
                </div>
              </div>

              {/* Height */}
              <div className="p-2.5 rounded-xl bg-surface border border-theme shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
                    Height ({unitSystem === 'metric' ? 'cm' : 'in'})
                  </label>
                  <span className="text-[9px] text-secondary font-semibold">Optional</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  placeholder={unitSystem === 'metric' ? 'e.g. 178' : 'e.g. 70'}
                  value={mHeight}
                  onChange={(e) => setMHeight(e.target.value)}
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Body Fat % */}
              <div className="p-2.5 rounded-xl bg-surface border border-theme shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
                    Body Fat %
                  </label>
                  <span className="text-[9px] text-secondary font-semibold">Optional</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="3"
                  max="60"
                  placeholder="e.g. 15.5"
                  value={mBodyFat}
                  onChange={(e) => setMBodyFat(e.target.value)}
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Upper Body Circumferences */}
          <div className="space-y-3 p-3.5 bg-subtle/50 rounded-2xl border border-theme">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-500" /> Upper Body Circumferences
              </span>
              <span className="text-[10px] text-secondary font-semibold">
                Unit: {unitSystem === 'metric' ? 'cm' : 'inches'} (Optional)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Chest */}
              <div className="p-2 rounded-xl bg-surface border border-theme shadow-xs">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Chest
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={unitSystem === 'metric' ? 'e.g. 98' : 'e.g. 38.5'}
                  value={mChest}
                  onChange={(e) => setMChest(e.target.value)}
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Waist */}
              <div className="p-2 rounded-xl bg-surface border border-theme shadow-xs">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Waist
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={unitSystem === 'metric' ? 'e.g. 82' : 'e.g. 32.3'}
                  value={mWaist}
                  onChange={(e) => setMWaist(e.target.value)}
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Arms / Biceps */}
              <div className="p-2 rounded-xl bg-surface border border-theme shadow-xs">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Arms / Biceps
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={unitSystem === 'metric' ? 'e.g. 36' : 'e.g. 14.2'}
                  value={mArm}
                  onChange={(e) => setMArm(e.target.value)}
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Shoulders */}
              <div className="p-2 rounded-xl bg-surface border border-theme shadow-xs">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Shoulders
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={unitSystem === 'metric' ? 'e.g. 115' : 'e.g. 45.2'}
                  value={mShoulders}
                  onChange={(e) => setMShoulders(e.target.value)}
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Neck */}
              <div className="p-2 rounded-xl bg-surface border border-theme shadow-xs sm:col-span-2">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Neck
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={unitSystem === 'metric' ? 'e.g. 38' : 'e.g. 15.0'}
                  value={mNeck}
                  onChange={(e) => setMNeck(e.target.value)}
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Lower Body Circumferences */}
          <div className="space-y-3 p-3.5 bg-subtle/50 rounded-2xl border border-theme">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-teal-500" /> Lower Body Circumferences
              </span>
              <span className="text-[10px] text-secondary font-semibold">
                Unit: {unitSystem === 'metric' ? 'cm' : 'inches'} (Optional)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Hips */}
              <div className="p-2 rounded-xl bg-surface border border-theme shadow-xs">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Hips
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={unitSystem === 'metric' ? 'e.g. 96' : 'e.g. 37.8'}
                  value={mHips}
                  onChange={(e) => setMHips(e.target.value)}
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Thighs */}
              <div className="p-2 rounded-xl bg-surface border border-theme shadow-xs">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Thighs
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={unitSystem === 'metric' ? 'e.g. 56' : 'e.g. 22.0'}
                  value={mThighs}
                  onChange={(e) => setMThighs(e.target.value)}
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Calves */}
              <div className="p-2 rounded-xl bg-surface border border-theme shadow-xs">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Calves
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={unitSystem === 'metric' ? 'e.g. 37' : 'e.g. 14.5'}
                  value={mCalves}
                  onChange={(e) => setMCalves(e.target.value)}
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Morning weigh-in after fasting, post-workout pump"
              value={mNotes}
              onChange={(e) => setMNotes(e.target.value)}
              className="input-base text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsMetricModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingMetric}>
              {editingMetricId ? 'Update Measurements' : 'Save Measurements'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal for Workout */}
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

      {/* Delete Confirmation Modal for Body Metric */}
      <Modal
        isOpen={!!deleteMetricId}
        onClose={() => setDeleteMetricId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this body measurement entry?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteMetricId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteMetric}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FitnessTracker;
