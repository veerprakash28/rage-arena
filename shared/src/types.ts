export enum FighterType {
    SHADOW_NINJA = 'SHADOW_NINJA',
    IRON_BOXER = 'IRON_BOXER',
    STREET_BRAWLER = 'STREET_BRAWLER'
}

export enum ActionType {
    MOVE_LEFT = 'MOVE_LEFT',
    MOVE_RIGHT = 'MOVE_RIGHT',
    JUMP = 'JUMP',
    PUNCH = 'PUNCH',
    KICK = 'KICK',
    SMASH = 'SMASH',
    BLOCK = 'BLOCK',
    SPECIAL = 'SPECIAL',
    STOP = 'STOP' // Stop horizontal movement
}

export interface PlayerState {
    id: string; // Socket ID
    name: string;
    fighter: FighterType;
    x: string; // string or number? Will use number, then round down sending. actually, number is fine in JS object over socket.io.
    y: number;
    velocityY: number;
    hp: number;
    energy: number;
    facing: 'left' | 'right';
    animation: 'idle' | 'walk' | 'jump' | 'punch' | 'kick' | 'smash' | 'hit' | 'ko' | 'block' | 'special';
    isBlocking: boolean;
    isReady: boolean;
    color: string;
    actionCooldowns: Record<string, number>; // track when actions are ready again
}

// Ensure x is number for Physics
export interface PlayerStateNumber extends Omit<PlayerState, 'x'> {
    x: number;
}
