const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const {
    createRoom, joinRoom, leaveRoom, startGame, startTurn, selectWord, endTurn, handleGuess, getRoom
} = require('./gameManager');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('create_room', ({ playerName, avatar }) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        createRoom(roomId, socket.id, playerName, avatar);
        socket.join(roomId);
        socket.emit('room_joined', { roomId, player: { id: socket.id, name: playerName, avatar } });
        
        const room = getRoom(roomId);
        io.to(roomId).emit('player_list_update', { players: room.players });
    });

    socket.on('join_room', ({ roomId, playerName, avatar }) => {
        const room = joinRoom(roomId, socket.id, playerName, avatar);
        if (room && room.error) {
            socket.emit('error', { message: room.error });
            return;
        }
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        
        socket.join(roomId);
        socket.emit('room_joined', { roomId, player: { id: socket.id, name: playerName, avatar } });
        io.to(roomId).emit('player_list_update', { players: room.players });
        io.to(roomId).emit('system_message', { message: `${playerName} joined the room!` });
    });

    socket.on('get_room_state', ({ roomId }) => {
        const room = getRoom(roomId);
        if (room) {
            socket.emit('sync_room_state', {
                players: room.players,
                status: room.status,
                round: room.round,
                maxRounds: room.maxRounds,
                timeLeft: room.timeLeft,
                drawerInfo: room.currentDrawerIndex >= 0 ? {
                    id: room.players[room.currentDrawerIndex]?.id,
                    name: room.players[room.currentDrawerIndex]?.name
                } : null,
                hiddenWord: room.currentWord ? room.currentWord.replace(/[a-zA-Z]/g, '_') : '',
                paths: room.pathsHistory
            });
        }
    });

    socket.on('start_game', ({ roomId }) => {
        const room = getRoom(roomId);
        if (room && room.host === socket.id) {
            if (startGame(roomId)) {
                io.to(roomId).emit('game_started');
                startTurn(room, io);
            }
        }
    });

    socket.on('update_settings', ({ roomId, settings }) => {
        const room = getRoom(roomId);
        if (room && room.host === socket.id) {
            if (settings.maxRounds) room.maxRounds = settings.maxRounds;
            if (settings.maxPlayers) room.maxPlayers = settings.maxPlayers;
            if (settings.drawTime) room.drawTime = settings.drawTime;
            if (settings.customWords !== undefined) {
                let wordsArr = [];
                if (typeof settings.customWords === 'string') {
                    wordsArr = settings.customWords.split(',').map(w => w.trim()).filter(w => w.length > 0);
                } else if (Array.isArray(settings.customWords)) {
                    wordsArr = settings.customWords;
                }
                room.customWords = wordsArr;
            }
            if (settings.useCustomWordsOnly !== undefined) {
                room.useCustomWordsOnly = settings.useCustomWordsOnly;
            }
            io.to(roomId).emit('settings_updated', {
                maxRounds: room.maxRounds,
                maxPlayers: room.maxPlayers,
                drawTime: room.drawTime,
                customWords: room.customWords,
                useCustomWordsOnly: room.useCustomWordsOnly
            });
        }
    });

    socket.on('word_chosen', ({ roomId, word }) => {
        const room = getRoom(roomId);
        if (room && room.status === 'choosing' && room.players[room.currentDrawerIndex].id === socket.id) {
            selectWord(room, word, io);
        }
    });

    socket.on('start_path', ({ roomId }) => {
        const room = getRoom(roomId);
        if (room) {
            room.pathsHistory.push([]);
        }
    });

    socket.on('drawing_data', ({ roomId, data }) => {
        const room = getRoom(roomId);
        if (room) {
            if (room.pathsHistory.length === 0) room.pathsHistory.push([]);
            room.pathsHistory[room.pathsHistory.length - 1].push(data);
        }
        // Forward drawing data to everyone else in the room
        socket.to(roomId).emit('drawing_data', data);
    });

    socket.on('sync_canvas', ({ roomId, paths }) => {
        const room = getRoom(roomId);
        if (room) {
            room.pathsHistory = paths;
        }
        // Broadcast full canvas paths to other players (for undo/redo)
        socket.to(roomId).emit('sync_canvas', { paths });
    });
    
    socket.on('clear_canvas', ({ roomId }) => {
        const room = getRoom(roomId);
        if (room) {
            room.pathsHistory = [];
        }
        socket.to(roomId).emit('clear_canvas');
    });

    socket.on('send_message', ({ roomId, message, playerName }) => {
        const room = getRoom(roomId);
        if (!room) return;

        const guessResult = handleGuess(roomId, socket.id, message);
        
        if (guessResult.correct) {
            io.to(roomId).emit('correct_guess', { 
                playerId: socket.id, 
                playerName, 
                message: `${playerName} guessed the word!` 
            });
            
            // Update scores
            io.to(roomId).emit('player_list_update', { players: room.players });
            
            if (guessResult.endTurn) {
                endTurn(room, io);
            }
        } else if (guessResult.close) {
            // Send close guess only to the player
            socket.emit('close_guess', { 
                message: `'${message}' is very close!` 
            });
            // Still broadcast as a normal message
            io.to(roomId).emit('chat_message', { 
                playerId: socket.id, 
                playerName, 
                message 
            });
        } else {
            // Normal chat message
            io.to(roomId).emit('chat_message', { 
                playerId: socket.id, 
                playerName, 
                message 
            });
        }
    });

    socket.on('disconnecting', () => {
        for (const roomId of socket.rooms) {
            if (roomId !== socket.id) {
                const room = getRoom(roomId);
                const player = room?.players.find(p => p.id === socket.id);
                if (player) {
                    io.to(roomId).emit('system_message', { message: `${player.name} left the room.` });
                }

                const updatedRoom = leaveRoom(roomId, socket.id, io);
                if (updatedRoom) {
                    io.to(roomId).emit('player_list_update', { players: updatedRoom.players });
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
