import { Server } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager';
import { GameState, GAME_CONSTANTS, ActionType, PlayerStateNumber, RoomInfo } from '@rage-arena/shared';
import { Physics } from './Physics';
import { Combat } from './Combat';

export class GameEngine {
    private io: Server;
    private roomManager: RoomManager;
    private gameLoops: Map<string, NodeJS.Timeout> = new Map();
    private gameStates: Map<string, GameState> = new Map();
    private actionQueues: Map<string, Record<string, Set<ActionType>>> = new Map(); // roomCode -> socketId -> ActionSet

    constructor(io: Server, roomManager: RoomManager) {
        this.io = io;
        this.roomManager = roomManager;
    }

    public startGame(roomCode: string, room: RoomInfo) {
        // console.log(`Starting game for room ${roomCode}`);
        if (this.gameLoops.has(roomCode)) {
            clearInterval(this.gameLoops.get(roomCode));
        }

        // Initial state
        const players: Record<string, PlayerStateNumber> = {};
        const p1Id = room.players[0].id;
        const p2Id = room.players[1].id;

        players[p1Id] = {
            id: p1Id,
            name: room.players[0].name,
            fighter: room.players[0].fighter!,
            x: 200,
            y: GAME_CONSTANTS.GROUND_Y,
            velocityY: 0,
            hp: GAME_CONSTANTS.MAX_HP,
            energy: 0,
            facing: 'right',
            animation: 'idle',
            isBlocking: false,
            isReady: true,
            color: room.players[0].color,
            actionCooldowns: {}
        };

        players[p2Id] = {
            id: p2Id,
            name: room.players[1].name,
            fighter: room.players[1].fighter!,
            x: GAME_CONSTANTS.STAGE_WIDTH - 200,
            y: GAME_CONSTANTS.GROUND_Y,
            velocityY: 0,
            hp: GAME_CONSTANTS.MAX_HP,
            energy: 0,
            facing: 'left',
            animation: 'idle',
            isBlocking: false,
            isReady: true,
            color: room.players[1].color,
            actionCooldowns: {}
        };

        const gameState: GameState = {
            players,
            status: 'playing',
            roundTimer: GAME_CONSTANTS.ROUND_TIME_SECONDS,
            winner: null
        };

        this.gameStates.set(roomCode, gameState);
        this.actionQueues.set(roomCode, { [p1Id]: new Set(), [p2Id]: new Set() });

        this.roomManager.setStatus(roomCode, 'playing');
        const updatedRoom = this.roomManager.getRoom(roomCode);
        if (updatedRoom) {
            this.io.to(roomCode).emit('room-update', updatedRoom);
        }
        this.io.to(roomCode).emit('game-start');

        // Timer loop
        let tickCount = 0;

        const intervalId = setInterval(() => {
            this.tick(roomCode);

            // Update timer every 60 ticks (1 second)
            tickCount++;
            if (tickCount >= GAME_CONSTANTS.TICK_RATE) {
                tickCount = 0;
                this.updateTimer(roomCode);
            }
        }, GAME_CONSTANTS.MS_PER_TICK);

        this.gameLoops.set(roomCode, intervalId);
    }

    public stopGame(roomCode: string) {
        if (this.gameLoops.has(roomCode)) {
            clearInterval(this.gameLoops.get(roomCode));
            this.gameLoops.delete(roomCode);
        }
        this.actionQueues.delete(roomCode);
        this.gameStates.delete(roomCode);
        this.roomManager.setStatus(roomCode, 'results');
        const room = this.roomManager.getRoom(roomCode);
        if (room) {
            this.io.to(roomCode).emit('room-update', room);
        }
    }

    public registerAction(roomCode: string, socketId: string, action: ActionType, isPressed: boolean) {
        const queue = this.actionQueues.get(roomCode);
        if (queue && queue[socketId]) {
            if (isPressed) {
                queue[socketId].add(action);
            } else {
                queue[socketId].delete(action);
            }
        }
    }

    private tick(roomCode: string) {
        const state = this.gameStates.get(roomCode);
        const queue = this.actionQueues.get(roomCode);

        if (!state || !queue) return;

        if (state.status !== 'playing') {
            this.io.to(roomCode).emit('game-state', state);
            return;
        }

        const playerIds = Object.keys(state.players);
        const p1 = state.players[playerIds[0]];
        const p2 = state.players[playerIds[1]];

        // 1. Process inputs & Physics
        Physics.updatePlayer(p1, Array.from(queue[p1.id]));
        Physics.updatePlayer(p2, Array.from(queue[p2.id]));

        // 2. Face each other
        Physics.updateFacing(p1, p2);

        // 3. Combat resolution
        Combat.checkHit(p1, p2);
        Combat.checkHit(p2, p1);

        // 4. Check KO
        if (p1.hp <= 0 && p2.hp <= 0) {
            state.status = 'ko';
            state.winner = 'tie';
            this.endGame(roomCode, state);
        } else if (p1.hp <= 0) {
            state.status = 'ko';
            state.winner = p2.id;
            this.endGame(roomCode, state);
        } else if (p2.hp <= 0) {
            state.status = 'ko';
            state.winner = p1.id;
            this.endGame(roomCode, state);
        }

        // 5. Broadcast State
        this.io.to(roomCode).emit('game-state', state);

        // Auto-clear single-press actions like jump/attacks to avoid re-triggering constantly if not handled client side
        // Actually, client should send isPressed: false, but for jump/attacks maybe we just delete them?
        const singlePress = [ActionType.JUMP, ActionType.PUNCH, ActionType.KICK, ActionType.SMASH, ActionType.SPECIAL];
        for (const action of singlePress) {
            queue[p1.id].delete(action);
            queue[p2.id].delete(action);
        }
    }

    private updateTimer(roomCode: string) {
        const state = this.gameStates.get(roomCode);
        if (!state || state.status !== 'playing') return;

        state.roundTimer--;
        if (state.roundTimer <= 0) {
            // Time over
            state.status = 'ko';
            const playersList = Object.values(state.players) as PlayerStateNumber[];
            if (playersList[0].hp > playersList[1].hp) state.winner = playersList[0].id;
            else if (playersList[1].hp > playersList[0].hp) state.winner = playersList[1].id;
            else state.winner = 'tie';
            this.endGame(roomCode, state);
        }
    }

    private endGame(roomCode: string, state: GameState) {
        this.io.to(roomCode).emit('game-state', state); // Final broadcast with KO
        // Wait a few seconds for KO screen, then move to results
        setTimeout(() => {
            this.stopGame(roomCode);
        }, 3000); // 3 seconds of KO screen
    }
}
