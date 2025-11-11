const express = require('express');
const router = express.Router();
const { createUser, getUserById } = require('../services/firebaseService');

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req, res) => {
  try {
    const { nickname } = req.body;

    if (!nickname || nickname.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nickname is required'
      });
    }

    if (nickname.length < 2 || nickname.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Nickname must be between 2-20 characters'
      });
    }

    const user = await createUser(nickname.trim());

    res.status(201).json({
      success: true,
      data: user.toJSON()
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  }
});

/**
 * GET /api/users/:userId
 * Get user by ID
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });

  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      message: error.message
    });
  }
});

/**
 * GET /api/users/:userId/stats
 * Get user statistics
 */
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const stats = {
      ...user.toJSON(),
      winRate: user.getWinRate(),
      averageScore: user.getAverageScore()
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user stats',
      message: error.message
    });
  }
});

module.exports = router;
