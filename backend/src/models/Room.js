const { GAME_STATES } = require('../config/constants');

class Room {
  constructor(data) {
    this.roomId = data.roomId;
    this.hostId = data.hostId;
    this.category = data.category;
    this.difficulty = data.difficulty;
    this.isPrivate = data.isPrivate || false;
    this.maxPlayers = data.maxPlayers || 4;
    this.players = data.players || {};
    this.state = data.state || GAME_STATES.WAITING;
    this.createdAt = data.createdAt || Date.now();
  }

  toJSON() {
    return {
      roomId: this.roomId,
      hostId: this.hostId,
      category: this.category,
      difficulty: this.difficulty,
      isPrivate: this.isPrivate,
      maxPlayers: this.maxPlayers,
      players: this.players,
      state: this.state,
      createdAt: this.createdAt,
      playerCount: this.getPlayerCount()
    };
  }

  // Add player to room
  addPlayer(userId, nickname) {
    if (this.isFull()) {
      throw new Error('Room is full');
    }

    this.players[userId] = {
      userId,
      nickname,
      isReady: false,
      score: 0,
      joinedAt: Date.now()
    };

    return this.players[userId];
  }

  // Remove player from room
  removePlayer(userId) {
    if (this.players[userId]) {
      delete this.players[userId];
      return true;
    }
    return false;
  }

  // Set player ready status
  setPlayerReady(userId, isReady) {
    if (this.players[userId]) {
      this.players[userId].isReady = isReady;
      return true;
    }
    return false;
  }

  // Check if all players are ready
  areAllPlayersReady() {
    const playerList = Object.values(this.players);
    if (playerList.length === 0) return false;
    return playerList.every(player => player.isReady);
  }

  // Check if room is full
  isFull() {
    return this.getPlayerCount() >= this.maxPlayers;
  }

  // Get player count
  getPlayerCount() {
    return Object.keys(this.players).length;
  }

  // Check if user is host
  isHost(userId) {
    return this.hostId === userId;
  }
}

module.exports = Room;
