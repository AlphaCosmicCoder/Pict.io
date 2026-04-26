import React from 'react';
import { Pencil } from 'lucide-react';

export default function ScoreBoard({ players, drawerId }) {
  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex lg:flex-col h-full w-full">
      <div className="bg-slate-50 border-r lg:border-r-0 lg:border-b border-slate-200 p-2 lg:p-4 shrink-0 flex items-center justify-center">
        <h3 className="font-bold text-slate-800 text-center lg:block hidden">Leaderboard</h3>
        <h3 className="font-bold text-slate-800 text-center lg:hidden">Scores</h3>
      </div>
      
      <div className="flex-1 overflow-x-auto lg:overflow-y-auto p-2 lg:p-3 flex flex-row lg:flex-col gap-2">
        {sortedPlayers.map((p, index) => {
          const isDrawer = p.id === drawerId;
          
          return (
            <div 
              key={p.id} 
              className={`relative flex items-center p-2 lg:p-3 min-w-[140px] lg:min-w-0 shrink-0 rounded-2xl border transition-all ${
                index === 0 ? 'bg-yellow-50 border-yellow-200' : 
                index === 1 ? 'bg-slate-50 border-slate-200' :
                index === 2 ? 'bg-orange-50 border-orange-200' :
                'bg-white border-slate-100'
              }`}
            >
              <div className="font-bold text-slate-400 w-6 text-sm">#{index + 1}</div>
              
              <div className="flex-1 min-w-0 pr-2 flex items-center gap-2">
                <span className="text-xl shrink-0">{p.avatar || '👤'}</span>
                <div>
                  <div className="font-bold text-slate-700 truncate">{p.name}</div>
                  <div className="text-sm font-semibold text-purple-600">{p.score} pts</div>
                </div>
              </div>
              
              {isDrawer && (
                <div className="bg-purple-100 text-purple-600 p-2 rounded-full absolute -top-2 -right-2 shadow-sm animate-bounce">
                  <Pencil size={14} fill="currentColor" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
