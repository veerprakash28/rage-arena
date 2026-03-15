import { GAME_CONSTANTS, ActionType, PlayerStateNumber } from '@rage-arena/shared';

export class Combat {
    static checkHit(attacker: PlayerStateNumber, defender: PlayerStateNumber): boolean {
        // Only check on first frame of attack — when activeAttack just started  
        // We detect this by checking if we haven't already registered this swing
        if (!attacker.actionCooldowns) return false;

        const attackAnims: Record<string, ActionType> = {
            punch: ActionType.PUNCH,
            kick: ActionType.KICK,
            smash: ActionType.SMASH,
            special: ActionType.SPECIAL,
        };

        const attackType = attackAnims[attacker.animation];
        if (!attackType) return false;

        // 'hitRegistered' is set to 1 on the first frame an attack is started.
        // Combat fires only when hitRegistered is NOT yet set.
        if (attacker.actionCooldowns['hitRegistered']) return false;

        // Mark as hit-checked so we don't double-hit this swing
        attacker.actionCooldowns['hitRegistered'] = attacker.actionCooldowns['activeAttack'] || 1;

        const range = GAME_CONSTANTS.ATTACK_RANGE[attackType];
        const reachX = attacker.facing === 'right' ? attacker.x + range : attacker.x - range;

        const atkMinX = Math.min(attacker.x, reachX);
        const atkMaxX = Math.max(attacker.x, reachX);

        const defMinX = defender.x - GAME_CONSTANTS.PLAYER_WIDTH / 2;
        const defMaxX = defender.x + GAME_CONSTANTS.PLAYER_WIDTH / 2;

        const isYOverlap = Math.abs(attacker.y - defender.y) < GAME_CONSTANTS.PLAYER_HEIGHT;

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

        attacker.energy = Math.min(GAME_CONSTANTS.MAX_ENERGY, attacker.energy + GAME_CONSTANTS.ENERGY_PER_HIT_DEALT);
        defender.energy = Math.min(GAME_CONSTANTS.MAX_ENERGY, defender.energy + GAME_CONSTANTS.ENERGY_PER_HIT_RECEIVED);

        // Apply hit stun
        defender.actionCooldowns['stun'] = isBlocked ? Math.floor(attackStats.hitstunFrames * 0.3) : attackStats.hitstunFrames;

        // Knockback
        const knockback = attackStats.knockback * (isBlocked ? 0.3 : 1);
        if (attacker.facing === 'right') {
            defender.x += knockback;
        } else {
            defender.x -= knockback;
        }

        if (defender.hp === 0) {
            defender.animation = 'ko';
        }
    }
}
