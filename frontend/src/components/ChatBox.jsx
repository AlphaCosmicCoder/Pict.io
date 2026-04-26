import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

export default function ChatBox({ roomId, playerName, socket, disabled }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat_message', (msg) => {
      setMessages((prev) => [...prev, { ...msg, type: 'chat' }]);
    });

    socket.on('correct_guess', (msg) => {
      setMessages((prev) => [...prev, { ...msg, type: 'system-success' }]);
    });

    socket.on('close_guess', (msg) => {
      setMessages((prev) => [...prev, { ...msg, type: 'system-close' }]);
    });

    socket.on('system_message', (msg) => {
      setMessages((prev) => [...prev, { ...msg, type: 'system-info' }]);
    });

    return () => {
      socket.off('chat_message');
      socket.off('correct_guess');
      socket.off('close_guess');
      socket.off('system_message');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    socket.emit('send_message', { roomId, playerName, message: input.trim() });
    setInput('');
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0">
        <h3 className="font-bold text-slate-800 text-center">Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`text-sm p-3 rounded-2xl ${
              msg.type === 'system-success' 
                ? 'bg-green-100 text-green-800 font-bold border border-green-200'
                : msg.type === 'system-close'
                ? 'bg-yellow-100 text-yellow-800 font-bold border border-yellow-200'
                : msg.type === 'system-info'
                ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200 text-center'
                : 'bg-white border border-slate-200'
            }`}
          >
            {msg.type === 'chat' && (
              <span className="font-bold text-slate-700 mr-2">{msg.playerName}:</span>
            )}
            <span className={msg.type === 'chat' ? 'text-slate-600' : ''}>{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            placeholder={disabled ? "You can't type right now" : "Type your guess..."}
            className="flex-1 px-4 py-2 rounded-xl bg-slate-100 border-transparent focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all outline-none text-sm disabled:opacity-50"
            maxLength={100}
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
