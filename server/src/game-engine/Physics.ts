import { GAME_CONSTANTS, PlayerStateNumber, ActionType } from '@rage-arena/shared';

export class Physics {
    static updatePlayer(player: PlayerStateNumber, activeActions: ActionType[]) {
        // Decrease cooldowns and stuns
        if (player.actionCooldowns) {
            for (const key in player.actionCooldowns) {
                if (player.actionCooldowns[key] > 0) {
                    player.actionCooldowns[key]--;
                }
            }
        } else {
            player.actionCooldowns = {};
        }

        // Skip movement if stunned or KO
        if (player.animation === 'ko' || player.actionCooldowns['stun'] > 0) {
            player.velocityY += GAME_CONSTANTS.GRAVITY;
            player.y = Math.min(player.y + player.velocityY, GAME_CONSTANTS.GROUND_Y);
            return;
        }

        // Process Actions
        let isMoving = false;
        let isDucking = false; // Add ducking if needed

        // Cannot act if attacking
        const isAttacking = ['punch', 'kick', 'smash', 'special'].includes(player.animation) && player.actionCooldowns['activeAttack'] > 0;

        if (!isAttacking) {
            if (activeActions.includes(ActionType.BLOCK)) {
                player.isBlocking = true;
            } else {
                player.isBlocking = false;
            }

            if (!player.isBlocking) {
                if (activeActions.includes(ActionType.MOVE_LEFT)) {
                    player.x -= GAME_CONSTANTS.MOVE_SPEED;
                    isMoving = true;
                } else if (activeActions.includes(ActionType.MOVE_RIGHT)) {
                    player.x += GAME_CONSTANTS.MOVE_SPEED;
                    isMoving = true;
                }

                if (activeActions.includes(ActionType.JUMP) && player.y === GAME_CONSTANTS.GROUND_Y) {
                    player.velocityY = GAME_CONSTANTS.JUMP_FORCE;
                }
            }

            // Attack Actions
            if (!player.actionCooldowns['activeAttack']) {
                if (activeActions.includes(ActionType.SPECIAL) && player.energy > GAME_CONSTANTS.ATTACKS[ActionType.SPECIAL].energyCost) {
                    player.animation = 'special';
                    player.energy -= GAME_CONSTANTS.ATTACKS[ActionType.SPECIAL].energyCost;
                    player.actionCooldowns['activeAttack'] = 1; // triggers attack check next frame
                } else if (activeActions.includes(ActionType.SMASH)) {
                    player.animation = 'smash';
                    player.actionCooldowns['activeAttack'] = 1;
                } else if (activeActions.includes(ActionType.KICK)) {
                    player.animation = 'kick';
                    player.actionCooldowns['activeAttack'] = 1;
                } else if (activeActions.includes(ActionType.PUNCH)) {
                    player.animation = 'punch';
                    player.actionCooldowns['activeAttack'] = 1;
                }
            }
        }

        // Apply Gravity
        player.velocityY += GAME_CONSTANTS.GRAVITY;
        player.y += player.velocityY;

        // Ground Collision
        if (player.y > GAME_CONSTANTS.GROUND_Y) {
            player.y = GAME_CONSTANTS.GROUND_Y;
            player.velocityY = 0;
        }

        // Stage Bounds Clamp
        const halfWidth = GAME_CONSTANTS.PLAYER_WIDTH / 2;
        player.x = Math.max(halfWidth, Math.min(player.x, GAME_CONSTANTS.STAGE_WIDTH - halfWidth));

        // Update Animation State if not attacking, hitting, or KO'd
        if (!isAttacking && player.actionCooldowns['stun'] <= 0 && player.animation !== 'ko') {
            if (player.y < GAME_CONSTANTS.GROUND_Y) {
                player.animation = 'jump';
            } else if (player.isBlocking) {
                player.animation = 'block';
            } else if (isMoving) {
                player.animation = 'walk';
            } else {
                player.animation = 'idle';
            }
        }
    }

    static updateFacing(p1: PlayerStateNumber, p2: PlayerStateNumber) {
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
