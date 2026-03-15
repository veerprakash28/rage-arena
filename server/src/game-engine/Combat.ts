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

        // TypeScript safe casting
        type AttackActionType = ActionType.PUNCH | ActionType.KICK | ActionType.SMASH | ActionType.SPECIAL;
        const validAttackType = attackType as AttackActionType;

        // 'hitRegistered' is set to 1 on the first frame an attack is started.
        // Combat fires only when hitRegistered is NOT yet set.
        if (attacker.actionCooldowns['hitRegistered']) return false;

        // Mark as hit-checked so we don't double-hit this swing
        attacker.actionCooldowns['hitRegistered'] = attacker.actionCooldowns['activeAttack'] || 1;

        const range = GAME_CONSTANTS.ATTACK_RANGE[validAttackType];
        const reachX = attacker.facing === 'right' ? attacker.x + range : attacker.x - range;

        const atkMinX = Math.min(attacker.x, reachX);
        const atkMaxX = Math.max(attacker.x, reachX);

        const defMinX = defender.x - GAME_CONSTANTS.PLAYER_WIDTH / 2;
        const defMaxX = defender.x + GAME_CONSTANTS.PLAYER_WIDTH / 2;

        const isYOverlap = Math.abs(attacker.y - defender.y) < GAME_CONSTANTS.PLAYER_HEIGHT;

        if (atkMaxX > defMinX && atkMinX < defMaxX && isYOverlap) {
            this.applyHit(validAttackType, attacker, defender);
            return true;
        }

        return false;
    }

    private static applyHit(attackType: ActionType.PUNCH | ActionType.KICK | ActionType.SMASH | ActionType.SPECIAL, attacker: PlayerStateNumber, defender: PlayerStateNumber) {
        const attackStats = GAME_CONSTANTS.ATTACKS[attackType];
        let damage: number = attackStats.damage;
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

        // EXTRA CRAZY GAME DEV JUICE: Massive Hitstun & Knock-ups!
        const isHeavyAttack = attackType === ActionType.SMASH || attackType === ActionType.SPECIAL;

        // Exaggerated hitstun frames for visceral impact
        defender.actionCooldowns['stun'] = isBlocked ? Math.floor(attackStats.hitstunFrames * 0.5) : Math.floor(attackStats.hitstunFrames * 1.5);

        // Base knockback
        const knockback = attackStats.knockback * (isBlocked ? 0.3 : 1.2);

        if (attacker.facing === 'right') {
            defender.x += knockback;
        } else {
            defender.x -= knockback;
        }

        // CRAZY KNOCK-UP PHYSICS for Heavy Attacks or lethal blows!
        if (!isBlocked && (isHeavyAttack || defender.hp === 0)) {
            // Launch the defender into the air (simulate Y velocity if the engine supports it natively, otherwise fake it with a jump state if possible)
            // If the engine only tracks Y during jumps, we can piggyback on that:
            defender.velocityY = -20; // Big upward spike
            defender.y -= 1; // Detach from ground to trigger gravity in Main loop
        }
        defender.energy = Math.min(GAME_CONSTANTS.MAX_ENERGY, defender.energy + GAME_CONSTANTS.ENERGY_PER_HIT_RECEIVED);

        if (defender.hp === 0) {
            defender.animation = 'ko';
        }
    }
}
