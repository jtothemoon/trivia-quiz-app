const express = require('express');
const router = express.Router();
const gameService = require('../services/gameService');

/**
 * GET /api/rooms
 * Get all active rooms
 */
router.get('/', (req, res) => {
  try {
    const rooms = gameService.getAllRooms();

    res.json({
      success: true,
      data: rooms
    });

  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rooms',
      message: error.message
    });
  }
});

module.exports = router;
