import { useRef, useEffect, useState } from 'react';

const hexToRgba = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return [r, g, b, 255];
};

const getPixel = (data, x, y, w) => {
  const i = (y * w + x) * 4;
  return [data[i], data[i+1], data[i+2], data[i+3]];
};

const setPixel = (data, x, y, w, color) => {
  const i = (y * w + x) * 4;
  data[i] = color[0];
  data[i+1] = color[1];
  data[i+2] = color[2];
  data[i+3] = color[3];
};

const colorsMatch = (a, b) => {
  return Math.abs(a[0] - b[0]) < 15 && Math.abs(a[1] - b[1]) < 15 && Math.abs(a[2] - b[2]) < 15;
};

const doFloodFill = (ctx, startX, startY, fillColorHex) => {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  
  const targetColor = getPixel(data, startX, startY, w);
  const fillColor = hexToRgba(fillColorHex);
  
  if (colorsMatch(targetColor, fillColor)) return;
  
  const stack = [[startX, startY]];
  
  while(stack.length) {
    let [x, y] = stack.pop();
    let currentPos = (y * w + x) * 4;
    
    while(y >= 0 && colorsMatch(getPixel(data, x, y, w), targetColor)) {
      y--;
    }
    y++;
    
    let reachLeft = false;
    let reachRight = false;
    
    while(y < h && colorsMatch(getPixel(data, x, y, w), targetColor)) {
      setPixel(data, x, y, w, fillColor);
      
      if (x > 0) {
        if (colorsMatch(getPixel(data, x - 1, y, w), targetColor)) {
          if (!reachLeft) { stack.push([x - 1, y]); reachLeft = true; }
        } else if (reachLeft) { reachLeft = false; }
      }
      
      if (x < w - 1) {
        if (colorsMatch(getPixel(data, x + 1, y, w), targetColor)) {
          if (!reachRight) { stack.push([x + 1, y]); reachRight = true; }
        } else if (reachRight) { reachRight = false; }
      }
      y++;
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

export function useCanvas(isDrawer, socket, roomId) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('pen'); // 'pen' or 'bucket'
  
  // Undo/Redo state
  const pathsHistory = useRef([]);
  const redoHistory = useRef([]);
  const currentX = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set fixed internal resolution for consistency
    canvas.width = 800;
    canvas.height = 600;

    // Initial canvas settings
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // Update context when color or size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
  }, [color, brushSize]);

  const redrawAll = (paths) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const w = canvas.width;
    const h = canvas.height;

    paths.forEach(path => {
      path.forEach(segment => {
        if (segment.type === 'fill') {
          doFloodFill(ctx, Math.floor(segment.x * w), Math.floor(segment.y * h), segment.color);
        } else {
          ctx.beginPath();
          ctx.moveTo(segment.x0 * w, segment.y0 * h);
          ctx.lineTo(segment.x1 * w, segment.y1 * h);
          ctx.strokeStyle = segment.color;
          ctx.lineWidth = segment.size;
          ctx.stroke();
          ctx.closePath();
        }
      });
    });

    // Restore current local settings
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('drawing_data', (data) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const w = canvas.width;
      const h = canvas.height;

      if (data.type === 'fill') {
        doFloodFill(ctx, Math.floor(data.x * w), Math.floor(data.y * h), data.color);
      } else {
        ctx.beginPath();
        ctx.moveTo(data.x0 * w, data.y0 * h);
        ctx.lineTo(data.x1 * w, data.y1 * h);
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.size;
        ctx.stroke();
        ctx.closePath();
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    });

    socket.on('sync_room_state', (state) => {
      if (state.paths) {
        pathsHistory.current = state.paths;
        redrawAll(state.paths);
      }
    });

    socket.on('sync_canvas', ({ paths }) => {
      pathsHistory.current = paths;
      redrawAll(paths);
    });

    socket.on('clear_canvas', () => {
      pathsHistory.current = [];
      redoHistory.current = [];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off('drawing_data');
      socket.off('sync_room_state');
      socket.off('sync_canvas');
      socket.off('clear_canvas');
    };
  }, [socket, color, brushSize]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    
    if (clientX === undefined || clientY === undefined) return null;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    
    return { x, y };
  };

  const drawLine = (x0, y0, x1, y1, emit) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.stroke();
    ctx.closePath();

    if (!emit || !socket) return;
    
    const w = canvas.width;
    const h = canvas.height;

    const segment = {
      type: 'line',
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color,
      size: brushSize
    };

    if (pathsHistory.current.length > 0) {
      pathsHistory.current[pathsHistory.current.length - 1].push(segment);
    }

    socket.emit('drawing_data', { roomId, data: segment });
  };

  const executeFill = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    doFloodFill(ctx, Math.floor(x), Math.floor(y), color);
    
    const w = canvas.width;
    const h = canvas.height;

    const segment = {
      type: 'fill',
      x: x / w,
      y: y / h,
      color
    };

    pathsHistory.current.push([segment]);
    socket.emit('start_path', { roomId });
    socket.emit('drawing_data', { roomId, data: segment });
  };

  const startDrawing = (e) => {
    if (!isDrawer) return;
    
    const coords = getCoordinates(e);
    if (!coords) return;
    
    if (tool === 'bucket') {
      executeFill(coords.x, coords.y);
      return;
    }
    
    isDrawing.current = true;
    pathsHistory.current.push([]);
    redoHistory.current = [];
    socket.emit('start_path', { roomId });

    currentX.current = coords.x;
    currentY.current = coords.y;
    
    drawLine(coords.x, coords.y, coords.x, coords.y, true);
  };

  const draw = (e) => {
    if (!isDrawing.current || !isDrawer || tool !== 'pen') return;
    
    const coords = getCoordinates(e);
    if (!coords) return;

    drawLine(currentX.current, currentY.current, coords.x, coords.y, true);
    currentX.current = coords.x;
    currentY.current = coords.y;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const undo = () => {
    if (!isDrawer || pathsHistory.current.length === 0) return;
    const lastPath = pathsHistory.current.pop();
    redoHistory.current.push(lastPath);
    redrawAll(pathsHistory.current);
    socket.emit('sync_canvas', { roomId, paths: pathsHistory.current });
  };

  const redo = () => {
    if (!isDrawer || redoHistory.current.length === 0) return;
    const pathToRestore = redoHistory.current.pop();
    pathsHistory.current.push(pathToRestore);
    redrawAll(pathsHistory.current);
    socket.emit('sync_canvas', { roomId, paths: pathsHistory.current });
  };

  const clearCanvas = () => {
    if (!isDrawer) return;
    pathsHistory.current = [];
    redoHistory.current = [];
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    socket.emit('clear_canvas', { roomId });
  };

  return {
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
  };
}
