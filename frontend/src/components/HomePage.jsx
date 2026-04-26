import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Palette, Play, Users } from 'lucide-react';

const AVATARS = ['👤', '🐶', '🐱', '🦊', '🐼', '🐯', '🦁', '🐸', '🐵', '🐰', '🦄', '🤖', '👽', '👻', '🤡'];

export default function HomePage({ playerName, setPlayerName }) {
  const socket = useSocket();
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomIdInput(roomParam.toUpperCase());
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('room_joined', ({ roomId }) => {
      navigate(`/room/${roomId}`);
    });

    socket.on('error', ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off('room_joined');
      socket.off('error');
    };
  }, [socket, navigate]);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError("Please enter a nickname first.");
      return;
    }
    socket.emit('create_room', { playerName, avatar: selectedAvatar });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError("Please enter a nickname first.");
      return;
    }
    if (!roomIdInput.trim()) {
      setError("Please enter a Room Code.");
      return;
    }
    socket.emit('join_room', { roomId: roomIdInput.toUpperCase(), playerName, avatar: selectedAvatar });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="text-center mb-10 transform hover:scale-105 transition-transform duration-300">
        <h1 className="md:text-6xl text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-4 flex items-center justify-center gap-4">
          <Palette className="w-12 h-12 w-6 h-6 text-purple-600" />
          Pict.io
        </h1>
        <p className="text-xl text-slate-600 font-medium">Draw, Guess, and Win!</p>
      </div>

      <div className="w-full max-w-md p-8 rounded-3xl glass-panel relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 space-y-6">
          {error && (
            <div className="p-3 bg-rose-100 text-rose-700 rounded-xl text-sm font-medium text-center animate-bounce">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Choose your Nickname</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Picasso"
              className="w-full px-4 py-3 rounded-xl border-2 border-transparent bg-white/50 focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 transition-all outline-none text-lg font-medium shadow-sm"
              maxLength={15}
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Choose Avatar</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {AVATARS.map(avatar => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`text-3xl p-2 rounded-2xl transition-all shrink-0 ${selectedAvatar === avatar ? 'bg-purple-100 ring-2 ring-purple-500 scale-110 shadow-sm' : 'hover:bg-slate-100 grayscale hover:grayscale-0'}`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleCreateRoom}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg transition-all shadow-lg hover:shadow-purple-500/30 active:scale-95"
            >
              <Play fill="currentColor" size={20} />
              Create Private Room
            </button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-300/50"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-semibold uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-slate-300/50"></div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="block text-sm font-semibold text-slate-700">Have a Room Code?</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                placeholder="Enter Code"
                className="flex-grow min-w-0 px-4 py-3 rounded-xl border-2 border-transparent bg-white/50 focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20 transition-all outline-none text-lg font-bold tracking-widest uppercase shadow-sm text-center sm:text-left"
                maxLength={6}
              />
              <button
                onClick={handleJoinRoom}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold transition-all shadow-lg hover:shadow-pink-500/30 active:scale-95 whitespace-nowrap"
              >
                <Users size={20} />
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
