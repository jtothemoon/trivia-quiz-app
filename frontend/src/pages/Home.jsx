import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../services/socket';
import { CATEGORIES, DIFFICULTIES, SOCKET_EVENTS } from '../utils/constants';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [hasNickname, setHasNickname] = useState(!!localStorage.getItem('nickname'));
  const [nickname, setNickname] = useState('');
  const [isChangingNickname, setIsChangingNickname] = useState(false);
  const [activeTab, setActiveTab] = useState('create'); // create, rooms, rankings
  const [category, setCategory] = useState('9');
  const [difficulty, setDifficulty] = useState('medium');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [publicRooms, setPublicRooms] = useState([]);
  const [topRankings, setTopRankings] = useState([]);

  useEffect(() => {
    // Fetch public rooms when on rooms tab
    if (activeTab === 'rooms') {
      fetchPublicRooms();

      // Auto refresh every 3 seconds
      const interval = setInterval(fetchPublicRooms, 3000);
      return () => clearInterval(interval);
    }

    // Fetch top rankings when on rankings tab
    if (activeTab === 'rankings') {
      fetchTopRankings();
    }
  }, [activeTab]);

  const fetchPublicRooms = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/rooms`);
      const data = await response.json();

      if (data.success) {
        setPublicRooms(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setPublicRooms([]);
    }
  };

  const fetchTopRankings = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/rankings/overall`);
      const data = await response.json();

      if (data.success) {
        // Convert object to array and sort by score
        const rankingsArray = Object.values(data.data)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Top 10
        setTopRankings(rankingsArray);
      }
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
      setTopRankings([]);
    }
  };

  const handleNicknameSubmit = () => {
    if (!nickname.trim()) {
      alert('Please enter your nickname');
      return;
    }

    if (nickname.length < 2 || nickname.length > 20) {
      alert('Nickname must be 2-20 characters');
      return;
    }

    localStorage.setItem('nickname', nickname.trim());
    setHasNickname(true);
    setIsChangingNickname(false);
    setNickname('');
  };

  const handleChangeNickname = () => {
    setIsChangingNickname(true);
    setHasNickname(false);
    setNickname('');
  };

  const handleCancelChange = () => {
    setIsChangingNickname(false);
    setHasNickname(true);
    setNickname('');
  };

  const handleCreateRoom = () => {
    const storedNickname = localStorage.getItem('nickname');
    setIsCreatingRoom(true);

    const socket = getSocket();

    socket.emit('room:create', {
      nickname: storedNickname,
      category: parseInt(category),
      difficulty,
      isPrivate: false,
      maxPlayers: 4
    });

    socket.once('room:created', (data) => {
      setIsCreatingRoom(false);
      navigate(`/room/${data.roomId}`, { state: { room: data.room } });
    });

    socket.once('error', (error) => {
      setIsCreatingRoom(false);
      alert(error.message || 'Failed to create room');
    });
  };

  const handleJoinRoom = (roomId) => {
    const storedNickname = localStorage.getItem('nickname');
    const socket = getSocket();

    socket.emit(SOCKET_EVENTS.ROOM_JOIN, {
      roomId,
      nickname: storedNickname
    });

    socket.once(SOCKET_EVENTS.ROOM_JOINED, (data) => {
      navigate(`/room/${roomId}`, { state: { room: data.room } });
    });

    socket.once('error', (error) => {
      alert(error.message || 'Failed to join room');
    });
  };

  // Show nickname input screen if no nickname
  if (!hasNickname) {
    return (
      <div className="home">
        <div className="home-container">
          <header className="home-header">
            {isChangingNickname && (
              <button className="back-btn" onClick={handleCancelChange}>
                ← Back
              </button>
            )}
            <h1>🎯 Trivia Quiz</h1>
            <p>Challenge your friends!</p>
          </header>

          <div className="nickname-setup">
            <h2>{isChangingNickname ? 'Change Your Nickname' : 'Enter Your Nickname'}</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter nickname (2-20 chars)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNicknameSubmit()}
                maxLength={20}
                autoFocus
              />
            </div>
            <button
              className="create-room-btn"
              onClick={handleNicknameSubmit}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main screen with tabs
  return (
    <div className="home">
      <div className="home-container">
        <header className="home-header">
          <h1>🎯 Trivia Quiz</h1>
          <div className="nickname-display">
            <span>Welcome, {localStorage.getItem('nickname')}!</span>
            <button className="change-nickname-btn" onClick={handleChangeNickname}>
              Change
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={activeTab === 'create' ? 'active' : ''}
            onClick={() => setActiveTab('create')}
          >
            방 만들기
          </button>
          <button
            className={activeTab === 'rooms' ? 'active' : ''}
            onClick={() => setActiveTab('rooms')}
          >
            공개방 목록
          </button>
          <button
            className={activeTab === 'rankings' ? 'active' : ''}
            onClick={() => setActiveTab('rankings')}
          >
            랭킹
          </button>
        </div>

        {/* Create Room Tab */}
        {activeTab === 'create' && (
          <div className="tab-content">
            <div className="home-form">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isCreatingRoom}
                >
                  {Object.entries(CATEGORIES).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Difficulty</label>
                <div className="difficulty-buttons">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff}
                      className={`difficulty-btn ${difficulty === diff ? 'active' : ''}`}
                      onClick={() => setDifficulty(diff)}
                      disabled={isCreatingRoom}
                    >
                      {diff.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="create-room-btn"
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
              >
                {isCreatingRoom ? 'Creating...' : '🎮 Create Room'}
              </button>
            </div>
          </div>
        )}

        {/* Public Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="tab-content">
            <div className="rooms-list">
              {publicRooms.length === 0 ? (
                <div className="empty-rooms">
                  <p>No public rooms available</p>
                  <p>Create a room to start playing!</p>
                </div>
              ) : (
                publicRooms.map((room) => (
                  <div key={room.roomId} className="room-item">
                    <div className="room-info">
                      <div className="room-name">{room.roomId}</div>
                      <div className="room-details">
                        {CATEGORIES[room.category]} • {room.difficulty}
                      </div>
                      <div className="room-players">
                        {room.playerCount}/{room.maxPlayers} players
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room.roomId)}
                      disabled={room.playerCount >= room.maxPlayers}
                    >
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Rankings Tab */}
        {activeTab === 'rankings' && (
          <div className="tab-content">
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Top 10 Overall</h3>
            {topRankings.length === 0 ? (
              <div className="empty-rooms">
                <p>No rankings yet</p>
                <p>Play games to get on the leaderboard!</p>
              </div>
            ) : (
              <div className="rankings-preview">
                {topRankings.map((user, index) => (
                  <div key={index} className="ranking-item">
                    <span className="rank">#{index + 1}</span>
                    <span className="nickname">{user.nickname}</span>
                    <span className="score">{user.score} pts</span>
                  </div>
                ))}
              </div>
            )}
            <button
              className="secondary-btn"
              onClick={() => navigate('/rankings')}
              style={{ marginTop: '16px' }}
            >
              See All Rankings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
