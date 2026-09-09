import { Meal } from '../models/Meal.js';
import { Workout } from '../models/Workout.js';
import { WorkoutType } from '../models/WorkoutType.js';
import { BodyMetric } from '../models/BodyMetric.js';
import { WaterLog } from '../models/WaterLog.js';
import { FoodItem } from '../models/FoodItem.js';
import { User } from '../models/User.js';

// --- Meals & Nutrition ---

export const getMeals = async (req, res) => {
  try {
    const { date, from, to } = req.query;
    const filter = { userId: req.user._id };

    if (date) {
      filter.date = date;
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const meals = await Meal.find(filter).sort({ createdAt: -1 });
    res.json(meals);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch meals' });
  }
};

export const createMeal = async (req, res) => {
  try {
    const { date, mealType, items } = req.body;
    if (!date || !mealType || !items || !items.length) {
      return res.status(400).json({ message: 'Date, mealType, and at least one item are required' });
    }

    let calculatedTotalCalories = 0;
    let calculatedTotalProtein = 0;
    let calculatedTotalCarbs = 0;
    let calculatedTotalFat = 0;

    const processedItems = await Promise.all(
      items.map(async (item) => {
        const qty = Number(item.quantity) || 1;
        let calPerUnit = Number(item.caloriesPerUnit) || 0;
        let pPerUnit = Number(item.proteinPerUnit) || 0;
        let cPerUnit = Number(item.carbsPerUnit) || 0;
        let fPerUnit = Number(item.fatPerUnit) || 0;

        // Auto-upsert or find in FoodItem library
        if (item.name?.trim()) {
          const trimmedName = item.name.trim();
          let foodDoc = await FoodItem.findOne({ userId: req.user._id, name: trimmedName });

          if (calPerUnit > 0) {
            if (foodDoc) {
              foodDoc.caloriesPerUnit = calPerUnit;
              foodDoc.proteinPerUnit = pPerUnit;
              foodDoc.carbsPerUnit = cPerUnit;
              foodDoc.fatPerUnit = fPerUnit;
              foodDoc.unitType = item.unit || foodDoc.unitType;
              foodDoc.timesUsed += 1;
              foodDoc.lastUsedAt = new Date();
              await foodDoc.save();
            } else {
              foodDoc = await FoodItem.create({
                userId: req.user._id,
                name: trimmedName,
                unitType: item.unit || 'piece',
                caloriesPerUnit: calPerUnit,
                proteinPerUnit: pPerUnit,
                carbsPerUnit: cPerUnit,
                fatPerUnit: fPerUnit,
              });
            }
          } else if (foodDoc) {
            calPerUnit = foodDoc.caloriesPerUnit;
            pPerUnit = foodDoc.proteinPerUnit || 0;
            cPerUnit = foodDoc.carbsPerUnit || 0;
            fPerUnit = foodDoc.fatPerUnit || 0;
          }
        }

        const itemCal = item.calories !== undefined && Number(item.calories) > 0
          ? Number(item.calories)
          : Math.round(calPerUnit * qty * 10) / 10;

        const itemP = item.protein !== undefined && Number(item.protein) > 0
          ? Number(item.protein)
          : Math.round(pPerUnit * qty * 10) / 10;

        const itemC = item.carbs !== undefined && Number(item.carbs) > 0
          ? Number(item.carbs)
          : Math.round(cPerUnit * qty * 10) / 10;

        const itemF = item.fat !== undefined && Number(item.fat) > 0
          ? Number(item.fat)
          : Math.round(fPerUnit * qty * 10) / 10;

        calculatedTotalCalories += itemCal;
        calculatedTotalProtein += itemP;
        calculatedTotalCarbs += itemC;
        calculatedTotalFat += itemF;

        return {
          name: item.name.trim(),
          quantity: qty,
          unit: item.unit || 'piece',
          calories: itemCal,
          protein: itemP,
          carbs: itemC,
          fat: itemF,
        };
      })
    );

    const meal = await Meal.create({
      userId: req.user._id,
      date,
      mealType,
      items: processedItems,
      totalCalories: Math.round(calculatedTotalCalories),
      totalProtein: Math.round(calculatedTotalProtein * 10) / 10,
      totalCarbs: Math.round(calculatedTotalCarbs * 10) / 10,
      totalFat: Math.round(calculatedTotalFat * 10) / 10,
    });

    res.status(201).json(meal);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to log meal' });
  }
};

export const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    res.json({ message: 'Meal deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete meal' });
  }
};

// --- Workouts & Exercises ---

export const getWorkouts = async (req, res) => {
  try {
    const { date, from, to } = req.query;
    const filter = { userId: req.user._id };

    if (date) {
      filter.date = date;
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const workouts = await Workout.find(filter).sort({ createdAt: -1 });
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch workouts' });
  }
};

export const createWorkout = async (req, res) => {
  try {
    const {
      date,
      name,
      trackingType,
      sets,
      reps,
      weight,
      durationMinutes,
      caloriesBurned,
      target,
      idealCaloriesPerSet,
      idealCaloriesPerMin,
      notes,
    } = req.body;

    if (!date || !name) {
      return res.status(400).json({ message: 'Date and workout name are required' });
    }

    const exerciseName = name.trim();
    const type = trackingType || (sets > 0 ? 'sets_reps' : 'duration');
    const numSets = Number(sets) || 0;
    const numReps = Number(reps) || 0;
    const numWeight = Number(weight) || 0;
    const numDuration = Number(durationMinutes) || 0;

    // Check or upsert WorkoutType in library
    let workoutTypeDoc = await WorkoutType.findOne({ userId: req.user._id, name: exerciseName });

    if (workoutTypeDoc) {
      if (idealCaloriesPerSet) workoutTypeDoc.caloriesPerSet = Number(idealCaloriesPerSet);
      if (idealCaloriesPerMin) workoutTypeDoc.defaultCaloriesPerMinute = Number(idealCaloriesPerMin);
      if (numSets > 0) workoutTypeDoc.defaultSets = numSets;
      if (numReps > 0) workoutTypeDoc.defaultReps = numReps;
      if (target) workoutTypeDoc.target = target;
      await workoutTypeDoc.save();
    } else {
      workoutTypeDoc = await WorkoutType.create({
        userId: req.user._id,
        name: exerciseName,
        trackingType: type,
        caloriesPerSet: Number(idealCaloriesPerSet) || 8,
        defaultCaloriesPerMinute: Number(idealCaloriesPerMin) || 6,
        defaultSets: numSets || 3,
        defaultReps: numReps || 10,
        defaultWeight: numWeight || 0,
        target: target || 'Muscle',
      });
    }

    // Determine Calories Burned
    let finalCalories = Number(caloriesBurned);

    if (!finalCalories || finalCalories <= 0) {
      if (type === 'sets_reps' && numSets > 0) {
        const calPerSet = workoutTypeDoc?.caloriesPerSet || 8;
        finalCalories = Math.round(calPerSet * numSets);
      } else if (numDuration > 0) {
        // Retrieve latest user weight from BodyMetric
        const latestMetric = await BodyMetric.findOne({ userId: req.user._id, weightKg: { $exists: true, $ne: null } }).sort({ date: -1, createdAt: -1 });
        const user = await User.findById(req.user._id);
        const bodyWeightKg = latestMetric?.weightKg || user?.weightGoal || 70;

        const metValues = { Cardio: 8.5, Sports: 7.5, Muscle: 5.0, Flexibility: 3.0 };
        const met = metValues[target || 'Muscle'] || 5.0;
        finalCalories = Math.round(met * bodyWeightKg * (numDuration / 60));
      } else {
        finalCalories = Math.round((workoutTypeDoc?.caloriesPerSet || 8) * (numSets || 1));
      }
    }

    const workout = await Workout.create({
      userId: req.user._id,
      date,
      workoutTypeId: workoutTypeDoc._id,
      name: exerciseName,
      trackingType: type,
      sets: numSets,
      reps: numReps,
      weight: numWeight,
      durationMinutes: numDuration || (numSets > 0 ? numSets * 3 : 30),
      caloriesBurned: finalCalories || 50,
      target: target || workoutTypeDoc.target || 'Muscle',
      notes: notes?.trim() || '',
    });

    res.status(201).json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to log workout' });
  }
};

export const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!workout) return res.status(404).json({ message: 'Workout not found' });
    res.json({ message: 'Workout deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete workout' });
  }
};

// --- Autocomplete Searches ---

export const searchFoodItems = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = { userId: req.user._id };
    if (q) filter.name = { $regex: q, $options: 'i' };

    const foods = await FoodItem.find(filter).sort({ timesUsed: -1, lastUsedAt: -1 }).limit(10);
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to search foods' });
  }
};

export const searchWorkoutTypes = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = { userId: req.user._id };
    if (q) filter.name = { $regex: q, $options: 'i' };

    const types = await WorkoutType.find(filter).sort({ updatedAt: -1 }).limit(10);
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to search workout types' });
  }
};

// --- Body Metrics & Water ---

export const getBodyMetrics = async (req, res) => {
  try {
    const metrics = await BodyMetric.find({ userId: req.user._id }).sort({ date: 1 });
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch metrics' });
  }
};

export const createBodyMetric = async (req, res) => {
  try {
    const { date, weightKg, waistCm, chestCm, armCm, notes } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const metric = await BodyMetric.findOneAndUpdate(
      { userId: req.user._id, date },
      {
        weightKg: weightKg ? Number(weightKg) : undefined,
        waistCm: waistCm ? Number(waistCm) : undefined,
        chestCm: chestCm ? Number(chestCm) : undefined,
        armCm: armCm ? Number(armCm) : undefined,
        notes: notes?.trim() || '',
      },
      { new: true, upsert: true }
    );

    res.status(201).json(metric);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to save body metric' });
  }
};

export const getWaterLog = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const log = await WaterLog.findOne({ userId: req.user._id, date });
    res.json(log || { date, glasses: 0, ml: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch water log' });
  }
};

export const logWater = async (req, res) => {
  try {
    const { date, glasses, ml, increment } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    let log = await WaterLog.findOne({ userId: req.user._id, date });

    if (!log) {
      log = new WaterLog({ userId: req.user._id, date, glasses: 0, ml: 0 });
    }

    if (increment) {
      log.glasses = Math.max(0, log.glasses + Number(increment));
      log.ml = log.glasses * 250;
    } else {
      if (glasses !== undefined) {
        log.glasses = Number(glasses);
        log.ml = log.glasses * 250;
      }
      if (ml !== undefined) log.ml = Number(ml);
    }

    await log.save();
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to log water' });
  }
};

// --- Health Aggregated Summary ---

export const getHealthSummary = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const user = await User.findById(req.user._id);
    const dailyCalorieGoal = user?.dailyCalorieGoal || 2000;

    const [meals, workouts, water] = await Promise.all([
      Meal.find({ userId: req.user._id, date }),
      Workout.find({ userId: req.user._id, date }),
      WaterLog.findOne({ userId: req.user._id, date }),
    ]);

    let caloriesConsumed = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    meals.forEach((m) => {
      caloriesConsumed += m.totalCalories || 0;
      totalProtein += m.totalProtein || 0;
      totalCarbs += m.totalCarbs || 0;
      totalFat += m.totalFat || 0;
    });

    let caloriesBurned = 0;
    workouts.forEach((w) => {
      caloriesBurned += w.caloriesBurned || 0;
    });

    res.json({
      date,
      dailyCalorieGoal,
      caloriesConsumed,
      caloriesBurned,
      netCalories: caloriesConsumed - caloriesBurned,
      remainingCalories: Math.max(0, dailyCalorieGoal - caloriesConsumed),
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalCarbs: Math.round(totalCarbs * 10) / 10,
      totalFat: Math.round(totalFat * 10) / 10,
      waterGlasses: water?.glasses || 0,
      waterMl: water?.ml || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch health summary' });
  }
};
