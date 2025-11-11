const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/firebase');

/**
 * GET /api/rankings/overall
 * Get overall rankings
 */
router.get('/overall', async (req, res) => {
  try {
    const db = getDatabase();
    const snapshot = await db.ref('rankings/overall').once('value');

    const rankings = snapshot.val() || {};

    res.json({
      success: true,
      data: rankings
    });

  } catch (error) {
    console.error('Error fetching overall rankings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overall rankings',
      message: error.message
    });
  }
});

/**
 * GET /api/rankings/category/:category
 * Get rankings for a specific category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const db = getDatabase();
    const snapshot = await db.ref(`rankings/categories/${category}`).once('value');

    const rankings = snapshot.val() || {};

    res.json({
      success: true,
      data: rankings
    });

  } catch (error) {
    console.error('Error fetching category rankings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category rankings',
      message: error.message
    });
  }
});

/**
 * GET /api/rankings/weekly
 * Get weekly rankings
 */
router.get('/weekly', async (req, res) => {
  try {
    const db = getDatabase();
    const weekKey = getWeekKey();
    const snapshot = await db.ref(`rankings/weekly/${weekKey}`).once('value');

    const rankings = snapshot.val() || {};

    res.json({
      success: true,
      data: rankings,
      week: weekKey
    });

  } catch (error) {
    console.error('Error fetching weekly rankings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weekly rankings',
      message: error.message
    });
  }
});

/**
 * GET /api/rankings/friends/:userId
 * Get rankings for user's friends
 */
router.get('/friends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // For now, return empty as we don't have friends system yet

    res.json({
      success: true,
      data: {}
    });

  } catch (error) {
    console.error('Error fetching friend rankings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch friend rankings',
      message: error.message
    });
  }
});

// Helper: Get current week key (format: YYYY-Www)
const getWeekKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const onejan = new Date(year, 0, 1);
  const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
};

module.exports = router;
