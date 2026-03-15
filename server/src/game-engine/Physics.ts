import { GAME_CONSTANTS, PlayerStateNumber, ActionType } from '@rage-arena/shared';

export class Physics {
    static updatePlayer(player: PlayerStateNumber, activeActions: ActionType[]) {
        // Decrease cooldowns
        if (player.actionCooldowns) {
            for (const key in player.actionCooldowns) {
                if (player.actionCooldowns[key] > 0) {
                    player.actionCooldowns[key]--;
                }
            }
        } else {
            player.actionCooldowns = {};
        }

        // Skip movement if stunned or KO'd
        if (player.animation === 'ko' || player.actionCooldowns['stun'] > 0) {
            player.velocityY += GAME_CONSTANTS.GRAVITY;
            player.y = Math.min(player.y + player.velocityY, GAME_CONSTANTS.GROUND_Y);
            if (player.y >= GAME_CONSTANTS.GROUND_Y) player.velocityY = 0;
            return;
        }

        // isAttacking: currently in an attack animation AND the cooldown is still running
        const attackAnims = ['punch', 'kick', 'smash', 'special'];
        const activeAttackCooldown = player.actionCooldowns['activeAttack'] ?? 0;
        const isAttacking = attackAnims.includes(player.animation) && activeAttackCooldown > 0;

        if (!isAttacking) {
            // Clear any stale attack animation now that cooldown expired
            if (attackAnims.includes(player.animation)) {
                player.animation = 'idle';
            }

            if (activeActions.includes(ActionType.BLOCK)) {
                player.isBlocking = true;
            } else {
                player.isBlocking = false;
            }

            if (!player.isBlocking) {
                let isMoving = false;
                if (activeActions.includes(ActionType.MOVE_LEFT)) {
                    player.x -= GAME_CONSTANTS.MOVE_SPEED;
                    isMoving = true;
                } else if (activeActions.includes(ActionType.MOVE_RIGHT)) {
                    player.x += GAME_CONSTANTS.MOVE_SPEED;
                    isMoving = true;
                }

                if (activeActions.includes(ActionType.JUMP) && player.y >= GAME_CONSTANTS.GROUND_Y) {
                    player.velocityY = GAME_CONSTANTS.JUMP_FORCE;
                }

                // Attack actions (only if no active attack cooldown)
                const attackIdle = (player.actionCooldowns['attackIdle'] ?? 0) <= 0;
                if (attackIdle) {
                    if (activeActions.includes(ActionType.SPECIAL) && player.energy >= GAME_CONSTANTS.ATTACKS[ActionType.SPECIAL].energyCost) {
                        player.animation = 'special';
                        player.energy -= GAME_CONSTANTS.ATTACKS[ActionType.SPECIAL].energyCost;
                        player.actionCooldowns['activeAttack'] = GAME_CONSTANTS.ATTACKS[ActionType.SPECIAL].cooldownFrames;
                        player.actionCooldowns['attackIdle'] = GAME_CONSTANTS.ATTACKS[ActionType.SPECIAL].cooldownFrames + 10;
                    } else if (activeActions.includes(ActionType.SMASH)) {
                        player.animation = 'smash';
                        player.actionCooldowns['activeAttack'] = GAME_CONSTANTS.ATTACKS[ActionType.SMASH].cooldownFrames;
                        player.actionCooldowns['attackIdle'] = GAME_CONSTANTS.ATTACKS[ActionType.SMASH].cooldownFrames + 10;
                    } else if (activeActions.includes(ActionType.KICK)) {
                        player.animation = 'kick';
                        player.actionCooldowns['activeAttack'] = GAME_CONSTANTS.ATTACKS[ActionType.KICK].cooldownFrames;
                        player.actionCooldowns['attackIdle'] = GAME_CONSTANTS.ATTACKS[ActionType.KICK].cooldownFrames + 10;
                    } else if (activeActions.includes(ActionType.PUNCH)) {
                        player.animation = 'punch';
                        player.actionCooldowns['activeAttack'] = GAME_CONSTANTS.ATTACKS[ActionType.PUNCH].cooldownFrames;
                        player.actionCooldowns['attackIdle'] = GAME_CONSTANTS.ATTACKS[ActionType.PUNCH].cooldownFrames + 10;
                    }
                }

                // Update animation if not now attacking
                if ((player.actionCooldowns['activeAttack'] ?? 0) <= 0) {
                    if (player.y < GAME_CONSTANTS.GROUND_Y) {
                        player.animation = 'jump';
                    } else if (isMoving) {
                        player.animation = 'walk';
                    } else {
                        player.animation = 'idle';
                    }
                }
            } else {
                // Is blocking
                player.animation = 'block';
            }
        }

        // Apply Gravity
        player.velocityY += GAME_CONSTANTS.GRAVITY;
        player.y += player.velocityY;

        // Ground Collision
        if (player.y >= GAME_CONSTANTS.GROUND_Y) {
            player.y = GAME_CONSTANTS.GROUND_Y;
            player.velocityY = 0;
        }

        // Stage Bounds Clamp
        const halfWidth = GAME_CONSTANTS.PLAYER_WIDTH / 2;
        player.x = Math.max(halfWidth, Math.min(player.x, GAME_CONSTANTS.STAGE_WIDTH - halfWidth));
    }

    static updateFacing(p1: PlayerStateNumber, p2: PlayerStateNumber) {
        // Don't update facing during attacks / KO
        if (p1.animation === 'ko' || p2.animation === 'ko') return;
        if (p1.x < p2.x) {
            p1.facing = 'right';
            p2.facing = 'left';
        } else {
            p1.facing = 'left';
            p2.facing = 'right';
        }
    }
}
