const { GAME_STATES, DIFFICULTY_MULTIPLIERS, BASE_SCORE, TIME_BONUS_MULTIPLIER } = require('../config/constants');

class Game {
  constructor(data) {
    this.gameId = data.gameId;
    this.roomId = data.roomId;
    this.category = data.category;
    this.difficulty = data.difficulty;
    this.questions = data.questions || [];
    this.currentQuestionIndex = data.currentQuestionIndex || 0;
    this.currentQuestionAnswers = new Set(); // Track who answered current question
    this.players = data.players || {};
    this.state = data.state || GAME_STATES.WAITING;
    this.startedAt = data.startedAt || null;
    this.finishedAt = data.finishedAt || null;
    this.winner = data.winner || null;
  }

  toJSON() {
    return {
      gameId: this.gameId,
      roomId: this.roomId,
      category: this.category,
      difficulty: this.difficulty,
      currentQuestionIndex: this.currentQuestionIndex,
      totalQuestions: this.questions.length,
      players: this.players,
      state: this.state,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      winner: this.winner
    };
  }

  // Start game
  start() {
    this.state = GAME_STATES.IN_PROGRESS;
    this.startedAt = Date.now();
  }

  // Get current question
  getCurrentQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    return this.questions[this.currentQuestionIndex];
  }

  // Move to next question
  nextQuestion() {
    this.currentQuestionIndex++;
    this.currentQuestionAnswers.clear(); // Reset answers for next question
    return this.getCurrentQuestion();
  }

  // Check if game is finished
  isFinished() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  // Submit answer
  submitAnswer(userId, answer, timeSpent) {
    const question = this.getCurrentQuestion();
    if (!question) return null;

    const isCorrect = answer === question.correctAnswer;
    const score = isCorrect ? this.calculateScore(timeSpent) : 0;

    // Initialize player if not exists
    if (!this.players[userId]) {
      this.players[userId] = {
        userId,
        score: 0,
        answers: []
      };
    }

    // Update player data
    this.players[userId].answers.push({
      questionId: question.id,
      answer,
      isCorrect,
      timeSpent,
      score
    });

    this.players[userId].score += score;

    // Track that this player answered
    this.currentQuestionAnswers.add(userId);

    return {
      isCorrect,
      score,
      correctAnswer: question.correctAnswer,
      totalScore: this.players[userId].score
    };
  }

  // Check if all players have answered current question
  allPlayersAnswered() {
    const totalPlayers = Object.keys(this.players).length;
    return this.currentQuestionAnswers.size === totalPlayers;
  }

  // Calculate score based on time
  calculateScore(timeSpent) {
    const timeRemaining = 15 - timeSpent; // 15 seconds per question
    const timeBonus = Math.max(0, (timeRemaining / 15) * TIME_BONUS_MULTIPLIER);
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[this.difficulty] || 1;

    return Math.round((BASE_SCORE + timeBonus) * difficultyMultiplier);
  }

  // Finish game
  finish() {
    this.state = GAME_STATES.FINISHED;
    this.finishedAt = Date.now();

    // Determine winner
    const scores = Object.entries(this.players).map(([userId, data]) => ({
      userId,
      score: data.score
    }));

    scores.sort((a, b) => b.score - a.score);
    this.winner = scores[0]?.userId || null;

    return {
      winner: this.winner,
      scores
    };
  }

  // Get final scores
  getFinalScores() {
    return Object.entries(this.players).map(([userId, data]) => ({
      userId,
      nickname: data.nickname,
      score: data.score,
      correctAnswers: data.answers.filter(a => a.isCorrect).length,
      totalQuestions: this.questions.length
    })).sort((a, b) => b.score - a.score);
  }
}

module.exports = Game;
