const express = require('express');
const router = express.Router();
const { fetchQuestions, fetchCategories } = require('../services/triviaAPI');
const { CATEGORIES } = require('../config/constants');

/**
 * GET /api/quiz/categories
 * Get all available quiz categories
 */
router.get('/categories', async (req, res) => {
  try {
    // Return predefined categories from constants
    const categories = Object.entries(CATEGORIES).map(([id, name]) => ({
      id: parseInt(id),
      name
    }));

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

/**
 * GET /api/quiz/questions
 * Get quiz questions based on parameters
 * Query params:
 *   - amount: number of questions (default: 10, max: 50)
 *   - category: category ID
 *   - difficulty: easy, medium, hard
 */
router.get('/questions', async (req, res) => {
  try {
    const { amount, category, difficulty } = req.query;

    // Validate parameters
    if (amount && (isNaN(amount) || amount < 1 || amount > 50)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount parameter (must be 1-50)'
      });
    }

    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid difficulty parameter (must be easy, medium, or hard)'
      });
    }

    const questions = await fetchQuestions({
      amount: parseInt(amount) || 10,
      category: category ? parseInt(category) : undefined,
      difficulty
    });

    res.json({
      success: true,
      data: questions,
      count: questions.length
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions',
      message: error.message
    });
  }
});

module.exports = router;
