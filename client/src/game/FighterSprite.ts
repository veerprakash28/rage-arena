import { FighterType, PlayerStateNumber, GAME_CONSTANTS } from '@rage-arena/shared';

export class FighterSprite {
    // We use the player state to determine rendering
    static draw(ctx: CanvasRenderingContext2D, player: PlayerStateNumber, time: number) {
        const { x, y, fighter, color, facing, animation } = player;

        ctx.save();
        ctx.translate(x, y); // Origin at bottom center of player bounds
        if (facing === 'left') {
            ctx.scale(-1, 1);
        }

        // Breathing sub-animation offset
        let breatheY = 0;
        if (animation === 'idle') {
            breatheY = Math.sin(time * 0.005) * 3;
        } else if (animation === 'walk') {
            breatheY = Math.abs(Math.sin(time * 0.015)) * -5;
        }

        const drawShadow = () => {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            // Shadow scales with Y (jump height)
            const shrink = Math.max(0, (GAME_CONSTANTS.GROUND_Y - y) * 0.1);
            ctx.ellipse(0, 0, 30 - shrink, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        if (y >= GAME_CONSTANTS.GROUND_Y) {
            drawShadow();
        }

        // Base properties based on fighter type
        let bodyWidth = 40;
        let bodyHeight = 80;
        let headRadius = 15;

        if (fighter === FighterType.IRON_BOXER) {
            bodyWidth = 50; bodyHeight = 70; headRadius = 18;
        } else if (fighter === FighterType.SHADOW_NINJA) {
            bodyWidth = 34; bodyHeight = 85; headRadius = 14;
        }

        // Hit reaction
        if (animation === 'hit') {
            ctx.rotate(-0.2); // lean back
            ctx.translate(-10, 0);
        } else if (animation === 'ko') {
            ctx.rotate(-Math.PI / 2); // lie down flat
            ctx.translate(-40, 40);
            breatheY = 0;
        }

        const headY = -bodyHeight - 15 + breatheY;
        const bodyY = -bodyHeight + breatheY;

        // Head
        ctx.fillStyle = animation === 'hit' ? '#ff0000' : color;
        ctx.beginPath();
        ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // Eye/Visor
        ctx.fillStyle = '#fff';
        if (fighter === FighterType.SHADOW_NINJA) {
            ctx.fillRect(5, headY - 4, 12, 4); // Ninja slit
        } else if (fighter === FighterType.IRON_BOXER) {
            // Boxer single eye glow
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(8, headY - 2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Brawler shades
            ctx.fillRect(2, headY - 5, 15, 6);
        }

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(-bodyWidth / 2, bodyY, bodyWidth, bodyHeight);

        // Belt / details
        ctx.fillStyle = '#111';
        ctx.fillRect(-bodyWidth / 2, bodyY + bodyHeight / 2, bodyWidth, 10);
        if (fighter === FighterType.SHADOW_NINJA) {
            ctx.fillStyle = '#ff2a2a'; // red sash
            ctx.fillRect(-bodyWidth / 2, bodyY + bodyHeight / 2, bodyWidth, 5);
            ctx.fillRect(-bodyWidth / 2 - 5, bodyY + bodyHeight / 2 + 2, 10, 20); // dangling sash
        }

        // Arms
        ctx.fillStyle = color === '#111' || color.toLowerCase() === '#ffffff' ? '#555' : '#fff';
        // Back arm (draw first)
        this.drawArm(ctx, -10, bodyY + 10, animation, time, true, fighter);

        // Legs
        ctx.fillStyle = '#222';
        this.drawLeg(ctx, -10, bodyY + bodyHeight, animation, time, true, fighter); // Back leg
        this.drawLeg(ctx, 10, bodyY + bodyHeight, animation, time, false, fighter); // Front leg

        // Front arm (draw last)
        ctx.fillStyle = color === '#111' || color.toLowerCase() === '#ffffff' ? '#888' : '#e2e8f0';
        this.drawArm(ctx, 10, bodyY + 10, animation, time, false, fighter);

        ctx.restore();

        // Draw hitbox visualization for debugging
        // ctx.strokeStyle = 'cyan';
        // ctx.strokeRect(player.x - GAME_CONSTANTS.PLAYER_WIDTH/2, player.y - GAME_CONSTANTS.PLAYER_HEIGHT, GAME_CONSTANTS.PLAYER_WIDTH, GAME_CONSTANTS.PLAYER_HEIGHT);
    }

    private static drawArm(ctx: CanvasRenderingContext2D, dx: number, dy: number, anim: string, time: number, isBack: boolean, fighter: FighterType) {
        ctx.save();
        ctx.translate(dx, dy);

        let angle = isBack ? 0.5 : 0.8;
        let length = 35;
        let handSize = 10;
        if (fighter === FighterType.IRON_BOXER) handSize = 18; // big gloves

        if (anim === 'idle') {
            angle += Math.sin(time * 0.005) * 0.1;
        } else if (anim === 'walk') {
            angle += Math.sin(time * 0.015 + (isBack ? Math.PI : 0)) * 0.5;
        } else if (anim === 'punch' && !isBack) {
            angle = -1.5; // Straight forward
            length = 45;
        } else if (anim === 'smash' && !isBack) {
            angle = -2.5; // Reaching up/forward
            length = 55;
            handSize *= 1.5; // giant hand
        } else if (anim === 'special' && !isBack) {
            angle = -1.0;
            length = 50;
            // Draw energy blast
            ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(length + 30, 0, Math.random() * 20 + 20, 0, Math.PI * 2);
            ctx.fill();
        } else if (anim === 'block') {
            angle = isBack ? -0.5 : -0.8; // Arms up covering face
            ctx.translate(5, -15);
        } else if (anim === 'ko') {
            angle = isBack ? 2.5 : 3.0; // Arms sprawled out
        }

        ctx.rotate(angle);
        ctx.fillRect(-5, 0, 10, length);
        // Hand/Glove
        if (fighter === FighterType.IRON_BOXER) ctx.fillStyle = '#ff2a2a'; // Red boxing gloves
        ctx.beginPath();
        ctx.arc(0, length, handSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    private static drawLeg(ctx: CanvasRenderingContext2D, dx: number, dy: number, anim: string, time: number, isBack: boolean, _fighter: FighterType) {
        ctx.save();
        ctx.translate(dx, dy);

        let angle = isBack ? -0.2 : 0.2;
        let length = 40;

        if (anim === 'idle') {
            // slight bend
            length = 38;
        } else if (anim === 'walk') {
            angle = Math.sin(time * 0.015 + (isBack ? Math.PI : 0)) * 0.6;
        } else if (anim === 'jump') {
            angle = isBack ? 0.5 : -0.5;
            length = 30; // tucked
        } else if (anim === 'kick' && !isBack) {
            angle = -1.2; // High kick
            length = 55;
        } else if (anim === 'ko') {
            angle = isBack ? 0.2 : -0.2;
        }

        ctx.rotate(angle);
        ctx.fillRect(-6, 0, 12, length);
        // Foot
        ctx.fillRect(-6, length, 18, 8); // foot pointing right (since we scale entirely based on facing)

        ctx.restore();
    }
}
