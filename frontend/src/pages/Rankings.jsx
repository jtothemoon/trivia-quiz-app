import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rankingAPI } from '../services/api';
import './Rankings.css';

function Rankings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overall'); // overall, weekly
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRankings();
  }, [activeTab]);

  const fetchRankings = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      if (activeTab === 'overall') {
        response = await rankingAPI.getOverallRanking();
      } else if (activeTab === 'weekly') {
        response = await rankingAPI.getWeeklyRanking();
      }

      // Convert object to array
      const rankingsData = response?.data || {};
      const rankingsArray = Object.entries(rankingsData).map(([key, userRanking]) => ({
        ...userRanking
      })).sort((a, b) => b.score - a.score);

      setRankings(rankingsArray);
    } catch (err) {
      console.error('Error fetching rankings:', err);
      setError('Failed to load rankings');
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rankings">
      <div className="rankings-header">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back
        </button>
        <h1>Rankings</h1>
      </div>

      <div className="tabs">
        <button
          className={activeTab === 'overall' ? 'active' : ''}
          onClick={() => setActiveTab('overall')}
        >
          Overall
        </button>
        <button
          className={activeTab === 'weekly' ? 'active' : ''}
          onClick={() => setActiveTab('weekly')}
        >
          Weekly
        </button>
      </div>

      <div className="rankings-content">
        {loading && <div className="loading">Loading rankings...</div>}

        {error && <div className="error">{error}</div>}

        {!loading && !error && rankings.length === 0 && (
          <div className="empty">No rankings yet. Be the first to play!</div>
        )}

        {!loading && !error && rankings.length > 0 && (
          <div className="rankings-list">
            {rankings.map((user, index) => (
              <div key={index} className="ranking-item">
                <span className="rank">#{index + 1}</span>
                <span className="nickname">{user.nickname}</span>
                <span className="score">{user.score} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Rankings;
