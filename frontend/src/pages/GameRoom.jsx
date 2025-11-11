import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getSocket } from '../services/socket';
import { SOCKET_EVENTS } from '../utils/constants';
import './GameRoom.css';

function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [room, setRoom] = useState(location.state?.room || null);
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, finished
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [scores, setScores] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [finalResult, setFinalResult] = useState(null);

  const socket = getSocket();
  const nickname = localStorage.getItem('nickname');

  useEffect(() => {
    if (!nickname) {
      navigate('/');
      return;
    }

    // Socket event listeners
    // Handle both room created (for host) and room joined (for other players)
    socket.on(SOCKET_EVENTS.ROOM_CREATED, (data) => {
      console.log('ROOM_CREATED received:', data);
      setRoom(data.room);
    });

    socket.on(SOCKET_EVENTS.ROOM_JOINED, (data) => {
      console.log('ROOM_JOINED received:', data);
      setRoom(data.room);
    });

    socket.on(SOCKET_EVENTS.ROOM_PLAYER_JOINED, (data) => {
      setRoom(prev => ({
        ...prev,
        players: { ...prev.players, [data.player.userId]: data.player }
      }));
    });

    socket.on(SOCKET_EVENTS.ROOM_PLAYER_LEFT, (data) => {
      setRoom(data.room);
    });

    socket.on(SOCKET_EVENTS.ROOM_READY_STATUS, (data) => {
      setRoom(prev => ({
        ...prev,
        players: {
          ...prev.players,
          [data.playerId]: {
            ...prev.players[data.playerId],
            isReady: data.isReady
          }
        }
      }));
    });

    socket.on(SOCKET_EVENTS.GAME_STARTED, (data) => {
      console.log('Game started:', data);
      setGameId(data.gameId);
      setGameState('playing');
      setCurrentQuestion(data.firstQuestion);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setTimeLeft(15);
      setSelectedAnswer(null);
    });

    socket.on(SOCKET_EVENTS.GAME_QUESTION, (data) => {
      setCurrentQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTimeLeft(15);
      setSelectedAnswer(null);
    });

    socket.on(SOCKET_EVENTS.GAME_ANSWER_RESULT, (data) => {
      setMyScore(data.totalScore);
    });

    socket.on(SOCKET_EVENTS.GAME_SCORES, (data) => {
      setScores(data.scores);
    });

    socket.on(SOCKET_EVENTS.GAME_FINISHED, (data) => {
      setGameState('finished');
      setFinalResult(data);
    });

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_CREATED);
      socket.off(SOCKET_EVENTS.ROOM_JOINED);
      socket.off(SOCKET_EVENTS.ROOM_PLAYER_JOINED);
      socket.off(SOCKET_EVENTS.ROOM_PLAYER_LEFT);
      socket.off(SOCKET_EVENTS.ROOM_READY_STATUS);
      socket.off(SOCKET_EVENTS.GAME_STARTED);
      socket.off(SOCKET_EVENTS.GAME_QUESTION);
      socket.off(SOCKET_EVENTS.GAME_ANSWER_RESULT);
      socket.off(SOCKET_EVENTS.GAME_SCORES);
      socket.off(SOCKET_EVENTS.GAME_FINISHED);
    };
  }, [socket, navigate, nickname]);

  // Timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !selectedAnswer) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, timeLeft, selectedAnswer]);

  const handleReady = () => {
    const isReady = !room.players[socket.id]?.isReady;
    socket.emit(SOCKET_EVENTS.ROOM_READY, { roomId, isReady });
  };

  const handleStartGame = () => {
    socket.emit(SOCKET_EVENTS.GAME_START, { roomId });
  };

  const handleAnswer = (answer) => {
    if (selectedAnswer) return;

    setSelectedAnswer(answer);
    const timeSpent = 15 - timeLeft;

    socket.emit(SOCKET_EVENTS.GAME_ANSWER, {
      gameId,
      answer,
      timeSpent
    });
  };

  const handleNextQuestion = () => {
    socket.emit(SOCKET_EVENTS.GAME_NEXT, { gameId });
  };

  const handleLeaveRoom = () => {
    socket.emit(SOCKET_EVENTS.ROOM_LEAVE, { roomId });
    navigate('/');
  };

  // Waiting Room UI
  if (gameState === 'waiting' && room) {
    const isHost = room.hostId === socket.id;
    const allReady = Object.values(room.players).every(p => p.isReady);
    const canStart = isHost && Object.keys(room.players).length >= 2 && allReady;

    return (
      <div className="game-room">
        <div className="room-header">
          <h2>Room: {roomId}</h2>
          <p>Category: {room.category} | Difficulty: {room.difficulty}</p>
        </div>

        <div className="players-list">
          <h3>Players ({Object.keys(room.players).length}/{room.maxPlayers})</h3>
          {Object.values(room.players).map(player => (
            <div key={player.userId} className="player-item">
              <span>{player.nickname}</span>
              <span>{player.isReady ? '✅ Ready' : '⏳ Not Ready'}</span>
            </div>
          ))}
        </div>

        <div className="room-actions">
          <button onClick={handleReady}>
            {room.players[socket.id]?.isReady ? 'Cancel Ready' : 'Ready'}
          </button>
          {isHost && (
            <button onClick={handleStartGame} disabled={!canStart}>
              Start Game
            </button>
          )}
          <button onClick={handleLeaveRoom} className="leave-btn">
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  // Game Playing UI
  if (gameState === 'playing' && currentQuestion) {
    return (
      <div className="game-room playing">
        <div className="game-header">
          <div>Question {questionNumber}/{totalQuestions}</div>
          <div>Time: {timeLeft}s</div>
          <div>Score: {myScore}</div>
        </div>

        <div className="question-section">
          <p className="question-text">{currentQuestion.question}</p>
        </div>

        <div className="answers-grid">
          {currentQuestion.allAnswers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(answer)}
              disabled={selectedAnswer !== null}
              className={selectedAnswer === answer ? 'selected' : ''}
            >
              {answer}
            </button>
          ))}
        </div>

        {selectedAnswer && (
          <div className="waiting-section">
            <p>Waiting for other players...</p>
          </div>
        )}

        <div className="scores-section">
          <h4>Current Scores</h4>
          {scores.map((s, i) => (
            <div key={s.userId}>
              {i + 1}. {s.nickname}: {s.score}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Game Finished UI
  if (gameState === 'finished' && finalResult) {
    return (
      <div className="game-room finished">
        <h2>Game Over!</h2>

        <div className="final-scores">
          <h3>Final Rankings</h3>
          {finalResult.finalScores.map((player, index) => (
            <div key={player.userId} className="final-score-item">
              <span className="rank">#{index + 1}</span>
              <span className="nickname">{player.nickname}</span>
              <span className="score">{player.score} pts</span>
              <span className="correct">{player.correctAnswers}/{player.totalQuestions}</span>
            </div>
          ))}
        </div>

        <button onClick={handleLeaveRoom}>Back to Home</button>
      </div>
    );
  }

  return <div className="game-room loading">Loading room...</div>;
}

export default GameRoom;
