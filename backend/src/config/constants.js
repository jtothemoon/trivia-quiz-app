module.exports = {
  // Quiz settings
  QUESTIONS_PER_GAME: 10,
  TIME_PER_QUESTION: 15, // seconds

  // Score calculation
  BASE_SCORE: 100,
  TIME_BONUS_MULTIPLIER: 50,
  DIFFICULTY_MULTIPLIERS: {
    easy: 1,
    medium: 1.5,
    hard: 2
  },

  // Categories (Open Trivia DB)
  CATEGORIES: {
    9: 'General Knowledge',
    17: 'Science & Nature',
    18: 'Computers',
    21: 'Sports',
    22: 'Geography',
    23: 'History',
    27: 'Animals'
  },

  // Game states
  GAME_STATES: {
    WAITING: 'waiting',
    STARTING: 'starting',
    IN_PROGRESS: 'in_progress',
    FINISHED: 'finished'
  },

  // Room settings
  MAX_PLAYERS_PER_ROOM: 4,
  MIN_PLAYERS_TO_START: 2
};
