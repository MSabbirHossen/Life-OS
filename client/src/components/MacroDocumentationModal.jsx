import React, { useState } from 'react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Button } from './Button';
import {
  BookOpen,
  ExternalLink,
  Flame,
  Sparkles,
  Scale,
  Zap,
  Heart,
  Dumbbell,
  ShieldCheck,
  TrendingUp,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { DOCUMENTATION_LINKS } from '../utils/calorieCalculator';

export const MacroDocumentationModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('macros');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Calorie & Macro Science Guide"
      subtitle="Evidence-based nutrition and clinical energy expenditure formulas simplified"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs pb-1">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-subtle rounded-2xl border border-theme">
          <button
            type="button"
            onClick={() => setActiveTab('macros')}
            className={`py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
              activeTab === 'macros'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>🥗</span>
            <span className="truncate">Macronutrients</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
              activeTab === 'calculator'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>⚡</span>
            <span className="truncate">How Budget Works</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
              activeTab === 'sources'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>📖</span>
            <span className="truncate">Official Sources</span>
          </button>
        </div>

        {/* Tab 1: Macronutrients & Energy Density */}
        {activeTab === 'macros' && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Quick Rule Header */}
            <div className="p-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent rounded-2xl border border-indigo-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-primary block text-xs">Standardized Atwater Energy Factors</span>
                  <p className="text-[11px] text-secondary">
                    Every calorie you consume comes from three core macronutrients with fixed caloric densities.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Macro Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Protein Card */}
              <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4 text-purple-500" />
                      <span className="font-bold text-primary text-sm">Protein</span>
                    </div>
                    <Badge variant="purple" size="xs">4 kcal / g</Badge>
                  </div>
                  <p className="text-[11px] text-secondary font-medium leading-relaxed">
                    Essential for muscle synthesis, immune tissue repair, and appetite control via satiety hormones.
                  </p>
                </div>
                <div className="pt-2 border-t border-purple-500/15 text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                  🍗 Chicken, fish, eggs, tofu, Greek yogurt
                </div>
              </div>

              {/* Carbs Card */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-primary text-sm">Carbs</span>
                    </div>
                    <Badge variant="emerald" size="xs">4 kcal / g</Badge>
                  </div>
                  <p className="text-[11px] text-secondary font-medium leading-relaxed">
                    Primary fast-acting fuel for brain metabolism, central nervous system, and workout performance.
                  </p>
                </div>
                <div className="pt-2 border-t border-emerald-500/15 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  🍚 Rice, oats, potatoes, fruits, whole grains
                </div>
              </div>

              {/* Fats Card */}
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-primary text-sm">Fats</span>
                    </div>
                    <Badge variant="amber" size="xs">9 kcal / g</Badge>
                  </div>
                  <p className="text-[11px] text-secondary font-medium leading-relaxed">
                    Critical for steroid hormone production (testosterone/estrogen) and fat-soluble vitamin uptake (A, D, E, K).
                  </p>
                </div>
                <div className="pt-2 border-t border-amber-500/15 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  🥑 Olive oil, avocado, almonds, seeds, salmon
                </div>
              </div>
            </div>

            {/* Total Calculation Formula Box */}
            <div className="p-3 rounded-xl bg-subtle border border-theme text-center">
              <span className="text-[11px] text-secondary font-medium block mb-1">
                Universal Calorie Math Equation:
              </span>
              <code className="text-xs font-mono font-bold text-primary bg-surface px-2.5 py-1 rounded-lg border border-theme inline-block">
                Total Calories = (Grams of Protein × 4) + (Grams of Carbs × 4) + (Grams of Fat × 9)
              </code>
            </div>
          </div>
        )}

        {/* Tab 2: How Budget & TDEE is Calculated */}
        {activeTab === 'calculator' && (
          <div className="space-y-3 animate-fade-in">
            {/* Step 1: BMR */}
            <div className="p-3.5 rounded-2xl bg-subtle border border-theme space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[11px] font-extrabold">1</span>
                  Basal Metabolic Rate (BMR)
                </span>
                <Badge variant="purple" size="xs">Mifflin-St Jeor Formula</Badge>
              </div>
              <p className="text-[11px] text-secondary">
                The minimum calories your body requires at total rest to sustain life (brain function, breathing, organ operation, and cellular turnover).
              </p>
              <div className="p-2.5 rounded-xl bg-surface border border-theme font-mono text-[11px] text-indigo-600 dark:text-indigo-400 space-y-0.5">
                <div>• Men: 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5</div>
                <div>• Women: 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161</div>
              </div>
            </div>

            {/* Step 2: TDEE */}
            <div className="p-3.5 rounded-2xl bg-subtle border border-theme space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[11px] font-extrabold">2</span>
                  Total Daily Energy Expenditure (TDEE)
                </span>
                <Badge variant="emerald" size="xs">TDEE = BMR × Activity Multiplier</Badge>
              </div>
              <p className="text-[11px] text-secondary">
                Total calories burned in a 24-hour window incorporating your daily physical movement, steps, workouts, and digestion.
              </p>
              <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center">
                <div className="p-1.5 rounded-lg bg-surface border border-theme">
                  <span className="font-bold text-primary block">Sedentary (×1.2)</span>
                  <span className="text-secondary">Desk job, little exercise</span>
                </div>
                <div className="p-1.5 rounded-lg bg-surface border border-theme">
                  <span className="font-bold text-primary block">Moderate (×1.55)</span>
                  <span className="text-secondary">3–5 training sessions/wk</span>
                </div>
                <div className="p-1.5 rounded-lg bg-surface border border-theme">
                  <span className="font-bold text-primary block">Athlete (×1.9)</span>
                  <span className="text-secondary">High-intensity 2x/day</span>
                </div>
              </div>
            </div>

            {/* Step 3: Goals */}
            <div className="p-3.5 rounded-2xl bg-subtle border border-theme space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[11px] font-extrabold">3</span>
                  Target Goal Adjustment
                </span>
                <Badge variant="amber" size="xs">Deficit / Surplus</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-surface border border-theme">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block">Fat Loss (-10% to -20%)</span>
                  <span className="text-secondary text-[10px]">~250–500 kcal deficit for steady, thyroid-safe weight loss.</span>
                </div>
                <div className="p-2 rounded-xl bg-surface border border-theme">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">Maintenance (±0%)</span>
                  <span className="text-secondary text-[10px]">Matches your exact TDEE for body weight stabilization.</span>
                </div>
                <div className="p-2 rounded-xl bg-surface border border-theme">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block">Muscle Gain (+10% to +20%)</span>
                  <span className="text-secondary text-[10px]">~250–500 kcal surplus to optimize lean muscle hypertrophy.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Official Scientific Sources */}
        {activeTab === 'sources' && (
          <div className="space-y-2.5 animate-fade-in">
            <p className="text-[11px] text-secondary">
              Life OS uses peer-reviewed clinical research and clinical public health guidelines:
            </p>

            <div className="space-y-2">
              {DOCUMENTATION_LINKS.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-3 rounded-2xl bg-subtle hover:bg-surface border border-theme transition-all duration-200 flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-primary text-xs group-hover:text-accent transition-colors">
                        {doc.title}
                      </span>
                      <Badge variant="neutral" size="xs">{doc.badge}</Badge>
                    </div>
                    <p className="text-[11px] text-secondary leading-snug">{doc.summary}</p>
                    <span className="text-[10px] text-muted block mt-0.5 font-medium">{doc.organization}</span>
                  </div>
                  <div className="w-7 h-7 rounded-xl bg-surface group-hover:bg-accent/10 border border-theme flex items-center justify-center text-secondary group-hover:text-accent shrink-0 transition-all">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-theme mt-2">
          <span className="text-[11px] text-muted">
            Clinical Guidelines: Mifflin-St Jeor & USDA AMDR
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Got It
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MacroDocumentationModal;

