import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { Clock, Play, Square, RotateCcw, Sparkles, Utensils, Moon } from 'lucide-react';

export const FastingTimer = ({ compact = false }) => {
  const DEFAULT_TARGET_HOURS = 16;
  const [targetHours, setTargetHours] = useState(DEFAULT_TARGET_HOURS);
  const [fastingState, setFastingState] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_fasting_state');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      isActive: false,
      startTime: null,
      targetHours: DEFAULT_TARGET_HOURS,
    };
  });

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('lifeos_fasting_state', JSON.stringify(fastingState));
  }, [fastingState]);

  // Live timer tick
  useEffect(() => {
    let interval = null;
    if (fastingState.isActive && fastingState.startTime) {
      const updateElapsed = () => {
        const start = new Date(fastingState.startTime).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - start) / 1000));
        setElapsedSeconds(diff);
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [fastingState]);

  const handleStart = () => {
    setFastingState({
      isActive: true,
      startTime: new Date().toISOString(),
      targetHours,
    });
  };

  const handleStop = () => {
    setFastingState((prev) => ({
      ...prev,
      isActive: false,
      startTime: null,
    }));
    setElapsedSeconds(0);
  };

  const handleReset = () => {
    if (fastingState.isActive) {
      setFastingState((prev) => ({
        ...prev,
        startTime: new Date().toISOString(),
      }));
    }
    setElapsedSeconds(0);
  };

  const totalTargetSeconds = (fastingState.targetHours || targetHours) * 3600;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / totalTargetSeconds) * 100));

  const hoursElapsed = Math.floor(elapsedSeconds / 3600);
  const minutesElapsed = Math.floor((elapsedSeconds % 3600) / 60);
  const secondsElapsed = elapsedSeconds % 60;

  const remainingSeconds = Math.max(0, totalTargetSeconds - elapsedSeconds);
  const hoursRemaining = Math.floor(remainingSeconds / 3600);
  const minutesRemaining = Math.floor((remainingSeconds % 3600) / 60);

  // SVG Circular Ring dimensions
  const size = compact ? 120 : 160;
  const strokeWidth = compact ? 8 : 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  if (compact) {
    return (
      <div className="p-4 rounded-2xl bg-subtle border border-theme flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-subtle text-opacity-20 stroke-current"
                fill="transparent"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={fastingState.isActive ? 'var(--color-purple)' : 'var(--color-text-muted)'}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xs font-black text-primary">
                {fastingState.isActive ? `${progressPercent}%` : 'Off'}
              </span>
              <span className="text-[9px] font-bold text-secondary">
                {fastingState.isActive ? `${hoursElapsed}h ${minutesElapsed}m` : '16:8'}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant={fastingState.isActive ? 'purple' : 'neutral'} size="xs">
                {fastingState.isActive ? (
                  <span className="flex items-center gap-1">
                    <Moon className="w-3 h-3 text-purple-400" /> Fasting Mode
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Utensils className="w-3 h-3 text-emerald-400" /> Eating Window
                  </span>
                )}
              </Badge>
            </div>
            <p className="text-xs font-bold text-primary">
              {fastingState.isActive
                ? `${hoursRemaining}h ${minutesRemaining}m to Eating Window`
                : '16h Fast / 8h Eating Window'}
            </p>
            <p className="text-[11px] text-secondary mt-0.5">
              {fastingState.isActive
                ? `Started at ${new Date(fastingState.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Tap to start your daily 16h fast'}
            </p>
          </div>
        </div>

        <Button
          variant={fastingState.isActive ? 'danger' : 'primary'}
          size="sm"
          icon={fastingState.isActive ? Square : Play}
          onClick={fastingState.isActive ? handleStop : handleStart}
        >
          {fastingState.isActive ? 'End Fast' : 'Start Fast'}
        </Button>
      </div>
    );
  }

  return (
    <Card
      hover
      title="16:8 Intermittent Fasting"
      subtitle="Circadian rhythm & metabolic fasting timer"
      icon={Clock}
      badge={
        <Badge variant={fastingState.isActive ? 'purple' : 'neutral'} size="xs">
          {fastingState.isActive ? 'Active Fast' : 'Resting'}
        </Badge>
      }
    >
      <div className="flex flex-col items-center justify-center pt-2 pb-4">
        {/* Visual Progress Ring */}
        <div className="relative flex items-center justify-center my-3">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="var(--color-border)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="var(--color-purple)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            {fastingState.isActive ? (
              <>
                <span className="text-2xl font-black text-primary tracking-tight">
                  {String(hoursElapsed).padStart(2, '0')}:{String(minutesElapsed).padStart(2, '0')}:{String(secondsElapsed).padStart(2, '0')}
                </span>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {progressPercent}% Complete
                </span>
                <span className="text-[10px] text-secondary">
                  Target: {fastingState.targetHours}h
                </span>
              </>
            ) : (
              <>
                <Utensils className="w-6 h-6 text-muted mb-1 stroke-1" />
                <span className="text-sm font-extrabold text-primary">16:8 Protocol</span>
                <span className="text-[10px] font-semibold text-secondary">Ready to Fast</span>
              </>
            )}
          </div>
        </div>

        {/* Phase Details */}
        <div className="w-full grid grid-cols-2 gap-3 my-2 text-center">
          <div className="p-3 bg-subtle rounded-xl border border-theme">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
              Current Phase
            </span>
            <span className="text-xs font-black text-primary mt-1 block">
              {fastingState.isActive ? '🌙 Fasting (16h)' : '☀️ Eating (8h)'}
            </span>
          </div>
          <div className="p-3 bg-subtle rounded-xl border border-theme">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
              {fastingState.isActive ? 'Eating Window In' : 'Fast Target'}
            </span>
            <span className="text-xs font-black text-purple-600 dark:text-purple-400 mt-1 block">
              {fastingState.isActive ? `${hoursRemaining}h ${minutesRemaining}m` : `${targetHours} Hours`}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="w-full flex items-center gap-2 mt-3">
          {fastingState.isActive ? (
            <>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                icon={Square}
                onClick={handleStop}
              >
                End Fast
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={RotateCcw}
                onClick={handleReset}
                title="Reset Timer"
              />
            </>
          ) : (
            <Button
              variant="gradient"
              size="md"
              className="w-full"
              icon={Play}
              onClick={handleStart}
            >
              Start 16:8 Fast Now
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default FastingTimer;
