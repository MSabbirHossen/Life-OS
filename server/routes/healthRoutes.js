import express from 'express';
import {
  searchFoodItems,
  getMeals,
  createMeal,
  deleteMeal,
  searchWorkoutTypes,
  getWorkouts,
  createWorkout,
  deleteWorkout,
  getBodyMetrics,
  createBodyMetric,
  getWaterLog,
  logWater,
  getHealthSummary,
} from '../controllers/healthController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Summary & Autocomplete
router.get('/summary', getHealthSummary);
router.get('/food-items/search', searchFoodItems);
router.get('/workout-types/search', searchWorkoutTypes);

// Meals
router.route('/meals').get(getMeals).post(createMeal);
router.delete('/meals/:id', deleteMeal);

// Workouts
router.route('/workouts').get(getWorkouts).post(createWorkout);
router.delete('/workouts/:id', deleteWorkout);

// Body Metrics
router.route('/body-metrics').get(getBodyMetrics).post(createBodyMetric);

// Water Log
router.route('/water').get(getWaterLog).post(logWater);

export default router;
