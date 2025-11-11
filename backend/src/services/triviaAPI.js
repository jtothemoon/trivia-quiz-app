const axios = require('axios');

const TRIVIA_API_URL = process.env.TRIVIA_API_URL || 'https://opentdb.com/api.php';

/**
 * Fetch questions from Open Trivia Database API
 * @param {Object} options - Query parameters
 * @param {number} options.amount - Number of questions (1-50)
 * @param {number} options.category - Category ID
 * @param {string} options.difficulty - easy, medium, hard
 * @param {string} options.type - multiple, boolean
 * @returns {Promise<Array>} Array of questions
 */
const fetchQuestions = async (options = {}) => {
  try {
    const {
      amount = 10,
      category,
      difficulty,
      type = 'multiple'
    } = options;

    const params = {
      amount: Math.min(Math.max(amount, 1), 50), // Limit between 1-50
      type
    };

    if (category) params.category = category;
    if (difficulty) params.difficulty = difficulty;

    console.log('📡 Fetching questions from Trivia API:', params);

    const response = await axios.get(TRIVIA_API_URL, { params });

    if (response.data.response_code !== 0) {
      throw new Error(`Trivia API error: ${getErrorMessage(response.data.response_code)}`);
    }

    const questions = response.data.results.map((q, index) => ({
      id: `q_${Date.now()}_${index}`,
      category: decodeHTML(q.category),
      difficulty: q.difficulty,
      question: decodeHTML(q.question),
      correctAnswer: decodeHTML(q.correct_answer),
      incorrectAnswers: q.incorrect_answers.map(ans => decodeHTML(ans)),
      allAnswers: shuffleArray([
        decodeHTML(q.correct_answer),
        ...q.incorrect_answers.map(ans => decodeHTML(ans))
      ])
    }));

    console.log(`✅ Fetched ${questions.length} questions successfully`);
    return questions;

  } catch (error) {
    console.error('❌ Error fetching questions:', error.message);
    throw error;
  }
};

/**
 * Get available categories from Trivia API
 */
const fetchCategories = async () => {
  try {
    const response = await axios.get('https://opentdb.com/api_category.php');
    return response.data.trivia_categories.map(cat => ({
      id: cat.id,
      name: cat.name
    }));
  } catch (error) {
    console.error('❌ Error fetching categories:', error.message);
    throw error;
  }
};

/**
 * Decode HTML entities in strings
 */
const decodeHTML = (html) => {
  const entities = {
    '&quot;': '"',
    '&#039;': "'",
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&apos;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"'
  };

  return html.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
};

/**
 * Shuffle array using Fisher-Yates algorithm
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Get error message from response code
 */
const getErrorMessage = (code) => {
  const messages = {
    1: 'No results - Not enough questions available',
    2: 'Invalid parameter',
    3: 'Token not found',
    4: 'Token empty'
  };
  return messages[code] || 'Unknown error';
};

module.exports = {
  fetchQuestions,
  fetchCategories
};
