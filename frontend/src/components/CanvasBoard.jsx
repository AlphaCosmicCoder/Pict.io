import React from 'react';
import { Trash2, Eraser, PenTool, PaintBucket } from 'lucide-react';
import { useCanvas } from '../hooks/useCanvas';

const COLORS = [
  '#000000', // Black
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
];

const SIZES = [2, 5, 10, 20];

export default function CanvasBoard({ roomId, isDrawer, socket }) {
  const {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    color,
    setColor,
    brushSize,
    setBrushSize,
    tool,
    setTool,
    clearCanvas,
    undo,
    redo
  } = useCanvas(isDrawer, socket, roomId);

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 bg-white cursor-crosshair relative touch-none">
        {/* Overlay when not drawer but game is in drawing phase */}
        {!isDrawer && (
          <div className="absolute inset-0 z-10 pointer-events-none" />
        )}
        
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full block"
        />
      </div>

      {isDrawer && (
        <div className="bg-slate-50 border-t border-slate-200 p-3 shrink-0 flex flex-wrap items-center justify-between gap-3 overflow-x-auto min-h-[64px]">
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full shadow-sm border-2 transition-transform hover:scale-110 shrink-0 ${
                  color === c ? 'border-slate-800 scale-110' : 'border-transparent'
                } ${c === '#ffffff' ? 'border-slate-300' : ''}`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 border-l border-slate-300 pl-4">
            <div className="flex gap-1">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setBrushSize(s)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                    brushSize === s ? 'bg-purple-100 text-purple-600' : 'text-slate-500 hover:bg-slate-200'
                  }`}
                  title={`Size ${s}`}
                >
                  <div className="bg-current rounded-full" style={{ width: s, height: s }} />
                </button>
              ))}
            </div>

            <div className="w-px h-8 bg-slate-300 mx-2" />

            <button
              onClick={() => { setTool('pen'); setColor('#ffffff'); }}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                color === '#ffffff' && tool === 'pen' ? 'bg-purple-100 text-purple-600' : 'text-slate-500 hover:bg-slate-200'
              }`}
              title="Eraser"
            >
              <Eraser size={20} />
            </button>
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                tool === 'pen' && color !== '#ffffff' ? 'bg-purple-100 text-purple-600' : 'text-slate-500 hover:bg-slate-200'
              }`}
              title="Pen"
            >
              <PenTool size={20} />
            </button>
            <button
              onClick={() => setTool('bucket')}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                tool === 'bucket' ? 'bg-purple-100 text-purple-600' : 'text-slate-500 hover:bg-slate-200'
              }`}
              title="Fill"
            >
              <PaintBucket size={20} />
            </button>
            <div className="w-px h-8 bg-slate-300 mx-1" />
            <button
              onClick={undo}
              className="p-2 text-slate-500 hover:bg-slate-200 rounded-xl transition-colors shrink-0 font-bold px-3 text-sm"
              title="Undo"
            >
              Undo
            </button>
            <button
              onClick={redo}
              className="p-2 text-slate-500 hover:bg-slate-200 rounded-xl transition-colors shrink-0 font-bold px-3 text-sm"
              title="Redo"
            >
              Redo
            </button>
            <button
              onClick={clearCanvas}
              className="p-2 px-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0 flex items-center gap-1 font-bold text-sm"
              title="Clear Canvas"
            >
              <Trash2 size={16} /> Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
