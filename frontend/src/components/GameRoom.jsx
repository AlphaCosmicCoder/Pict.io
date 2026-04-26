import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import Lobby from './Lobby';
import CanvasBoard from './CanvasBoard';
import ChatBox from './ChatBox';
import ScoreBoard from './ScoreBoard';
import { Clock, Trophy, Medal, Award } from 'lucide-react';

export default function GameRoom({ playerName }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState('lobby'); // lobby, choosing, drawing, round_over, ended
  const [timer, setTimer] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(3);
  const [wordChoices, setWordChoices] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [hiddenWord, setHiddenWord] = useState('');
  const [drawerInfo, setDrawerInfo] = useState(null); // { id, name }

  useEffect(() => {
    if (!socket) return;
    if (!playerName) {
      // If refreshed or no name, go back to home
      navigate('/');
      return;
    }

    // Fetch initial state just in case we missed it
    socket.emit('get_room_state', { roomId });

    // Socket Event Listeners
    socket.on('sync_room_state', (state) => {
      setPlayers(state.players);
      setGameState(state.status);
      setCurrentRound(state.round);
      setMaxRounds(state.maxRounds);
      setTimer(state.timeLeft);
      if (state.drawerInfo) {
        setDrawerInfo(state.drawerInfo);
      }
      if (state.hiddenWord) {
        setHiddenWord(state.hiddenWord);
      }
    });

    socket.on('player_list_update', ({ players }) => setPlayers(players));
    
    socket.on('game_started', () => {
      setGameState('playing');
    });

    socket.on('turn_started', ({ drawerId, drawerName, round, maxRounds }) => {
      setGameState('choosing');
      setDrawerInfo({ id: drawerId, name: drawerName });
      setCurrentRound(round);
      setMaxRounds(maxRounds);
      setCurrentWord('');
      setHiddenWord('');
      setWordChoices([]);
    });

    socket.on('choose_word', ({ words }) => {
      setWordChoices(words);
    });

    socket.on('timer_update', ({ timeLeft, phase }) => {
      setTimer(timeLeft);
      if (gameState !== phase) setGameState(phase);
    });

    socket.on('word_selected', ({ hiddenWord }) => {
      setGameState('drawing');
      setHiddenWord(hiddenWord);
    });

    socket.on('drawer_word_selected', ({ word }) => {
      setCurrentWord(word);
    });

    socket.on('round_ended', ({ word, players }) => {
      setGameState('round_over');
      setCurrentWord(word);
      setPlayers(players); // Update scores
    });

    socket.on('game_ended', ({ players }) => {
      setGameState('ended');
      setPlayers(players);
    });

    return () => {
      socket.off('player_list_update');
      socket.off('game_started');
      socket.off('turn_started');
      socket.off('choose_word');
      socket.off('timer_update');
      socket.off('word_selected');
      socket.off('drawer_word_selected');
      socket.off('round_ended');
      socket.off('game_ended');
      socket.off('sync_room_state');
    };
  }, [socket, playerName, navigate]);

  const isHost = players.length > 0 && players[0].id === socket?.id;
  const isDrawer = drawerInfo?.id === socket?.id;

  const handleStartGame = () => {
    socket.emit('start_game', { roomId });
  };

  const handleChooseWord = (word) => {
    socket.emit('word_chosen', { roomId, word });
    setCurrentWord(word);
  };

  if (gameState === 'lobby') {
    return (
      <Lobby 
        roomId={roomId} 
        players={players} 
        isHost={isHost} 
        onStartGame={handleStartGame} 
      />
    );
  }

  if (gameState === 'ended') {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const second = sortedPlayers[1];
    const third = sortedPlayers[2];
    const rest = sortedPlayers.slice(3);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-pink-100 p-4">
        <div className="bg-white p-6 lg:p-10 rounded-3xl shadow-2xl text-center max-w-2xl w-full">
          <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-8">Game Over!</h1>
          
          {/* Podium */}
          <div className="flex justify-center items-end gap-2 lg:gap-6 mb-12 h-48 lg:h-56">
            {/* 2nd Place */}
            {second && (
              <div className="flex flex-col items-center flex-1">
                <Medal className="text-slate-400 w-10 h-10 mb-2" />
                <span className="font-bold text-slate-700 truncate w-20 lg:w-24 text-sm lg:text-base">{second.name}</span>
                <span className="text-purple-600 font-black mb-2 text-sm lg:text-base">{second.score} pts</span>
                <div className="w-full bg-slate-200 h-24 rounded-t-xl flex items-start justify-center pt-2">
                  <span className="text-2xl font-black text-slate-400">2</span>
                </div>
              </div>
            )}
            
            {/* 1st Place */}
            {winner && (
              <div className="flex flex-col items-center flex-1 -mt-8">
                <Trophy className="text-yellow-400 w-14 h-14 mb-2 animate-bounce" />
                <span className="font-bold text-slate-800 text-base lg:text-lg truncate w-20 lg:w-24">{winner.name}</span>
                <span className="text-pink-600 font-black text-lg lg:text-xl mb-2">{winner.score} pts</span>
                <div className="w-full bg-yellow-100 border-2 border-yellow-300 h-32 rounded-t-xl flex items-start justify-center pt-2 shadow-inner">
                  <span className="text-4xl font-black text-yellow-500">1</span>
                </div>
              </div>
            )}
            
            {/* 3rd Place */}
            {third && (
              <div className="flex flex-col items-center flex-1">
                <Award className="text-amber-600 w-10 h-10 mb-2" />
                <span className="font-bold text-slate-700 truncate w-20 lg:w-24 text-sm lg:text-base">{third.name}</span>
                <span className="text-purple-600 font-black mb-2 text-sm lg:text-base">{third.score} pts</span>
                <div className="w-full bg-amber-100/50 h-20 rounded-t-xl flex items-start justify-center pt-2">
                  <span className="text-2xl font-black text-amber-700/50">3</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Rest of players */}
          {rest.length > 0 && (
            <div className="space-y-3 mb-8 text-left bg-slate-50 p-4 rounded-2xl max-h-48 overflow-y-auto">
              {rest.map((p, i) => (
                <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <span className="font-bold text-slate-600">#{i + 4} {p.name}</span>
                  <span className="font-bold text-slate-500">{p.score} pts</span>
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold text-xl hover:opacity-90 transition shadow-lg active:scale-95"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Navigation / Status Bar */}
      <div className="h-auto lg:h-16 py-2 lg:py-0 bg-white border-b border-slate-200 flex flex-col lg:flex-row items-center justify-between px-4 lg:px-6 shadow-sm shrink-0 gap-2 lg:gap-0">
        <div className="flex items-center gap-2 lg:gap-4 w-full lg:w-auto justify-between lg:justify-start">
          <div className="text-xl lg:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
            Pict.io
          </div>
          <div className="flex items-center gap-2 bg-pink-50 px-3 py-1 lg:px-4 lg:py-2 rounded-2xl text-pink-600 font-bold text-lg lg:text-xl lg:hidden">
            <Clock size={20} />
            <span className="w-6 text-center">{timer}</span>
          </div>
        </div>
        
        <div className="flex-1 flex justify-center items-center w-full">
          {gameState === 'choosing' && isDrawer && (
            <span className="text-base lg:text-lg font-bold text-purple-600 animate-pulse">Choose a word!</span>
          )}
          {gameState === 'choosing' && !isDrawer && (
            <span className="text-base lg:text-lg font-medium text-slate-600">{drawerInfo?.name} is choosing...</span>
          )}
          {gameState === 'drawing' && !isDrawer && (
            <div className="flex gap-1 lg:gap-2 text-xl lg:text-2xl font-mono font-bold tracking-widest text-slate-800">
              {hiddenWord.split('').map((char, i) => (
                <span key={i} className="border-b-4 border-slate-800 pb-1 w-4 lg:w-6 text-center inline-block">
                  {char === '_' ? '' : char}
                </span>
              ))}
            </div>
          )}
          {gameState === 'drawing' && isDrawer && (
            <span className="text-xl lg:text-2xl font-bold text-slate-800 tracking-wider">
              Draw: <span className="text-purple-600 uppercase">{currentWord}</span>
            </span>
          )}
          {gameState === 'round_over' && (
            <span className="text-lg lg:text-xl font-bold text-slate-700">
              The word was <span className="text-green-500 uppercase">{currentWord}</span>!
            </span>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-pink-50 px-4 py-2 rounded-2xl text-pink-600 font-bold text-xl">
          <Clock size={24} />
          <span className="w-8 text-center">{timer}</span>
        </div>
        
        <div className="px-3 py-1 bg-slate-100 rounded-full text-xs lg:text-sm font-semibold text-slate-500 lg:ml-4">
          Round {currentRound}/{maxRounds}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-2 lg:p-4 gap-2 lg:gap-4">
        {/* Top/Left Sidebar: Scoreboard */}
        <div className="w-full lg:w-64 h-auto lg:h-full flex shrink-0 lg:shrink">
          <ScoreBoard players={players} drawerId={drawerInfo?.id} />
        </div>

        {/* Center: Canvas Area */}
        <div className="flex-1 min-h-[300px] bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col">
          {gameState === 'choosing' && isDrawer && (
            <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 lg:p-8 text-center">
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-6 lg:mb-8">Choose a word to draw</h2>
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                {wordChoices.map((word) => (
                  <button
                    key={word}
                    onClick={() => handleChooseWord(word)}
                    className="px-6 py-3 lg:px-8 lg:py-4 bg-purple-100 hover:bg-purple-600 hover:text-white text-purple-700 font-bold text-lg lg:text-xl rounded-2xl transition-all shadow-sm hover:shadow-lg transform hover:-translate-y-1"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}

          <CanvasBoard roomId={roomId} isDrawer={isDrawer && gameState === 'drawing'} socket={socket} />
        </div>

        {/* Bottom/Right Sidebar: Chat */}
        <div className="w-full lg:w-80 h-64 lg:h-full flex flex-col shrink-0 lg:shrink">
          <ChatBox 
            roomId={roomId} 
            playerName={playerName} 
            socket={socket} 
            disabled={gameState !== 'drawing' || (isDrawer && gameState === 'drawing')}
          />
        </div>
      </div>
    </div>
  );
}
