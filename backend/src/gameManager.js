const { getRandomWords } = require('./utils/words');

const rooms = new Map();

const ROUND_TIME = 60; // seconds
const CHOOSING_TIME = 15; // seconds

function getLevenshteinDistance(a, b) {
    const matrix = [];
    let i, j;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    for (i = 0; i <= b.length; i++) matrix[i] = [i];
    for (j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

function createRoom(roomId, hostId, hostName, avatar = '👤') {
    const room = {
        id: roomId,
        host: hostId,
        players: [{ id: hostId, name: hostName, score: 0, avatar }],
        status: 'lobby', // lobby, choosing, drawing, round_over
        round: 1,
        maxRounds: 3,
        maxPlayers: 8,
        drawTime: 80,
        customWords: [],
        useCustomWordsOnly: false,
        pathsHistory: [],
        currentDrawerIndex: -1,
        currentWord: '',
        wordChoices: [],
        guessedPlayers: new Set(),
        timerInterval: null,
        timeLeft: 0
    };
    rooms.set(roomId, room);
    return room;
}

function joinRoom(roomId, playerId, playerName, avatar = '👤') {
    const room = rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    
    if (room.players.length >= (room.maxPlayers || 8)) {
        return { error: 'Room is full' };
    }

    if (room.players.find(p => p.id === playerId)) return room; // Already joined
    room.players.push({ id: playerId, name: playerName, score: 0, avatar });
    return room;
}

function leaveRoom(roomId, playerId, io) {
    const room = rooms.get(roomId);
    if (!room) return null;
    
    // Find if the leaving player is the current drawer
    const drawerId = room.players[room.currentDrawerIndex]?.id;
    
    room.players = room.players.filter(p => p.id !== playerId);
    
    if (room.players.length === 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        rooms.delete(roomId);
        return null;
    }

    if (room.host === playerId) {
        room.host = room.players[0].id;
    }

    // Adjust drawer index if a player before the drawer left
    const newDrawerIndex = room.players.findIndex(p => p.id === drawerId);
    if (newDrawerIndex !== -1) {
        room.currentDrawerIndex = newDrawerIndex;
    } else if (drawerId === playerId && io && (room.status === 'drawing' || room.status === 'choosing')) {
        // The drawer left!
        room.currentDrawerIndex--; // Step back so startTurn increments to the right next person
        endTurn(room, io);
    } else if (drawerId === playerId && room.status === 'lobby') {
        room.currentDrawerIndex = -1;
    }

    return room;
}

function startGame(roomId) {
    const room = rooms.get(roomId);
    if (!room) return false;
    
    room.status = 'playing';
    room.round = 1;
    room.turnsTaken = 0;
    // reset scores
    room.players.forEach(p => p.score = 0);
    // Randomize first drawer (subtract 1 because startTurn immediately adds 1)
    const randomFirst = Math.floor(Math.random() * room.players.length);
    room.currentDrawerIndex = randomFirst - 1;
    return true;
}

function startTurn(room, io) {
    if (room.turnsTaken === undefined) room.turnsTaken = 0;
    
    if (room.turnsTaken >= room.players.length) {
        room.round++;
        room.turnsTaken = 0;
    }
    
    room.turnsTaken++;
    
    room.currentDrawerIndex = (room.currentDrawerIndex + 1) % room.players.length;

    const maxRounds = room.maxRounds || 3;
    if (room.round > maxRounds) {
        room.status = 'ended';
        io.to(room.id).emit('game_ended', { players: room.players });
        return;
    }

    room.status = 'choosing';
    room.guessedPlayers.clear();
    const drawer = room.players[room.currentDrawerIndex];

    io.to(room.id).emit('turn_started', {
        drawerId: drawer.id,
        drawerName: drawer.name,
        round: room.round,
        maxRounds: maxRounds
    });

    room.wordChoices = getRandomWords(3, room.customWords, room.useCustomWordsOnly);
    io.to(drawer.id).emit('choose_word', { words: room.wordChoices });
    
    // Auto pick word if not chosen in time
    room.timeLeft = CHOOSING_TIME;
    io.to(room.id).emit('timer_update', { timeLeft: room.timeLeft, phase: 'choosing' });
    
    if (room.timerInterval) clearInterval(room.timerInterval);
    room.timerInterval = setInterval(() => {
        room.timeLeft--;
        io.to(room.id).emit('timer_update', { timeLeft: room.timeLeft, phase: 'choosing' });
        
        if (room.timeLeft <= 0) {
            clearInterval(room.timerInterval);
            // Auto-select a random word among choices
            const randomChoiceIndex = Math.floor(Math.random() * room.wordChoices.length);
            const autoWord = room.wordChoices[randomChoiceIndex] || 'scribble';
            selectWord(room, autoWord, io);
        }
    }, 1000);
}

function selectWord(room, word, io) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    
    room.currentWord = word;
    room.status = 'drawing';
    room.timeLeft = room.drawTime || ROUND_TIME;

    // Clear canvas before someone starts drawing
    io.to(room.id).emit('clear_canvas');
    
    const hiddenWord = word.replace(/[a-zA-Z]/g, '_');
    io.to(room.id).emit('word_selected', { hiddenWord, length: word.length });
    
    const drawerId = room.players[room.currentDrawerIndex]?.id;
    if (drawerId) {
        io.to(drawerId).emit('drawer_word_selected', { word });
    }
    
    io.to(room.id).emit('timer_update', { timeLeft: room.timeLeft, phase: 'drawing' });
    
    room.timerInterval = setInterval(() => {
        room.timeLeft--;
        io.to(room.id).emit('timer_update', { timeLeft: room.timeLeft, phase: 'drawing' });
        
        if (room.timeLeft <= 0) {
            endTurn(room, io);
        }
    }, 1000);
}

function endTurn(room, io) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    room.status = 'round_over';
    
    io.to(room.id).emit('round_ended', { 
        word: room.currentWord, 
        players: room.players 
    });
    
    setTimeout(() => {
        startTurn(room, io);
    }, 5000); // 5 second break between turns
}

function handleGuess(roomId, playerId, guess) {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'drawing') return false;

    const player = room.players.find(p => p.id === playerId);
    const isDrawer = room.players[room.currentDrawerIndex].id === playerId;
    
    if (isDrawer || room.guessedPlayers.has(playerId)) return false;

    const distance = getLevenshteinDistance(guess.toLowerCase(), room.currentWord.toLowerCase());

    if (distance === 0) {
        room.guessedPlayers.add(playerId);
        
        // Calculate score
        const points = Math.max(10, Math.floor(room.timeLeft * (100 / (room.drawTime || ROUND_TIME))));
        player.score += points;
        
        // Add some points to the drawer too
        const drawer = room.players[room.currentDrawerIndex];
        if (drawer) drawer.score += 10;

        // If everyone guessed (everyone except drawer)
        if (room.guessedPlayers.size === room.players.length - 1) {
            // End turn early
            return { correct: true, endTurn: true };
        }
        
        return { correct: true, endTurn: false, points };
    } else if (distance <= 2 && room.currentWord.length > 4) {
        return { correct: false, close: true };
    } else if (distance === 1 && room.currentWord.length <= 4) {
        return { correct: false, close: true };
    }
    
    return { correct: false };
}

function getRoom(roomId) {
    return rooms.get(roomId);
}

module.exports = {
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    startTurn,
    selectWord,
    endTurn,
    handleGuess,
    getRoom
};
