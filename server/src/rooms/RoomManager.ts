import { RoomInfo, GameStatus, FighterType } from '@rage-arena/shared';

// For this initial minimal build, room logic simply stores room states in memory.
export class RoomManager {
    private rooms: Map<string, RoomInfo> = new Map();

    generateCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        do {
            code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (this.rooms.has(code));
        return code;
    }

    createRoom(hostId: string, playerName: string): string {
        const code = this.generateCode();
        // Host gets randomly assigned color for start
        const colors = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#42d4f4'];
        const p1Color = colors[Math.floor(Math.random() * colors.length)];

        this.rooms.set(code, {
            code,
            players: [{ id: hostId, name: playerName, isReady: false, color: p1Color }],
            spectators: [],
            status: 'waiting'
        });
        return code;
    }

    getRoom(code: string): RoomInfo | undefined {
        return this.rooms.get(code);
    }

    joinRoom(code: string, socketId: string, playerName: string, asSpectator: boolean = false): { success: boolean, message?: string } {
        const room = this.rooms.get(code);
        if (!room) return { success: false, message: 'Room not found' };

        if (asSpectator) {
            room.spectators.push({ id: socketId, name: playerName });
            return { success: true };
        }

        if (room.players.length >= 2) {
            return { success: false, message: 'Room is full' };
        }

        // Assign a different color than P1
        const colors = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#42d4f4'];
        const p1Color = room.players[0].color;
        let p2Color = colors[Math.floor(Math.random() * colors.length)];
        while (p2Color === p1Color) {
            p2Color = colors[Math.floor(Math.random() * colors.length)];
        }

        room.players.push({ id: socketId, name: playerName, isReady: false, color: p2Color });
        return { success: true };
    }

    setFighterInfo(code: string, socketId: string, fighter: FighterType, color: string) {
        const room = this.rooms.get(code);
        if (!room) return;
        const player = room.players.find(p => p.id === socketId);
        if (player) {
            player.fighter = fighter;
            player.color = color;
        }
    }

    setReady(code: string, socketId: string, ready: boolean): boolean {
        const room = this.rooms.get(code);
        if (!room) return false;
        const player = room.players.find(p => p.id === socketId);
        if (player) {
            player.isReady = ready;
        }

        // Check if both ready
        const bothReady = room.players.length === 2 && room.players.every(p => p.isReady && p.fighter);
        if (bothReady && room.status === 'waiting') {
            // room status change to be handled by caller
            return true;
        }
        return false;
    }

    setStatus(code: string, status: GameStatus) {
        const room = this.rooms.get(code);
        if (room) {
            room.status = status;
        }
    }

    removePlayer(socketId: string): string | null {
        // Find which room they were in
        for (const [code, room] of this.rooms.entries()) {
            const pIndex = room.players.findIndex(p => p.id === socketId);
            if (pIndex !== -1) {
                room.players.splice(pIndex, 1);
                // If room is empty, delete it
                if (room.players.length === 0) {
                    this.rooms.delete(code);
                } else {
                    // Unready the remaining player
                    room.players.forEach(p => { p.isReady = false; });
                    room.status = 'waiting';
                }
                return code;
            }

            const sIndex = room.spectators.findIndex(s => s.id === socketId);
            if (sIndex !== -1) {
                room.spectators.splice(sIndex, 1);
                return code;
            }
        }
        return null;
    }
}
