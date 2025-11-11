import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// User APIs
export const userAPI = {
  getUser: (userId) => api.get(`/users/${userId}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
  getUserStats: (userId) => api.get(`/users/${userId}/stats`)
};

// Ranking APIs
export const rankingAPI = {
  getOverallRanking: () => api.get('/rankings/overall'),
  getCategoryRanking: (category) => api.get(`/rankings/category/${category}`),
  getWeeklyRanking: () => api.get('/rankings/weekly'),
  getFriendRanking: (userId) => api.get(`/rankings/friends/${userId}`)
};

// Quiz APIs
export const quizAPI = {
  getCategories: () => api.get('/quiz/categories'),
  getQuestions: (params) => api.get('/quiz/questions', { params })
};

// Game APIs
export const gameAPI = {
  getGame: (gameId) => api.get(`/games/${gameId}`),
  getUserGames: (userId) => api.get(`/games/user/${userId}`)
};

export default api;
