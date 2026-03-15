import { GAME_CONSTANTS, ActionType, PlayerStateNumber, GameState } from '@rage-arena/shared';

// The Combat engine resolves overlaps, applies damage, and manages hitstun/knockback.
export class Combat {
    static checkHit(attacker: PlayerStateNumber, defender: PlayerStateNumber): boolean {
        if (!attacker.actionCooldowns || attacker.actionCooldowns['activeAttack'] > 0) return false;

        let isAttacking = false;
        let attackType: ActionType | null = null;

        // Check which attack is active
        const attacks = [ActionType.PUNCH, ActionType.KICK, ActionType.SMASH, ActionType.SPECIAL];
        for (const action of attacks) {
            if (attacker.animation === action.toLowerCase()) {
                isAttacking = true;
                attackType = action;
                break;
            }
        }

        if (!isAttacking || !attackType) return false;

        // Prevent hitting multiple times on the same animation cycle
        // We'll mark the attack as hit
        attacker.actionCooldowns['activeAttack'] = GAME_CONSTANTS.ATTACKS[attackType].cooldownFrames;

        const range = GAME_CONSTANTS.ATTACK_RANGE[attackType];
        const reachX = attacker.facing === 'right' ? attacker.x + range : attacker.x - range;

        // Simple AABB overlap check for horizontal range (X-axis)
        // and vertical range (Y-axis)

        const atkMinX = Math.min(attacker.x, reachX);
        const atkMaxX = Math.max(attacker.x, reachX);

        const defMinX = defender.x - GAME_CONSTANTS.PLAYER_WIDTH / 2;
        const defMaxX = defender.x + GAME_CONSTANTS.PLAYER_WIDTH / 2;

        // Check vertical overlap 
        const isYOverlap = Math.abs(attacker.y - defender.y) < GAME_CONSTANTS.PLAYER_HEIGHT;

        // Check hit
        if (atkMaxX > defMinX && atkMinX < defMaxX && isYOverlap) {
            this.applyHit(attackType, attacker, defender);
            return true;
        }

        return false;
    }

    private static applyHit(attackType: ActionType, attacker: PlayerStateNumber, defender: PlayerStateNumber) {
        const attackStats = GAME_CONSTANTS.ATTACKS[attackType];
        let damage = attackStats.damage;
        let isBlocked = false;

        if (defender.isBlocking && defender.facing !== attacker.facing) {
            damage = Math.floor(damage * GAME_CONSTANTS.BLOCK_DAMAGE_REDUCTION);
            isBlocked = true;
            defender.animation = 'block';
        } else {
            defender.animation = 'hit';
        }

        defender.hp = Math.max(0, defender.hp - damage);

        // Apply energy
        attacker.energy = Math.min(GAME_CONSTANTS.MAX_ENERGY, attacker.energy + GAME_CONSTANTS.ENERGY_PER_HIT_DEALT);
        defender.energy = Math.min(GAME_CONSTANTS.MAX_ENERGY, defender.energy + GAME_CONSTANTS.ENERGY_PER_HIT_RECEIVED);

        // Apply hit stun & knockback
        defender.actionCooldowns['stun'] = attackStats.hitstunFrames;

        // Knockback
        const knockback = attackStats.knockback * (isBlocked ? 0.5 : 1);
        defender.x += (attacker.facing === 'right' ? knockback : -knockback);

        if (defender.hp === 0) {
            defender.animation = 'ko';
        }
    }
}
