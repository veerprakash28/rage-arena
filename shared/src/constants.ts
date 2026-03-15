import { ActionType } from './types';

export const GAME_CONSTANTS = {
    // Timing
    TICK_RATE: 60,
    MS_PER_TICK: 1000 / 60,
    ROUND_TIME_SECONDS: 90,
    COUNTDOWN_SECONDS: 3,
    REMATCH_TIMER_SECONDS: 5,

    // Stage Dimensions
    STAGE_WIDTH: 800,
    STAGE_HEIGHT: 450,
    GROUND_Y: 380, // Where the feet of the characters touch

    // Physics
    GRAVITY: 0.8,
    JUMP_FORCE: -15, // Negative because Y goes down
    MOVE_SPEED: 5,
    FRICTION: 0.8, // For knockback

    // Player Stats
    MAX_HP: 100,
    MAX_ENERGY: 100,

    // Combat
    BLOCK_DAMAGE_REDUCTION: 0.3, // Take 30% damage when blocking
    ENERGY_PER_HIT_DEALT: 10,
    ENERGY_PER_HIT_RECEIVED: 5,

    // Attack Stats: [damage, energyCost, cooldownFrames, hitstunFrames, knockback]
    ATTACKS: {
        [ActionType.PUNCH]: { damage: 5, energyCost: 0, cooldownFrames: 20, hitstunFrames: 15, knockback: 2 },
        [ActionType.KICK]: { damage: 8, energyCost: 0, cooldownFrames: 30, hitstunFrames: 20, knockback: 4 },
        [ActionType.SMASH]: { damage: 15, energyCost: 0, cooldownFrames: 50, hitstunFrames: 30, knockback: 8 },
        [ActionType.SPECIAL]: { damage: 25, energyCost: 50, cooldownFrames: 60, hitstunFrames: 40, knockback: 12 },
    },

    // Hitbox Dimensions (width, height, offsetX, offsetY)
    PLAYER_WIDTH: 60,
    PLAYER_HEIGHT: 120,
    ATTACK_RANGE: {
        [ActionType.PUNCH]: 40,
        [ActionType.KICK]: 50,
        [ActionType.SMASH]: 60,
        [ActionType.SPECIAL]: 80,
    }
} as const;
