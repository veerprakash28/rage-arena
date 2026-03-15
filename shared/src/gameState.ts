import { FighterType, PlayerStateNumber } from './types';

// Omit 'isReady' entirely for GameState to avoid confusion.
// But we can just use the same type.
export type GameStatus = 'waiting' | 'countdown' | 'playing' | 'ko' | 'results';

export interface GameState {
    players: Record<string, PlayerStateNumber>;
    status: GameStatus;
    roundTimer: number; // in seconds
    winner: string | null; // socket ID or 'tie'
}

export interface RoomInfo {
    code: string;
    players: { id: string; name: string; fighter?: FighterType; isReady: boolean; color: string }[];
    spectators: { id: string; name: string }[];
    status: GameStatus;
}

export interface ChatMessage {
    id: string;
    sender: string; // name
    text: string;
    timestamp: number;
    isSystem?: boolean;
}
