import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import api from '../utils/api';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import {
  Utensils,
  Plus,
  Minus,
  Trash2,
  Droplets,
  Flame,
  PieChart as PieChartIcon,
  Sparkles,
} from 'lucide-react';
import { FastingTimer } from '../components/FastingTimer';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const UNITS = ['piece', 'gram', 'teaspoon', 'tablespoon', 'cup', 'bowl', 'ml'];
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
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Form & Autocomplete State
  const [formMealType, setFormMealType] = useState('Breakfast');
  const [formDate, setFormDate] = useState(activeDate);

  // Meal Item inputs
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('piece');
  const [calPerUnit, setCalPerUnit] = useState(100);
  const [proteinPerUnit, setProteinPerUnit] = useState(5);
  const [carbsPerUnit, setCarbsPerUnit] = useState(10);
  const [fatPerUnit, setFatPerUnit] = useState(2);

  // Autocomplete Suggestions
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
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

  // Autocomplete Food Item Search
  useEffect(() => {
    if (!itemName.trim() || selectedFoodItem) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/food-items/search?q=${encodeURIComponent(itemName.trim())}`);
        setSuggestions(res.data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Failed food item search', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [itemName, selectedFoodItem]);

  const handleSelectFoodItem = (item) => {
    setSelectedFoodItem(item);
    setItemName(item.name);
    setUnit(item.unitType || 'piece');
    setQuantity(1);
    setCalPerUnit(item.caloriesPerUnit);
    setProteinPerUnit(item.proteinPerUnit || 0);
    setCarbsPerUnit(item.carbsPerUnit || 0);
    setFatPerUnit(item.fatPerUnit || 0);
    setShowSuggestions(false);
  };

  const openCreateModal = (mealType = 'Breakfast') => {
    setFormMealType(mealType);
    setFormDate(activeDate);
    setItemName('');
    setQuantity(1);
    setUnit('piece');
    setCalPerUnit(100);
    setProteinPerUnit(5);
    setCarbsPerUnit(10);
    setFatPerUnit(2);
    setSelectedFoodItem(null);
    setShowSuggestions(false);
    setIsModalOpen(true);
  };

  // Live computed total calories and macros for current item
  const liveItemCalories = Math.round(calPerUnit * quantity * 10) / 10;
  const liveItemProtein = Math.round(proteinPerUnit * quantity * 10) / 10;
  const liveItemCarbs = Math.round(carbsPerUnit * quantity * 10) / 10;
  const liveItemFat = Math.round(fatPerUnit * quantity * 10) / 10;

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    setSaving(true);
    const payload = {
      date: formDate,
      mealType: formMealType,
      items: [
        {
          name: itemName.trim(),
          quantity: Number(quantity),
          unit,
          caloriesPerUnit: Number(calPerUnit),
          proteinPerUnit: Number(proteinPerUnit),
          carbsPerUnit: Number(carbsPerUnit),
          fatPerUnit: Number(fatPerUnit),
          calories: liveItemCalories,
          protein: liveItemProtein,
          carbs: liveItemCarbs,
          fat: liveItemFat,
        },
      ],
    };

    try {
      const res = await api.post('/meals', payload);
      setIsModalOpen(false);
      if (res.data) {
        setMeals((prev) => [res.data, ...prev]);
        setSummary((prev) => ({
          ...prev,
          caloriesConsumed: (prev.caloriesConsumed || 0) + liveItemCalories,
          totalProtein: (prev.totalProtein || 0) + liveItemProtein,
          totalCarbs: (prev.totalCarbs || 0) + liveItemCarbs,
          totalFat: (prev.totalFat || 0) + liveItemFat,
          remainingCalories: Math.max(0, (prev.dailyCalorieGoal || 2000) - ((prev.caloriesConsumed || 0) + liveItemCalories)),
        }));
      }
      fetchData(false);
    } catch (err) {
      console.error('Failed to log meal', err);
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
        description={`Smart autocomplete meal logger with multi-unit support and automatic server-calculated macros for ${formatDisplayDate(activeDate)}`}
        action={
          <Button variant="gradient" size="md" icon={Plus} onClick={() => openCreateModal('Breakfast')}>
            Log Meal
          </Button>
        }
      />

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
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
      </div>

      {/* Calorie Goal Progress & Hydration Quick Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
        {/* Calorie Progress Card */}
        <Card hover title="Daily Calorie Budget" subtitle="Intake progress against goal" icon={Flame} className="lg:col-span-2">
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

      {/* 16:8 Fasting Timer */}
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
                  action={
                    <button
                      onClick={() => setDeleteId(meal._id)}
                      className="p-1.5 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Meal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                >
                  <div className="space-y-3">
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

      {/* Log Meal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Meal & Food Items"
        subtitle="Automatic calorie and macro computation with unit conversions"
      >
        <form onSubmit={handleAddMeal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Meal Type
              </label>
              <select
                value={formMealType}
                onChange={(e) => setFormMealType(e.target.value)}
                className="select-base"
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="input-base"
                required
              />
            </div>
          </div>

          {/* Autocomplete Food Search Input */}
          <div className="relative">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Food Item Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Oatmeal, Boiled Egg, Chicken Breast, Rice"
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
                setSelectedFoodItem(null);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="input-base"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-theme rounded-xl card-shadow z-30 max-h-40 overflow-y-auto">
                {suggestions.map((food) => (
                  <div
                    key={food._id}
                    onClick={() => handleSelectFoodItem(food)}
                    className="p-2.5 hover:bg-subtle cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-primary">{food.name}</span>
                    <span className="text-secondary text-[11px]">
                      {food.caloriesPerUnit} kcal / {food.unitType || 'piece'} ({food.proteinPerUnit}g P)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Measurement Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="select-base"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit Baseline Values */}
          <div className="p-3 bg-subtle rounded-2xl border border-theme space-y-2">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
              Nutritional Profile (per 1 {unit})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-secondary mb-1">
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  value={calPerUnit}
                  onChange={(e) => setCalPerUnit(Number(e.target.value))}
                  className="input-base text-xs py-1.5"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-secondary mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={proteinPerUnit}
                  onChange={(e) => setProteinPerUnit(Number(e.target.value))}
                  className="input-base text-xs py-1.5"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-secondary mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={carbsPerUnit}
                  onChange={(e) => setCarbsPerUnit(Number(e.target.value))}
                  className="input-base text-xs py-1.5"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-secondary mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={fatPerUnit}
                  onChange={(e) => setFatPerUnit(Number(e.target.value))}
                  className="input-base text-xs py-1.5"
                />
              </div>
            </div>
          </div>

          {/* Live Calculated Summary for Portion */}
          <div className="p-3 bg-accent/5 rounded-2xl border border-accent/20 flex items-center justify-between text-xs font-bold">
            <span className="text-secondary">Calculated for {quantity} {unit}:</span>
            <span className="text-accent font-extrabold">
              {liveItemCalories} kcal · {liveItemProtein}g P · {liveItemCarbs}g C · {liveItemFat}g F
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Save Meal
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
            Are you sure you want to delete this meal log? It will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteMeal}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CalorieTracker;
