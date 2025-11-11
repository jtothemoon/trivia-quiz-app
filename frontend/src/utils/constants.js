export const GAME_CONSTANTS = {
  QUESTIONS_PER_GAME: 10,
  TIME_PER_QUESTION: 15,
  MAX_PLAYERS_PER_ROOM: 4,
  MIN_PLAYERS_TO_START: 2
};

export const SCORE_CONSTANTS = {
  BASE_SCORE: 100,
  TIME_BONUS_MULTIPLIER: 50,
  DIFFICULTY_MULTIPLIERS: {
    easy: 1,
    medium: 1.5,
    hard: 2
  }
};

export const CATEGORIES = {
  9: 'General Knowledge',
  17: 'Science & Nature',
  18: 'Computers',
  21: 'Sports',
  22: 'Geography',
  23: 'History',
  27: 'Animals'
};

export const DIFFICULTIES = ['easy', 'medium', 'hard'];

export const GAME_STATES = {
  WAITING: 'waiting',
  STARTING: 'starting',
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished'
};

export const SOCKET_EVENTS = {
  // Room events
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_READY: 'room:ready',
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_PLAYER_JOINED: 'room:player-joined',
  ROOM_PLAYER_LEFT: 'room:player-left',
  ROOM_READY_STATUS: 'room:ready-status',

  // Game events
  GAME_START: 'game:start',
  GAME_ANSWER: 'game:answer',
  GAME_NEXT: 'game:next',
  GAME_STARTED: 'game:started',
  GAME_QUESTION: 'game:question',
  GAME_ANSWER_RESULT: 'game:answer-result',
  GAME_SCORES: 'game:scores',
  GAME_FINISHED: 'game:finished',

  // Match events
  MATCH_QUICK: 'match:quick',
  MATCH_CANCEL: 'match:cancel',
  MATCH_FOUND: 'match:found',
  MATCH_FAILED: 'match:failed',

  // Error
  ERROR: 'error'
};
