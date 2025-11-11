const Room = require('../models/Room');
const Game = require('../models/Game');
const { fetchQuestions } = require('./triviaAPI');

// In-memory storage for active rooms and games
const rooms = new Map();
const games = new Map();

/**
 * Create a new room
 */
const createRoom = (hostId, nickname, options) => {
  const roomId = generateRoomId();

  const room = new Room({
    roomId,
    hostId,
    category: options.category,
    difficulty: options.difficulty,
    isPrivate: options.isPrivate || false,
    maxPlayers: options.maxPlayers || 4
  });

  room.addPlayer(hostId, nickname);
  rooms.set(roomId, room);

  console.log(`✅ Room created: ${roomId} by ${nickname}`);
  return room;
};

/**
 * Get room by ID
 */
const getRoom = (roomId) => {
  return rooms.get(roomId);
};

/**
 * Join room
 */
const joinRoom = (roomId, userId, nickname) => {
  const room = rooms.get(roomId);

  if (!room) {
    throw new Error('Room not found');
  }

  if (room.isFull()) {
    throw new Error('Room is full');
  }

  room.addPlayer(userId, nickname);
  console.log(`✅ ${nickname} joined room: ${roomId}`);

  return room;
};

/**
 * Leave room
 */
const leaveRoom = (roomId, userId) => {
  const room = rooms.get(roomId);

  if (!room) {
    return null;
  }

  room.removePlayer(userId);

  // If room is empty, delete it
  if (room.getPlayerCount() === 0) {
    rooms.delete(roomId);
    console.log(`🗑️ Room deleted (empty): ${roomId}`);
    return null;
  }

  // If host left, assign new host
  if (room.hostId === userId) {
    const playerIds = Object.keys(room.players);
    if (playerIds.length > 0) {
      room.hostId = playerIds[0];
      console.log(`👑 New host assigned: ${room.hostId}`);
    }
  }

  return room;
};

/**
 * Set player ready status
 */
const setPlayerReady = (roomId, userId, isReady) => {
  const room = rooms.get(roomId);

  if (!room) {
    throw new Error('Room not found');
  }

  room.setPlayerReady(userId, isReady);
  return room;
};

/**
 * Start game
 */
const startGame = async (roomId) => {
  const room = rooms.get(roomId);

  if (!room) {
    throw new Error('Room not found');
  }

  // Fetch questions from Trivia API
  const questions = await fetchQuestions({
    amount: 10,
    category: room.category,
    difficulty: room.difficulty
  });

  const game = new Game({
    gameId: generateGameId(),
    roomId: room.roomId,
    category: room.category,
    difficulty: room.difficulty,
    questions,
    players: {}
  });

  // Initialize players in game
  Object.entries(room.players).forEach(([userId, playerData]) => {
    game.players[userId] = {
      userId,
      nickname: playerData.nickname,
      score: 0,
      answers: []
    };
  });

  game.start();
  games.set(game.gameId, game);

  console.log(`🎮 Game started: ${game.gameId} in room ${roomId}`);
  return game;
};

/**
 * Get game by ID
 */
const getGame = (gameId) => {
  return games.get(gameId);
};

/**
 * Submit answer
 */
const submitAnswer = (gameId, userId, answer, timeSpent) => {
  const game = games.get(gameId);

  if (!game) {
    throw new Error('Game not found');
  }

  return game.submitAnswer(userId, answer, timeSpent);
};

/**
 * Move to next question
 */
const nextQuestion = (gameId) => {
  const game = games.get(gameId);

  if (!game) {
    throw new Error('Game not found');
  }

  const nextQ = game.nextQuestion();

  if (!nextQ && !game.isFinished()) {
    // Game finished
    return game.finish();
  }

  return nextQ;
};

/**
 * Finish game
 */
const finishGame = (gameId) => {
  const game = games.get(gameId);

  if (!game) {
    throw new Error('Game not found');
  }

  const result = game.finish();
  console.log(`🏁 Game finished: ${gameId}, Winner: ${result.winner}`);

  return result;
};

/**
 * Get all active rooms
 */
const getAllRooms = () => {
  return Array.from(rooms.values())
    .map(room => room.toJSON());
};

/**
 * Generate random room ID
 */
const generateRoomId = () => {
  return 'room_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Generate random game ID
 */
const generateGameId = () => {
  return 'game_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Check if all players have answered current question
 */
const checkAllAnswered = (gameId) => {
  const game = games.get(gameId);

  if (!game) {
    throw new Error('Game not found');
  }

  return game.allPlayersAnswered();
};

module.exports = {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  setPlayerReady,
  startGame,
  getGame,
  submitAnswer,
  nextQuestion,
  finishGame,
  getAllRooms,
  checkAllAnswered
};
