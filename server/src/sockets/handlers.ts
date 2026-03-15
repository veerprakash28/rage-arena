import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager';
import { FighterType, ActionType } from '@rage-arena/shared';
import { GameEngine } from '../game-engine/GameLoop';

export function setupHandlers(io: Server, roomManager: RoomManager, gameEngine: GameEngine) {
    io.on('connection', (socket: Socket) => {
        // console.log(`User connected: ${socket.id}`);

        socket.on('create-room', ({ playerName }) => {
            const code = roomManager.createRoom(socket.id, playerName);
            socket.join(code);
            socket.emit('room-created', code);
            io.to(code).emit('room-update', roomManager.getRoom(code));
        });

        socket.on('join-room', ({ code, playerName }) => {
            const result = roomManager.joinRoom(code, socket.id, playerName);
            if (result.success) {
                socket.join(code);
                socket.emit('room-joined', code);
                io.to(code).emit('room-update', roomManager.getRoom(code));
            } else {
                socket.emit('room-error', result.message);
            }
        });

        socket.on('select-fighter', ({ code, fighter, color }) => {
            roomManager.setFighterInfo(code, socket.id, fighter, color);
            io.to(code).emit('room-update', roomManager.getRoom(code));
        });

        socket.on('player-ready', ({ code, ready }) => {
            roomManager.setReady(code, socket.id, ready);
            const room = roomManager.getRoom(code);
            io.to(code).emit('room-update', room);

            // Check if both players are ready and start countdown
            if (room && room.players.length === 2 && room.players.every(p => p.isReady)) {
                if (room.status === 'waiting' || room.status === 'results') {
                    roomManager.setStatus(code, 'countdown');
                    io.to(code).emit('room-update', roomManager.getRoom(code));
                    io.to(code).emit('game-countdown', 3);

                    // Trigger game engine to start
                    setTimeout(() => {
                        const updatedRoom = roomManager.getRoom(code);
                        if (updatedRoom) {
                            gameEngine.startGame(code, updatedRoom);
                        }
                    }, 3000);        // }, 3000);
                }
            }
        });

        socket.on('return-to-lobby', ({ code }) => {
            const room = roomManager.getRoom(code);
            if (room && room.status === 'results') {
                roomManager.setStatus(code, 'waiting');
                room.players.forEach(p => { p.isReady = false; });
                io.to(code).emit('room-update', room);
            }
        });

        socket.on('chat-message', ({ code, text }) => {
            const room = roomManager.getRoom(code);
            if (!room) return;
            const player = room.players.find(p => p.id === socket.id) || room.spectators.find(s => s.id === socket.id);
            if (player) {
                io.to(code).emit('chat-message', {
                    id: Math.random().toString(36).substring(7),
                    sender: player.name,
                    text,
                    timestamp: Date.now()
                });
            }
        });

        // Queue game actions to the game engine
        socket.on('game-action', ({ code, action, isPressed }) => {
            gameEngine.registerAction(code, socket.id, action, isPressed);
        });

        socket.on('disconnect', () => {
            // console.log(`User disconnected: ${socket.id}`);
            const code = roomManager.removePlayer(socket.id);
            if (code && roomManager.getRoom(code)) {
                io.to(code).emit('room-update', roomManager.getRoom(code));
            }
        });
    });
}
