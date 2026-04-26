import React, { useState, useEffect } from 'react';
import { Copy, Users, Play, Crown, Settings } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Lobby({ roomId, players, isHost, onStartGame }) {
  const socket = useSocket();
  const shareLink = `${window.location.origin}/?room=${roomId}`;
  const [settings, setSettings] = useState({
    maxRounds: 3,
    maxPlayers: 8,
    drawTime: 80,
    customWords: '',
    useCustomWordsOnly: false
  });

  useEffect(() => {
    if (!socket) return;
    socket.on('settings_updated', (newSettings) => {
      setSettings({
        ...newSettings,
        customWords: Array.isArray(newSettings.customWords) ? newSettings.customWords.join(', ') : newSettings.customWords
      });
    });
    return () => socket.off('settings_updated');
  }, [socket]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(shareLink);
    // Could add a toast here
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 p-8 text-center text-white relative">
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <Users />
            Waiting Lobby
          </h2>
          <p className="text-purple-200">Waiting for players to join...</p>
          
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 border border-slate-100 whitespace-nowrap">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-sm hidden sm:inline">Share Link</span>
            <span className="text-xl font-black text-slate-800 tracking-widest">{roomId}</span>
            <button 
              onClick={copyRoomCode}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-purple-600"
              title="Copy Share Link"
            >
              <Copy size={20} />
            </button>
          </div>
        </div>

        {isHost && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="text-slate-500" />
              <h3 className="font-bold text-slate-800 text-lg">Room Settings</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Rounds</label>
                <select 
                  value={settings.maxRounds} 
                  onChange={(e) => {
                    const newSettings = { ...settings, maxRounds: parseInt(e.target.value) };
                    setSettings(newSettings);
                    socket.emit('update_settings', { roomId, settings: newSettings });
                  }}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none"
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Draw Time</label>
                <select 
                  value={settings.drawTime} 
                  onChange={(e) => {
                    const newSettings = { ...settings, drawTime: parseInt(e.target.value) };
                    setSettings(newSettings);
                    socket.emit('update_settings', { roomId, settings: newSettings });
                  }}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none"
                >
                  <option value={30}>30</option>
                  <option value={45}>45</option>
                  <option value={60}>60</option>
                  <option value={80}>80</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Max Players</label>
                <select 
                  value={settings.maxPlayers} 
                  onChange={(e) => {
                    const newSettings = { ...settings, maxPlayers: parseInt(e.target.value) };
                    setSettings(newSettings);
                    socket.emit('update_settings', { roomId, settings: newSettings });
                  }}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none"
                >
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-bold text-slate-700">Custom Words</label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input 
                      type="checkbox" 
                      checked={settings.useCustomWordsOnly}
                      onChange={(e) => {
                        const newSettings = { ...settings, useCustomWordsOnly: e.target.checked };
                        setSettings(newSettings);
                        socket.emit('update_settings', { roomId, settings: newSettings });
                      }}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    Use custom words only
                  </label>
                </div>
                <textarea
                  value={settings.customWords}
                  onChange={(e) => {
                    const newSettings = { ...settings, customWords: e.target.value };
                    setSettings(newSettings);
                  }}
                  onBlur={() => socket.emit('update_settings', { roomId, settings })}
                  placeholder="Minimum 10 words, separated by commas"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none resize-none h-24"
                />
              </div>
            </div>
          </div>
        )}

        {/* Player List */}
        <div className="p-8 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Players ({players.length})</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold shadow-sm">
                  {p.avatar ? p.avatar : p.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-slate-700">{p.name}</span>
                {i === 0 && <Crown size={16} className="text-yellow-500 ml-auto" />}
              </div>
            ))}
            
            {/* Empty slots placeholders */}
            {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-200 rounded-2xl opacity-50">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                  <div className="w-4 h-4 bg-slate-300 rounded-full"></div>
                </div>
                <span className="font-medium text-slate-400">Waiting...</span>
              </div>
            ))}
          </div>

          {/* Host Controls */}
          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={players.length < 2}
              className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg transition-all shadow-lg hover:shadow-purple-500/30 active:scale-95 flex justify-center items-center gap-2"
            >
              <Play fill="currentColor" size={20} />
              {players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
            </button>
          ) : (
            <div className="w-full py-4 text-center rounded-xl bg-slate-100 text-slate-500 font-semibold flex justify-center items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
              Waiting for host to start...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
