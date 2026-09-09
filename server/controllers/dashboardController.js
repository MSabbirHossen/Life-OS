import { Journal } from '../models/Journal.js';
import { JournalPrompt } from '../models/JournalPrompt.js';
import { TimeLog } from '../models/TimeLog.js';
import { StudySession } from '../models/StudySession.js';
import { Meal } from '../models/Meal.js';
import { Workout } from '../models/Workout.js';
import { Transaction } from '../models/Transaction.js';
import { SalahLog } from '../models/SalahLog.js';
import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { Goal } from '../models/Goal.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const monthStart = `${date.substring(0, 7)}-01`;

    const [
      journal,
      prompts,
      timeLogs,
      studies,
      meals,
      workouts,
      transactionsToday,
      transactionsMonth,
      salahLogs,
      habits,
      habitLogs,
      goals,
    ] = await Promise.all([
      Journal.findOne({ userId, date }),
      JournalPrompt.find().sort({ lastServedAt: 1 }).limit(1),
      TimeLog.find({ userId, date }),
      StudySession.find({ userId, date }),
      Meal.find({ userId, date }),
      Workout.find({ userId, date }),
      Transaction.find({ userId, date }),
      Transaction.find({ userId, date: { $gte: monthStart, $lte: date } }),
      SalahLog.find({ userId, date }),
      Habit.find({ userId, archived: false }),
      HabitLog.find({ userId, date }),
      Goal.find({ userId, status: 'active' }),
    ]);

    // Time calculation
    const timeMinutesTotal = timeLogs.reduce((sum, item) => sum + item.durationMinutes, 0);
    const timeByCategory = {};
    timeLogs.forEach((item) => {
      timeByCategory[item.category] = (timeByCategory[item.category] || 0) + item.durationMinutes;
    });

    // Calories calculation
    const totalCaloriesIn = meals.reduce((sum, item) => sum + (item.totalCalories || 0), 0);
    const totalProtein = meals.reduce((sum, item) => sum + (item.totalProtein || 0), 0);

    // Workout calculation
    const totalCaloriesBurned = workouts.reduce((sum, item) => sum + (item.caloriesBurned || 0), 0);

    // Salah calculation
    const salahCompletedCount = salahLogs.filter((s) => s.status !== 'missed').length;

    // Finance calculation
    const expensesToday = transactionsToday
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesMonth = transactionsMonth
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Habit completion count
    const habitsCompletedToday = habitLogs.filter((h) => h.completed).length;

    res.json({
      date,
      userGoals: {
        dailyCalorieGoal: req.user.dailyCalorieGoal || 2000,
        weightGoal: req.user.weightGoal || 70,
        screenTimeGoalMinutes: req.user.screenTimeGoalMinutes || 120,
      },
      summary: {
        journal: journal || null,
        prompt: prompts[0] || null,
        time: {
          totalMinutes: timeMinutesTotal,
          byCategory: timeByCategory,
          count: timeLogs.length,
        },
        study: {
          totalMinutes: studies.reduce((sum, s) => sum + s.durationMinutes, 0),
          sessionsCount: studies.length,
        },
        calories: {
          consumed: totalCaloriesIn,
          protein: totalProtein,
          goal: req.user.dailyCalorieGoal || 2000,
        },
        fitness: {
          caloriesBurned: totalCaloriesBurned,
          workoutsCount: workouts.length,
        },
        salah: {
          completedCount: salahCompletedCount,
          total: 5,
          logs: salahLogs,
        },
        finance: {
          expensesToday,
          expensesMonth,
        },
        habits: {
          activeCount: habits.length,
          completedTodayCount: habitsCompletedToday,
        },
        goalsCount: goals.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch dashboard summary' });
  }
};
