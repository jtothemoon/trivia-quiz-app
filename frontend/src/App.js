import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { connectSocket } from './services/socket';
import Home from './pages/Home';
import GameRoom from './pages/GameRoom';
import Rankings from './pages/Rankings';
import './App.css';

function App() {
  useEffect(() => {
    // Initialize socket connection on app load
    connectSocket();
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<GameRoom />} />
          <Route path="/rankings" element={<Rankings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
