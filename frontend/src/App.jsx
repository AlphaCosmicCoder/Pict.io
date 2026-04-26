import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import HomePage from './components/HomePage';
import GameRoom from './components/GameRoom';

function App() {
  const [playerName, setPlayerName] = useState('');

  return (
    <SocketProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-purple-300">
          <Routes>
            <Route 
              path="/" 
              element={<HomePage playerName={playerName} setPlayerName={setPlayerName} />} 
            />
            <Route 
              path="/room/:roomId" 
              element={<GameRoom playerName={playerName} />} 
            />
          </Routes>
        </div>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
