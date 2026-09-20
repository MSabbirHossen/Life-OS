import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { DateInput } from '../components/DateInput';
import api from '../utils/api';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import {
  Utensils,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Droplets,
  Flame,
  PieChart as PieChartIcon,
  Sparkles,
  Search,
  Timer,
  Trophy,
  Calculator,
  BookOpen,
  AlertCircle,
  Info,
  CheckCircle2,
  ArrowRight,
  X,
  Zap,
  Dumbbell,
  Scale,
} from 'lucide-react';
import { FastingTimer } from '../components/FastingTimer';
import { getFastingStats, subscribeFastingUpdates } from '../utils/fastingService';
import {
  calculateMacroTargets,
  getSavedMacroSettings,
} from '../utils/calorieCalculator';
import { CalorieCalculatorModal } from '../components/CalorieCalculatorModal';
import { MacroDocumentationModal } from '../components/MacroDocumentationModal';
import { MacroBreakdownCard } from '../components/MacroBreakdownCard';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const MEAL_TYPE_CONFIG = {
  Breakfast: { label: 'Breakfast', icon: '🌅' },
  Lunch: { label: 'Lunch', icon: '☀️' },
  Dinner: { label: 'Dinner', icon: '🌙' },
  Snack: { label: 'Snack', icon: '🍎' },
};

const POPULAR_STAPLES = [
  {
    name: 'Chicken Breast',
    category: 'Protein',
    unitType: 'gram',
    unit: 'gram',
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
    source: 'USDA Verified',
    icon: '🍗',
  },
  {
    name: 'Boiled Egg',
    category: 'Protein',
    unitType: 'piece',
    unit: 'piece',
    caloriesPerPiece: 72,
    proteinPerPiece: 6.3,
    carbsPerPiece: 0.4,
    fatPerPiece: 4.8,
    source: 'USDA Verified',
    icon: '🥚',
  },
  {
    name: 'Brown Rice',
    category: 'Grains',
    unitType: 'gram',
    unit: 'gram',
    caloriesPer100g: 112,
    proteinPer100g: 2.6,
    carbsPer100g: 24,
    fatPer100g: 0.9,
    source: 'USDA Verified',
    icon: '🍚',
  },
  {
    name: 'Banana',
    category: 'Fruits',
    unitType: 'piece',
    unit: 'piece',
    caloriesPerPiece: 105,
    proteinPerPiece: 1.3,
    carbsPerPiece: 27,
    fatPerPiece: 0.3,
    source: 'USDA Verified',
    icon: '🍌',
  },
  {
    name: 'Oatmeal',
    category: 'Grains',
    unitType: 'gram',
    unit: 'gram',
    caloriesPer100g: 389,
    proteinPer100g: 16.9,
    carbsPer100g: 66.3,
    fatPer100g: 6.9,
    source: 'USDA Verified',
    icon: '🥣',
  },
  {
    name: 'Avocado',
    category: 'Healthy Fats',
    unitType: 'piece',
    unit: 'piece',
    caloriesPerPiece: 240,
    proteinPerPiece: 3,
    carbsPerPiece: 12,
    fatPerPiece: 22,
    source: 'USDA Verified',
    icon: '🥑',
  },
];

const UNITS = ['piece', 'gram', 'ml', 'cup', 'bowl', 'tablespoon', 'teaspoon'];
const MACRO_COLORS = ['#6366F1', '#10B981', '#F59E0B']; // Protein (Indigo), Carbs (Emerald), Fat (Amber)

export const CalorieTracker = ({ selectedDate }) => {
  const activeDate = selectedDate || getFormattedDate();

  const [meals, setMeals] = useState([]);
  const [summary, setSummary] = useState({
    caloriesConsumed: 0,
    dailyCalorieGoal: 2000,
    remainingCalories: 2000,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    waterGlasses: 0,
    waterMl: 0,
  });
  const [fastingStats, setFastingStats] = useState(() => getFastingStats());
  const [macroSettings, setMacroSettings] = useState(() => getSavedMacroSettings());
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form & Autocomplete State
  const [formMealType, setFormMealType] = useState('Breakfast');
  const [formDate, setFormDate] = useState(activeDate);

  // Meal Item inputs
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('piece');
  const [calPerUnit, setCalPerUnit] = useState(100);
  const [proteinPerUnit, setProteinPerUnit] = useState(5);
  const [carbsPerUnit, setCarbsPerUnit] = useState(10);
  const [fatPerUnit, setFatPerUnit] = useState(2);

  // Autocomplete Suggestions
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [mealsRes, summaryRes] = await Promise.all([
        api.get(`/meals?date=${activeDate}`),
        api.get(`/summary?date=${activeDate}`),
      ]);
      setMeals(mealsRes.data || []);
      setSummary(summaryRes.data || {});
    } catch (err) {
      console.error('Failed to fetch calorie tracker data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeDate]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Subscribe to live Intermittent Fasting (IF) count and streak updates
  useEffect(() => {
    const unsub = subscribeFastingUpdates((newStats) => {
      setFastingStats(newStats);
    });
    return unsub;
  }, []);

  // Subscribe to live macro settings updates
  useEffect(() => {
    const handleMacroUpdate = (e) => {
      if (e.detail) setMacroSettings(e.detail);
    };
    window.addEventListener('lifeos_macro_updated', handleMacroUpdate);
    return () => window.removeEventListener('lifeos_macro_updated', handleMacroUpdate);
  }, []);

  // Compute live target macros based on daily calorie goal & selected split
  const currentMacroTargets = useMemo(() => {
    return calculateMacroTargets(
      summary.dailyCalorieGoal || 2000,
      macroSettings.presetId || 'balanced',
      macroSettings.customSplits
    );
  }, [summary.dailyCalorieGoal, macroSettings]);

  // Autocomplete Food Item Search
  useEffect(() => {
    if (!itemName.trim() || itemName.length < 2 || selectedFoodItem) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/food-items/search?q=${encodeURIComponent(itemName.trim())}`);
        setSuggestions(res.data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Failed food item search', err);
      } finally {
        setSearchingSuggestions(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [itemName, selectedFoodItem]);

  const handleSelectFoodItem = (item) => {
    setSelectedFoodItem(item);
    setItemName(item.name);
    const itemUnit = item.unit || item.unitType || 'piece';
    setUnit(itemUnit);

    // Provide empty quantity so placeholder (e.g. 100 or e.g. 1) guides user
    setQuantity('');

    const isGramOrMl = itemUnit === 'gram' || itemUnit === 'g' || itemUnit === 'ml';
    const cal = item.caloriesPerUnit !== undefined
      ? Number(item.caloriesPerUnit)
      : isGramOrMl
      ? Number(item.caloriesPer100g ?? 100)
      : Number(item.caloriesPerPiece ?? 100);

    const p = item.proteinPerUnit !== undefined
      ? Number(item.proteinPerUnit)
      : isGramOrMl
      ? Number(item.proteinPer100g ?? 0)
      : Number(item.proteinPerPiece ?? 0);

    const c = item.carbsPerUnit !== undefined
      ? Number(item.carbsPerUnit)
      : isGramOrMl
      ? Number(item.carbsPer100g ?? 0)
      : Number(item.carbsPerPiece ?? 0);

    const f = item.fatPerUnit !== undefined
      ? Number(item.fatPerUnit)
      : isGramOrMl
      ? Number(item.fatPer100g ?? 0)
      : Number(item.fatPerPiece ?? 0);

    setCalPerUnit(cal);
    setProteinPerUnit(p);
    setCarbsPerUnit(c);
    setFatPerUnit(f);
    setShowSuggestions(false);
  };

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    const isNewGramOrMl = newUnit === 'gram' || newUnit === 'g' || newUnit === 'ml';

    if (selectedFoodItem) {
      if (isNewGramOrMl && selectedFoodItem.caloriesPer100g !== undefined) {
        setCalPerUnit(Number(selectedFoodItem.caloriesPer100g) || 100);
        setProteinPerUnit(Number(selectedFoodItem.proteinPer100g) || 0);
        setCarbsPerUnit(Number(selectedFoodItem.carbsPer100g) || 0);
        setFatPerUnit(Number(selectedFoodItem.fatPer100g) || 0);
      } else if (!isNewGramOrMl && selectedFoodItem.caloriesPerPiece !== undefined) {
        setCalPerUnit(Number(selectedFoodItem.caloriesPerPiece) || 100);
        setProteinPerUnit(Number(selectedFoodItem.proteinPerPiece) || 0);
        setCarbsPerUnit(Number(selectedFoodItem.carbsPerPiece) || 0);
        setFatPerUnit(Number(selectedFoodItem.fatPerPiece) || 0);
      }
    }
  };

  const openCreateModal = (mealType = 'Breakfast') => {
    setEditingMealId(null);
    setFormMealType(mealType);
    setFormDate(activeDate);
    setItemName('');
    setQuantity('');
    setUnit('gram');
    setCalPerUnit('');
    setProteinPerUnit('');
    setCarbsPerUnit('');
    setFatPerUnit('');
    setSelectedFoodItem(null);
    setShowSuggestions(false);
    setIsModalOpen(true);
  };

  const handleEditMeal = (meal) => {
    setEditingMealId(meal._id);
    setFormMealType(meal.mealType || 'Breakfast');
    setFormDate(meal.date || activeDate);
    if (meal.items && meal.items.length > 0) {
      const first = meal.items[0];
      setItemName(first.name || '');
      setQuantity(first.quantity ?? '');
      const u = first.unit || 'gram';
      setUnit(u);
      const isPer100 = u === 'gram' || u === 'g' || u === 'ml';
      const factor = isPer100 ? (first.quantity || 100) / 100 : (first.quantity || 1);
      setCalPerUnit(first.calories ? Math.round(first.calories / factor) : 100);
      setProteinPerUnit(first.protein ? Math.round((first.protein / factor) * 10) / 10 : 0);
      setCarbsPerUnit(first.carbs ? Math.round((first.carbs / factor) * 10) / 10 : 0);
      setFatPerUnit(first.fat ? Math.round((first.fat / factor) * 10) / 10 : 0);
    } else {
      setItemName('');
      setQuantity('');
      setUnit('gram');
      setCalPerUnit('');
      setProteinPerUnit('');
      setCarbsPerUnit('');
      setFatPerUnit('');
    }
    setSelectedFoodItem(null);
    setShowSuggestions(false);
    setIsModalOpen(true);
  };

  // Check if current unit is scaled per 100 units (grams or ml)
  const isPerHundred = unit === 'gram' || unit === 'g' || unit === 'ml';

  // Computed Atwater calories from macros
  const atwaterCalculatedCalories = useMemo(() => {
    const p = Number(proteinPerUnit) || 0;
    const c = Number(carbsPerUnit) || 0;
    const f = Number(fatPerUnit) || 0;
    if (p === 0 && c === 0 && f === 0) return 0;
    return Math.round(p * 4 + c * 4 + f * 9);
  }, [proteinPerUnit, carbsPerUnit, fatPerUnit]);

  // Effective calories per unit (custom or Atwater fallback)
  const effectiveCalPerUnit = useMemo(() => {
    if (calPerUnit !== '' && Number(calPerUnit) >= 0) {
      return Number(calPerUnit);
    }
    return atwaterCalculatedCalories || 0;
  }, [calPerUnit, atwaterCalculatedCalories]);

  // Live computed total calories and macros for current item
  const liveItemCalories = useMemo(() => {
    const q = quantity === '' ? (isPerHundred ? 100 : 1) : Number(quantity) || 0;
    const factor = isPerHundred ? q / 100 : q;
    return Math.round(effectiveCalPerUnit * factor * 10) / 10;
  }, [effectiveCalPerUnit, quantity, isPerHundred]);

  const liveItemProtein = useMemo(() => {
    const q = quantity === '' ? (isPerHundred ? 100 : 1) : Number(quantity) || 0;
    const factor = isPerHundred ? q / 100 : q;
    return Math.round((Number(proteinPerUnit) || 0) * factor * 10) / 10;
  }, [proteinPerUnit, quantity, isPerHundred]);

  const liveItemCarbs = useMemo(() => {
    const q = quantity === '' ? (isPerHundred ? 100 : 1) : Number(quantity) || 0;
    const factor = isPerHundred ? q / 100 : q;
    return Math.round((Number(carbsPerUnit) || 0) * factor * 10) / 10;
  }, [carbsPerUnit, quantity, isPerHundred]);

  const liveItemFat = useMemo(() => {
    const q = quantity === '' ? (isPerHundred ? 100 : 1) : Number(quantity) || 0;
    const factor = isPerHundred ? q / 100 : q;
    return Math.round((Number(fatPerUnit) || 0) * factor * 10) / 10;
  }, [fatPerUnit, quantity, isPerHundred]);

  // Live calculated macro percentage split for the portion
  const portionMacroSplit = useMemo(() => {
    const pCal = liveItemProtein * 4;
    const cCal = liveItemCarbs * 4;
    const fCal = liveItemFat * 9;
    const totalCal = pCal + cCal + fCal;
    if (totalCal <= 0) return { proteinPct: 0, carbsPct: 0, fatPct: 0, totalCal: 0 };
    const pPct = Math.round((pCal / totalCal) * 100);
    const cPct = Math.round((cCal / totalCal) * 100);
    const fPct = Math.max(0, 100 - pPct - cPct);
    return { proteinPct: pPct, carbsPct: cPct, fatPct: fPct, totalCal };
  }, [liveItemProtein, liveItemCarbs, liveItemFat]);

  const quickPortions = useMemo(() => {
    return isPerHundred ? [50, 100, 150, 200, 250, 300] : [0.5, 1, 1.5, 2, 3, 4];
  }, [isPerHundred]);

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    setSaving(true);
    const finalQuantity = quantity === '' ? (isPerHundred ? 100 : 1) : Number(quantity) || 1;
    const payload = {
      date: formDate,
      mealType: formMealType,
      items: [
        {
          name: itemName.trim(),
          quantity: finalQuantity,
          unit,
          caloriesPerUnit: Number(calPerUnit) || 0,
          proteinPerUnit: Number(proteinPerUnit) || 0,
          carbsPerUnit: Number(carbsPerUnit) || 0,
          fatPerUnit: Number(fatPerUnit) || 0,
          calories: liveItemCalories,
          protein: liveItemProtein,
          carbs: liveItemCarbs,
          fat: liveItemFat,
        },
      ],
    };

    try {
      if (editingMealId) {
        const res = await api.put(`/meals/${editingMealId}`, payload);
        setIsModalOpen(false);
        setEditingMealId(null);
        if (res.data) {
          setMeals((prev) =>
            prev.map((m) => (m._id === editingMealId ? res.data : m))
          );
        }
      } else {
        const res = await api.post('/meals', payload);
        setIsModalOpen(false);
        if (res.data) {
          setMeals((prev) => [res.data, ...prev]);
        }
      }
      fetchData(false);
    } catch (err) {
      console.error('Failed to save meal', err);
    } finally {
      setSaving(false);
    }
  };

  // Instant 0ms Optimistic Water Action
  const handleWaterAction = async (delta) => {
    const newGlasses = Math.max(0, (summary.waterGlasses || 0) + delta);
    const newMl = newGlasses * 250;

    // Optimistically update counter immediately
    setSummary((prev) => ({
      ...prev,
      waterGlasses: newGlasses,
      waterMl: newMl,
    }));

    try {
      await api.post('/water', { date: activeDate, increment: delta });
      fetchData(false);
    } catch (err) {
      console.error('Failed to update water', err);
      fetchData(false);
    }
  };

  const handleDeleteMeal = async () => {
    if (!deleteId) return;
    const targetId = deleteId;
    setDeleteId(null);
    setMeals((prev) => prev.filter((m) => m._id !== targetId));

    try {
      await api.delete(`/meals/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete meal', err);
      fetchData(false);
    }
  };

  const caloriePercentage = Math.min(
    100,
    Math.round(((summary.caloriesConsumed || 0) / (summary.dailyCalorieGoal || 2000)) * 100)
  );

  const macroData = [
    { name: 'Protein', value: summary.totalProtein || 0 },
    { name: 'Carbs', value: summary.totalCarbs || 0 },
    { name: 'Fat', value: summary.totalFat || 0 },
  ].filter((m) => m.value > 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Nutrition & Macros"
        title="Calorie & Meal Tracker"
        description={`Smart autocomplete meal logger with verified online nutritional profiles and accurate gram/piece conversions for ${formatDisplayDate(activeDate)}`}
        action={
          <Button variant="gradient" size="md" icon={Plus} onClick={() => openCreateModal('Breakfast')}>
            Log Meal
          </Button>
        }
      />

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
        <StatCard
          title="Calories Consumed"
          value={`${summary.caloriesConsumed || 0} kcal`}
          subtitle={`Goal: ${summary.dailyCalorieGoal || 2000} kcal`}
          icon={Flame}
          color="amber"
        />
        <StatCard
          title="Remaining Budget"
          value={`${summary.remainingCalories || 0} kcal`}
          subtitle="Energy balance"
          icon={Utensils}
          color="indigo"
        />
        <StatCard
          title="Total Protein"
          value={`${summary.totalProtein || 0}g`}
          subtitle="Muscle recovery"
          icon={Sparkles}
          color="purple"
        />
        <StatCard
          title="Water Hydration"
          value={`${summary.waterGlasses || 0} Glasses`}
          subtitle={`${summary.waterMl || 0} ml consumed`}
          icon={Droplets}
          color="cyan"
        />
        <StatCard
          title="IF Completed Fasts"
          value={`${fastingStats.completedCount} Done`}
          subtitle={`${fastingStats.streak}d streak · ${fastingStats.partialCount} partial · ${fastingStats.earlyEndedCount} <20%`}
          icon={Trophy}
          color="emerald"
        />
      </div>

      {/* Calorie Goal Progress & Hydration Quick Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
        {/* Calorie Progress Card */}
        <Card
          hover
          title="Daily Calorie Budget"
          subtitle="Intake progress against goal"
          icon={Flame}
          className="lg:col-span-2"
          badge={
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="ghost"
                size="xs"
                icon={BookOpen}
                onClick={() => setShowDocsModal(true)}
                className="text-secondary hover:text-primary text-[11px] cursor-pointer"
                title="Read Calorie & Macro Science Documentation"
              >
                Science Docs
              </Button>
              <Button
                variant="outline"
                size="xs"
                icon={Calculator}
                onClick={() => setShowCalculatorModal(true)}
                className="font-bold text-[11px] cursor-pointer"
                title="Calculate Personal Body Calorie Budget (Mifflin-St Jeor)"
              >
                Calculate Body Budget
              </Button>
            </div>
          }
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-secondary">Progress: {caloriePercentage}%</span>
              <span className="text-primary">{summary.caloriesConsumed || 0} / {summary.dailyCalorieGoal || 2000} kcal</span>
            </div>
            <div className="w-full h-3.5 bg-subtle rounded-full overflow-hidden border border-theme p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (summary.caloriesConsumed || 0) > (summary.dailyCalorieGoal || 2000)
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                }`}
                style={{ width: `${caloriePercentage}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Water Hydration Interactive Tracker */}
        <Card hover title="Hydration Counter" subtitle="Track every glass of water" icon={Droplets}>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-extrabold text-primary tracking-tight">
                  {summary.waterGlasses || 0} <span className="text-xs font-medium text-secondary">Glasses</span>
                </div>
                <span className="text-xs text-secondary font-medium">{summary.waterMl || 0} ml logged</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleWaterAction(-1)}
                  disabled={!summary.waterGlasses || summary.waterGlasses <= 0}
                  className="p-2 rounded-xl bg-subtle text-secondary hover:text-primary hover:bg-surface border border-theme transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove 1 Glass"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => handleWaterAction(1)}>
                  +1 Glass
                </Button>
              </div>
            </div>

            {/* Visual Glass Dots */}
            <div className="flex gap-1.5 flex-wrap pt-1">
              {Array.from({ length: Math.max(8, summary.waterGlasses || 0) }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-3.5 h-6 rounded-md border transition-all duration-200 ${
                    idx < (summary.waterGlasses || 0)
                      ? 'bg-cyan-500 border-cyan-400 shadow-sm shadow-cyan-500/25 scale-105'
                      : 'bg-subtle border-theme opacity-40'
                  }`}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Macronutrient Budget & Intake Breakdown (Taken vs Yet to Take) */}
      <MacroBreakdownCard
        summary={summary}
        macroTargets={currentMacroTargets}
        onOpenCalculator={() => setShowCalculatorModal(true)}
        onOpenDocs={() => setShowDocsModal(true)}
      />

      {/* Dynamic Intermittent Fasting Timer */}
      <FastingTimer />

      {/* Macronutrient Chart & Meal Log Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
        {/* Macro Distribution Donut */}
        <Card hover title="Macronutrient Split" subtitle="Protein, Carbs, and Fat breakdown" icon={PieChartIcon}>
          {macroData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-xs text-secondary italic bg-subtle/50 rounded-xl border border-dashed border-theme mt-2">
              <PieChartIcon className="w-7 h-7 text-muted mb-1 stroke-1" />
              No macronutrients recorded today.
            </div>
          ) : (
            <div className="h-52 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MACRO_COLORS[index % MACRO_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val}g`, 'Amount']}
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Meals List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary tracking-tight">Today's Meals</h2>
            <span className="text-xs font-semibold text-secondary">{meals.length} meals logged</span>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : meals.length === 0 ? (
            <EmptyState
              icon={Utensils}
              title="No meals logged today"
              description="Log your breakfast, lunch, dinner or snack with accurate unit calculations."
              actionText="Log Meal"
              onAction={() => openCreateModal('Breakfast')}
            />
          ) : (
            <div className="space-y-3.5">
              {meals.map((meal) => (
                <Card
                  key={meal._id}
                  hover
                  bottomAction={
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditMeal(meal)}
                        className="p-1.5 rounded-lg bg-surface/90 dark:bg-surface/90 backdrop-blur-xs border border-theme/60 text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/10 shadow-xs transition-all cursor-pointer"
                        title="Edit Meal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(meal._id)}
                        className="p-1.5 rounded-lg bg-surface/90 dark:bg-surface/90 backdrop-blur-xs border border-theme/60 text-secondary hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 shadow-xs transition-all cursor-pointer"
                        title="Delete Meal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  }
              >
                <div className="space-y-3 pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="primary" size="sm" dot>
                        {meal.mealType}
                      </Badge>
                      <span className="text-sm font-extrabold text-primary">
                        {meal.totalCalories} kcal
                      </span>
                    </div>

                    {/* Meal Items List */}
                    <div className="space-y-1.5 pt-1">
                      {meal.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-subtle border border-theme"
                        >
                          <span className="font-bold text-primary">
                            {item.quantity} {item.unit} {item.name}
                          </span>
                          <span className="text-secondary font-semibold">
                            {item.calories} kcal · {item.protein}g P · {item.carbs}g C · {item.fat}g F
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log / Edit Meal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMealId ? 'Edit Meal Log' : 'Log Food / Meal'}
        subtitle={editingMealId ? 'Update food items, portion size, and nutritional profile' : 'Smart autocomplete with accurate piece/gram conversions and macro balancing'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleAddMeal} className="space-y-4">
          {/* Meal Type Selection Pills & Date */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Meal Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MEAL_TYPES.map((t) => {
                  const conf = MEAL_TYPE_CONFIG[t] || { icon: '🍽️', label: t };
                  const isSelected = formMealType === t;
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setFormMealType(t)}
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
              label="Meal Date"
              value={formDate}
              onChange={setFormDate}
              required
            />
          </div>

          {/* Autocomplete Food Search Input & Quick Staples */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
                Food Item Search
              </label>
              {selectedFoodItem && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Auto-filled from {selectedFoodItem.source || 'Database'}
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
                placeholder="Search food e.g. Oatmeal, Boiled Egg, Chicken Breast, Banana..."
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value);
                  setSelectedFoodItem(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                className="input-base pl-10 pr-10"
              />
              {itemName && (
                <button
                  type="button"
                  onClick={() => {
                    setItemName('');
                    setSelectedFoodItem(null);
                    setShowSuggestions(false);
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
              {POPULAR_STAPLES.map((staple) => {
                const isCurrent = selectedFoodItem?.name === staple.name;
                return (
                  <button
                    type="button"
                    key={staple.name}
                    onClick={() => handleSelectFoodItem(staple)}
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

            {/* Custom Food Guidance Banner */}
            {!selectedFoodItem && itemName.trim().length >= 2 && suggestions.length === 0 && !searchingSuggestions && (
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2 text-[11px] text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">New Custom Food</span>
                  <span className="text-secondary text-[10px]">
                    Set the calorie and macro breakdown below. Life OS will automatically calculate your portion and save this food to your personal library for future logs!
                  </span>
                </div>
              </div>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-surface border border-theme rounded-2xl card-shadow z-30 max-h-60 overflow-y-auto divide-y divide-theme/40 shadow-xl">
                {suggestions.map((food, idx) => (
                  <div
                    key={food._id || idx}
                    onClick={() => handleSelectFoodItem(food)}
                    className="p-3 hover:bg-subtle cursor-pointer flex items-center justify-between text-xs transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-primary group-hover:text-accent transition-colors">{food.name}</span>
                        {food.category && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-subtle text-secondary border border-theme">
                            {food.category}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-secondary font-medium">
                        {food.caloriesPerUnit} kcal per {food.unitType === 'gram' ? '100g' : food.unitType === 'ml' ? '100ml' : food.unitType || 'piece'} · <strong className="text-purple-600 dark:text-purple-400">{food.proteinPerUnit}g P</strong> · <strong className="text-emerald-600 dark:text-emerald-400">{food.carbsPerUnit}g C</strong> · <strong className="text-amber-600 dark:text-amber-400">{food.fatPerUnit}g F</strong>
                      </span>
                    </div>
                    {food.source && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-surface border border-theme text-secondary shrink-0 font-medium">
                        {food.source}
                      </span>
                    )}
                  </div>
                ))}

                {/* Direct Custom Selection Option */}
                {itemName.trim().length >= 2 && (
                  <div
                    onClick={() => {
                      setSelectedFoodItem({ name: itemName.trim(), isCustom: true });
                      setShowSuggestions(false);
                    }}
                    className="p-2.5 bg-accent/5 hover:bg-accent/10 cursor-pointer flex items-center justify-between text-xs text-accent font-bold transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Set custom nutrition profile for "{itemName}"
                    </span>
                    <Badge variant="primary" size="xs">Custom Item</Badge>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Portion Size & Unit Selection */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Quantity {isPerHundred ? `(in ${unit}s)` : `(${unit}s)`}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={isPerHundred ? 'e.g. 100' : 'e.g. 1'}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Measurement Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="select-base capitalize"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Portion Stepper Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
              <span className="text-[10px] font-bold text-secondary uppercase shrink-0 mr-1 flex items-center gap-1">
                <Scale className="w-3 h-3 text-secondary" /> Quick Portion:
              </span>
              {quickPortions.map((qVal) => {
                const isCurrent = String(quantity) === String(qVal);
                return (
                  <button
                    type="button"
                    key={qVal}
                    onClick={() => setQuantity(qVal)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-accent border-accent text-white shadow-sm'
                        : 'bg-subtle hover:bg-surface border-theme text-secondary hover:text-primary'
                    }`}
                  >
                    {qVal}{isPerHundred ? (unit === 'ml' ? 'ml' : 'g') : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit Baseline Values (Themed Macro Cards) */}
          <div className="p-4 bg-subtle/50 rounded-2xl border border-theme space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-accent" />
                <span className="text-[11px] font-extrabold text-secondary uppercase tracking-wider">
                  Nutritional Baseline {isPerHundred ? `(per 100 ${unit})` : `(per 1 ${unit})`}
                </span>
              </div>
              {atwaterCalculatedCalories > 0 && Number(calPerUnit) !== atwaterCalculatedCalories && (
                <button
                  type="button"
                  onClick={() => setCalPerUnit(atwaterCalculatedCalories)}
                  className="text-[11px] text-accent hover:underline font-bold flex items-center gap-1 cursor-pointer bg-accent/10 px-2 py-0.5 rounded-lg border border-accent/20"
                  title="Auto-calculate calories from protein, carbs, and fat (Atwater 4-4-9)"
                >
                  <Sparkles className="w-3 h-3 text-accent" />
                  Auto-calc Calories ({atwaterCalculatedCalories} kcal)
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Calories */}
              <div className="p-2.5 rounded-xl bg-surface border border-amber-500/20 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Calories
                  </span>
                  <span className="text-[9px] text-secondary font-semibold">kcal</span>
                </div>
                <input
                  type="number"
                  value={calPerUnit}
                  onChange={(e) => setCalPerUnit(e.target.value)}
                  placeholder={atwaterCalculatedCalories ? `${atwaterCalculatedCalories}` : '100'}
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Protein */}
              <div className="p-2.5 rounded-xl bg-surface border border-indigo-500/20 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Dumbbell className="w-3 h-3" /> Protein
                  </span>
                  <span className="text-[9px] text-secondary font-semibold">grams</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={proteinPerUnit}
                  onChange={(e) => setProteinPerUnit(e.target.value)}
                  placeholder="5"
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Carbs */}
              <div className="p-2.5 rounded-xl bg-surface border border-emerald-500/20 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Carbs
                  </span>
                  <span className="text-[9px] text-secondary font-semibold">grams</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={carbsPerUnit}
                  onChange={(e) => setCarbsPerUnit(e.target.value)}
                  placeholder="10"
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Fat */}
              <div className="p-2.5 rounded-xl bg-surface border border-amber-500/20 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> Fat
                  </span>
                  <span className="text-[9px] text-secondary font-semibold">grams</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={fatPerUnit}
                  onChange={(e) => setFatPerUnit(e.target.value)}
                  placeholder="2"
                  className="w-full bg-subtle/60 border border-theme rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Incomplete Macro Guidance Notice */}
            {calPerUnit !== '' && Number(calPerUnit) > 0 && Number(proteinPerUnit || 0) === 0 && Number(carbsPerUnit || 0) === 0 && Number(fatPerUnit || 0) === 0 && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[10px] text-amber-700 dark:text-amber-300">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Macro Data Incomplete:</strong> Protein, carbs, and fat are 0g. We encourage you to enter the macro values above so your daily macro target charts reflect accurate nutrition data.
                </span>
              </div>
            )}
          </div>

          {/* Live Calculated Portion HUD with Macro Distribution Ratio Bar */}
          <div className="p-4 bg-gradient-to-br from-surface to-subtle rounded-2xl border border-theme shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                  Calculated Portion
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-accent/10 text-accent font-extrabold border border-accent/20">
                  {quantity || (isPerHundred ? 100 : 1)} {unit}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-primary tracking-tight">
                  {liveItemCalories}
                </span>
                <span className="text-xs font-bold text-secondary">kcal</span>
              </div>
            </div>

            {/* Macro Badges Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Protein</span>
                <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">{liveItemProtein}g</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Carbs</span>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">{liveItemCarbs}g</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">Fat</span>
                <span className="text-sm font-black text-amber-700 dark:text-amber-300">{liveItemFat}g</span>
              </div>
            </div>

            {/* Macro Distribution Ratio Progress Bar */}
            {portionMacroSplit.totalCal > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="h-2 w-full bg-subtle rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${portionMacroSplit.proteinPct}%` }}
                    className="h-full bg-indigo-500 transition-all duration-300"
                    title={`Protein: ${portionMacroSplit.proteinPct}%`}
                  />
                  <div
                    style={{ width: `${portionMacroSplit.carbsPct}%` }}
                    className="h-full bg-emerald-500 transition-all duration-300"
                    title={`Carbs: ${portionMacroSplit.carbsPct}%`}
                  />
                  <div
                    style={{ width: `${portionMacroSplit.fatPct}%` }}
                    className="h-full bg-amber-500 transition-all duration-300"
                    title={`Fat: ${portionMacroSplit.fatPct}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-secondary px-0.5">
                  <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    {portionMacroSplit.proteinPct}% Protein
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {portionMacroSplit.carbsPct}% Carbs
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {portionMacroSplit.fatPct}% Fat
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editingMealId ? 'Update Meal' : 'Save Meal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Meal Log"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-secondary">
            Are you sure you want to remove this logged meal? Your consumed calories and macros will be recalculated automatically.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteMeal}>
              Delete Meal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Body Calorie Budget & Macro Calculator Modal */}
      <CalorieCalculatorModal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
        onApplied={(result) => {
          setSummary((prev) => ({
            ...prev,
            dailyCalorieGoal: result.budgetKcal,
            remainingCalories: Math.max(0, result.budgetKcal - (prev.caloriesConsumed || 0)),
          }));
        }}
        onOpenDocs={() => {
          setShowCalculatorModal(false);
          setShowDocsModal(true);
        }}
      />

      {/* Macronutrient & Calorie Science Documentation Modal */}
      <MacroDocumentationModal
        isOpen={showDocsModal}
        onClose={() => setShowDocsModal(false)}
      />
    </div>
  );
};

export default CalorieTracker;
