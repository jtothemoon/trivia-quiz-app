const { getDatabase } = require('../config/firebase');
const User = require('../models/User');

/**
 * User Service - Firebase operations for users
 */

// Create new user
const createUser = async (userId, nickname) => {
  try {
    const db = getDatabase();
    const userRef = db.ref(`users/${userId}`);

    const user = new User({
      userId,
      nickname,
      totalGames: 0,
      totalWins: 0,
      totalScore: 0,
      bestScore: 0
    });

    await userRef.set(user.toJSON());
    console.log(`✅ User created: ${userId} (${nickname})`);

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user by ID
const getUserById = async (userId) => {
  try {
    const db = getDatabase();
    const snapshot = await db.ref(`users/${userId}`).once('value');

    if (!snapshot.exists()) {
      return null;
    }

    return new User(snapshot.val());
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Update user stats after game
const updateUserStats = async (userId, gameResult) => {
  try {
    const db = getDatabase();
    const userRef = db.ref(`users/${userId}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      throw new Error('User not found');
    }

    const userData = snapshot.val();
    const updates = {
      totalGames: (userData.totalGames || 0) + 1,
      totalScore: (userData.totalScore || 0) + gameResult.score,
      lastActive: Date.now()
    };

    if (gameResult.isWinner) {
      updates.totalWins = (userData.totalWins || 0) + 1;
    }

    if (gameResult.score > (userData.bestScore || 0)) {
      updates.bestScore = gameResult.score;
    }

    await userRef.update(updates);
    console.log(`✅ User stats updated: ${userId}`);

    return updates;
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

// Save game result to Firebase
const saveGameResult = async (gameData) => {
  try {
    const db = getDatabase();
    const gameRef = db.ref('games').push();
    const gameId = gameRef.key;

    const gameResult = {
      gameId,
      roomId: gameData.roomId,
      category: gameData.category,
      difficulty: gameData.difficulty,
      players: gameData.players,
      startedAt: gameData.startedAt,
      finishedAt: gameData.finishedAt,
      winner: gameData.winner
    };

    await gameRef.set(gameResult);
    console.log(`✅ Game result saved: ${gameId}`);

    return gameId;
  } catch (error) {
    console.error('Error saving game result:', error);
    throw error;
  }
};

// Update rankings (using userId as key)
const updateRankings = async (userId, category, score) => {
  try {
    const db = getDatabase();

    // Get user info for nickname
    const user = await getUserById(userId);
    if (!user) {
      console.error('User not found for ranking update:', userId);
      return;
    }

    // Use userId as key to keep each user separate
    const userKey = userId.replace(/[^a-zA-Z0-9]/g, '_');

    // Update overall ranking
    const overallRef = db.ref(`rankings/overall/${userKey}`);
    const overallSnapshot = await overallRef.once('value');
    const currentOverallScore = overallSnapshot.val()?.score || 0;

    await overallRef.set({
      userId: userId,
      nickname: user.nickname,
      score: currentOverallScore + score
    });

    // Update category ranking
    if (category) {
      const categoryRef = db.ref(`rankings/categories/${category}/${userKey}`);
      const categorySnapshot = await categoryRef.once('value');
      const currentCategoryScore = categorySnapshot.val()?.score || 0;

      await categoryRef.set({
        userId: userId,
        nickname: user.nickname,
        score: currentCategoryScore + score
      });
    }

    // Update weekly ranking
    const weekKey = getWeekKey();
    const weeklyRef = db.ref(`rankings/weekly/${weekKey}/${userKey}`);
    const weeklySnapshot = await weeklyRef.once('value');
    const currentWeeklyScore = weeklySnapshot.val()?.score || 0;

    await weeklyRef.set({
      userId: userId,
      nickname: user.nickname,
      score: currentWeeklyScore + score
    });

    console.log(`✅ Rankings updated for user: ${userId} (${user.nickname})`);
  } catch (error) {
    console.error('Error updating rankings:', error);
    throw error;
  }
};

// Get week key (format: YYYY-Www)
const getWeekKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const onejan = new Date(year, 0, 1);
  const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
};

module.exports = {
  createUser,
  getUserById,
  updateUserStats,
  saveGameResult,
  updateRankings
};
