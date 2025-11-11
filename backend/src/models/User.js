class User {
  constructor(data) {
    this.userId = data.userId || null;
    this.nickname = data.nickname;
    this.totalGames = data.totalGames || 0;
    this.totalWins = data.totalWins || 0;
    this.totalScore = data.totalScore || 0;
    this.bestScore = data.bestScore || 0;
    this.createdAt = data.createdAt || Date.now();
    this.lastActive = data.lastActive || Date.now();
  }

  toJSON() {
    return {
      userId: this.userId,
      nickname: this.nickname,
      totalGames: this.totalGames,
      totalWins: this.totalWins,
      totalScore: this.totalScore,
      bestScore: this.bestScore,
      createdAt: this.createdAt,
      lastActive: this.lastActive
    };
  }

  // Calculate win rate
  getWinRate() {
    if (this.totalGames === 0) return 0;
    return ((this.totalWins / this.totalGames) * 100).toFixed(1);
  }

  // Calculate average score
  getAverageScore() {
    if (this.totalGames === 0) return 0;
    return Math.round(this.totalScore / this.totalGames);
  }
}

module.exports = User;
