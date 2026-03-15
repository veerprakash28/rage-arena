import { FighterType, PlayerStateNumber, GAME_CONSTANTS } from '@rage-arena/shared';

// Scale from world coords to canvas. Canvas is fixed 800x450.
const GND = GAME_CONSTANTS.GROUND_Y;

export class FighterSprite {
    static draw(ctx: CanvasRenderingContext2D, player: PlayerStateNumber, time: number) {
        const { x, y, fighter, color, facing, animation } = player;

        ctx.save();
        ctx.translate(x, y);
        if (facing === 'left') ctx.scale(-1, 1);

        const t = time * 0.001; // seconds
        const isGround = y >= GND - 2;

        // Shadow beneath player
        if (isGround) {
            const shadowScale = 1 - Math.max(0, (GND - y) / 200);
            ctx.save();
            ctx.globalAlpha = 0.35 * shadowScale;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(0, 2, 28 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Each fighter has unique proportions
        const props = this.getProps(fighter);
        const { bw, bh, hr, armLen, legLen, legW, armW } = props;

        let breathY = 0;
        if (animation === 'idle') breathY = Math.sin(t * 2) * 2;
        if (animation === 'walk') breathY = Math.abs(Math.sin(t * 8)) * -3;

        const bodyY = -bh + breathY;
        const headY = bodyY - hr * 2 - 2 + breathY;

        // --- FIGURE OUT POSE ---
        let poseWalkCycle = 0;
        let punchExtend = 0;
        let kickExtend = 0;
        let blockUp = false;
        let smashUp = 0;
        let inHit = false;
        let inKO = false;

        if (animation === 'walk') poseWalkCycle = Math.sin(t * 10);
        if (animation === 'punch') punchExtend = 1;
        if (animation === 'kick') kickExtend = 1;
        if (animation === 'smash') smashUp = 1;
        if (animation === 'block') blockUp = true;
        if (animation === 'hit') inHit = true;
        if (animation === 'ko') inKO = true;
        if (animation === 'special') { punchExtend = 1; smashUp = 0.5; }

        if (inKO) {
            ctx.rotate(Math.PI / 2);
            ctx.translate(-30, -bh / 2);
        } else if (inHit) {
            ctx.rotate(-0.25);
            ctx.translate(-8, 0);
        }

        // === BODY ===
        this.drawBody(ctx, bw, bh, bodyY, color, animation, fighter);

        // === LEGS ===
        this.drawLegs(ctx, bw, bh, bodyY, legLen, legW, poseWalkCycle, kickExtend, inKO, color, fighter);

        // === BACK ARM ===
        this.drawArm(ctx, bw, bh, bodyY, armLen, armW, punchExtend, smashUp, blockUp, poseWalkCycle, true, color, fighter, t);

        // === HEAD ===
        this.drawHead(ctx, hr, headY, color, fighter, blockUp, t, player.hp);

        // === FRONT ARM ===
        this.drawArm(ctx, bw, bh, bodyY, armLen, armW, punchExtend, smashUp, blockUp, poseWalkCycle, false, color, fighter, t);

        // === SPECIAL EFFECT ===
        if (animation === 'special') {
            this.drawSpecialEffect(ctx, bw, bodyY, facing, t);
        }

        ctx.restore();
    }

    private static getProps(fighter: FighterType) {
        if (fighter === FighterType.IRON_BOXER) {
            return { bw: 28, bh: 65, hr: 16, armLen: 32, legLen: 36, legW: 10, armW: 11 };
        } else if (fighter === FighterType.SHADOW_NINJA) {
            return { bw: 18, bh: 72, hr: 13, armLen: 38, legLen: 42, legW: 7, armW: 7 };
        } else { // Street Brawler
            return { bw: 22, bh: 68, hr: 15, armLen: 35, legLen: 38, legW: 9, armW: 9 };
        }
    }

    private static drawBody(ctx: CanvasRenderingContext2D, bw: number, bh: number, bodyY: number, color: string, anim: string, fighter: FighterType) {
        // Main torso with gradient
        const grad = ctx.createLinearGradient(-bw, bodyY, bw, bodyY + bh);
        grad.addColorStop(0, lighten(color, 40));
        grad.addColorStop(1, darken(color, 30));
        ctx.fillStyle = grad;

        // Slightly rounded body
        ctx.beginPath();
        const topW = bw * (anim === 'block' ? 0.8 : 1);
        ctx.moveTo(-topW, bodyY);
        ctx.lineTo(topW, bodyY);
        ctx.lineTo(bw * 0.9, bodyY + bh);
        ctx.lineTo(-bw * 0.9, bodyY + bh);
        ctx.closePath();
        ctx.fill();

        // Belt / detail
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(-bw * 0.9, bodyY + bh * 0.55, bw * 1.8, bh * 0.12);

        // Fighter-specific chest detail
        if (fighter === FighterType.IRON_BOXER) {
            // Chest armor plates
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.ellipse(0, bodyY + bh * 0.25, bw * 0.5, bh * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (fighter === FighterType.SHADOW_NINJA) {
            // Sash
            ctx.fillStyle = '#cc2222';
            ctx.fillRect(-2, bodyY + bh * 0.45, 4, bh * 0.4);
            ctx.fillRect(-bw * 0.4, bodyY + bh * 0.55, bw * 0.8, 3);
        }
    }

    private static drawHead(ctx: CanvasRenderingContext2D, hr: number, headY: number, color: string, fighter: FighterType, blocking: boolean, t: number, hp: number) {
        // Neck
        ctx.fillStyle = darken(color, 10);
        ctx.fillRect(-5, headY + hr, 10, 10);

        // Head shape
        const grad = ctx.createRadialGradient(-hr * 0.3, headY - hr * 0.2, 2, 0, headY, hr * 1.4);
        grad.addColorStop(0, lighten(color, 50));
        grad.addColorStop(1, darken(color, 20));
        ctx.fillStyle = grad;
        ctx.beginPath();

        if (fighter === FighterType.IRON_BOXER) {
            // Squared helmet
            ctx.roundRect(-hr, headY - hr, hr * 2, hr * 2, 4);
        } else if (fighter === FighterType.SHADOW_NINJA) {
            // Pointed head wrap
            ctx.moveTo(0, headY - hr * 1.3);
            ctx.lineTo(hr, headY + hr);
            ctx.lineTo(-hr, headY + hr);
            ctx.closePath();
        } else {
            ctx.arc(0, headY, hr, 0, Math.PI * 2);
        }
        ctx.fill();

        // Eyes / visor
        if (fighter === FighterType.IRON_BOXER) {
            // Single visor slit
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 8;
            ctx.fillRect(-hr * 0.7, headY - 3, hr * 1.4, 5);
            ctx.shadowBlur = 0;
        } else if (fighter === FighterType.SHADOW_NINJA) {
            // Two glowing eyes
            ctx.fillStyle = '#ff4400';
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 6;
            ctx.beginPath(); ctx.arc(-4, headY - hr * 0.2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(4, headY - hr * 0.2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Normal shades
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(-hr * 0.7, headY - 4, hr * 1.4, 6);
            // Glint
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(-hr * 0.7, headY - 4, hr * 1.4, 2);
        }

        // Low HP flash red
        if (hp < 30) {
            ctx.globalAlpha = 0.2 + Math.abs(Math.sin(t * 8)) * 0.3;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(0, headY, hr, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    private static drawArm(
        ctx: CanvasRenderingContext2D,
        bw: number, bh: number, bodyY: number,
        armLen: number, armW: number,
        punchExtend: number, smashUp: number, blockUp: boolean,
        walkCycle: number, isBack: boolean,
        color: string, fighter: FighterType, t: number
    ) {
        ctx.save();
        const shoulderX = isBack ? -bw * 0.8 : bw * 0.8;
        const shoulderY = bodyY + bh * 0.15;
        ctx.translate(shoulderX, shoulderY);

        let angle = isBack ? 0.6 : 0.9;
        let len = armLen;
        let handSize = armW * 1.2;

        if (blockUp) {
            angle = isBack ? -0.6 : -1.0;
            ctx.translate(isBack ? 0 : 8, -12);
        } else if (smashUp > 0 && !isBack) {
            angle = -2.0 - smashUp * 0.5;
            len = armLen * 1.3;
        } else if (punchExtend > 0 && !isBack) {
            angle = 0; // straight punch forward
            len = armLen * 1.4;
        } else if (walkCycle !== 0) {
            angle += (isBack ? -walkCycle : walkCycle) * 0.5;
        } else {
            angle += Math.sin(t * 2 + (isBack ? Math.PI : 0)) * 0.05;
        }

        ctx.rotate(angle);

        // Upper arm
        const armGrad = ctx.createLinearGradient(0, 0, 0, len);
        armGrad.addColorStop(0, lighten(color, 20));
        armGrad.addColorStop(1, darken(color, 20));
        ctx.fillStyle = armGrad;
        ctx.beginPath();
        ctx.roundRect(-armW / 2, 0, armW, len * 0.55, 3);
        ctx.fill();

        ctx.translate(0, len * 0.55);

        // Forearm (elbow bend)
        let elbowAngle = isBack ? 0.3 : -0.2;
        if (punchExtend > 0 && !isBack) elbowAngle = 0;
        if (blockUp) elbowAngle = isBack ? -0.5 : 0.5;
        ctx.rotate(elbowAngle);

        ctx.fillStyle = darken(color, 10);
        ctx.beginPath();
        ctx.roundRect(-armW / 2, 0, armW, len * 0.45, 3);
        ctx.fill();

        ctx.translate(0, len * 0.45);

        // Fist / Glove
        if (fighter === FighterType.IRON_BOXER) {
            // Boxing glove
            ctx.fillStyle = '#cc2222';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = punchExtend > 0 ? 15 : 0;
        } else {
            ctx.fillStyle = isBack ? darken(color, 20) : lighten(color, 30);
        }
        ctx.beginPath();
        ctx.arc(0, 0, handSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    private static drawLegs(
        ctx: CanvasRenderingContext2D,
        bw: number, bh: number, bodyY: number,
        legLen: number, legW: number,
        walkCycle: number, kickExtend: number, inKO: boolean,
        color: string, fighter: FighterType
    ) {
        const hipY = bodyY + bh;
        const legColor = darken(color, 40);
        const footColor = '#111';

        [-1, 1].forEach((side, i) => {
            ctx.save();
            ctx.translate(side * bw * 0.45, hipY);

            let upperAngle = side * 0.15;
            let lowerAngle = side * 0.05;

            if (walkCycle !== 0 && !inKO) {
                upperAngle = side * walkCycle * 0.5;
                lowerAngle = -Math.abs(walkCycle) * 0.4;
            }
            if (kickExtend > 0 && i === 1) { // front leg kicks
                upperAngle = -1.4;
                lowerAngle = 0.3;
            }

            ctx.rotate(upperAngle);
            // Thigh
            ctx.fillStyle = legColor;
            ctx.beginPath();
            ctx.roundRect(-legW / 2, 0, legW, legLen * 0.5, 3);
            ctx.fill();

            ctx.translate(0, legLen * 0.5);
            ctx.rotate(lowerAngle);

            // Shin
            ctx.fillStyle = darken(legColor, 15);
            ctx.beginPath();
            ctx.roundRect(-legW / 2, 0, legW, legLen * 0.5, 3);
            ctx.fill();

            ctx.translate(0, legLen * 0.5);

            // Shoe / Foot
            ctx.fillStyle = footColor;
            ctx.beginPath();
            ctx.roundRect(-legW / 2 - 2, 0, legW + 10, legW * 0.8, 2);
            ctx.fill();

            ctx.restore();
        });
    }

    private static drawSpecialEffect(ctx: CanvasRenderingContext2D, bw: number, bodyY: number, facing: string, t: number) {
        ctx.save();
        const dir = facing === 'right' ? 1 : -1;
        ctx.translate(dir * (bw + 40), bodyY * 0.6);
        const pulse = 0.7 + Math.sin(t * 20) * 0.3;
        ctx.globalAlpha = pulse;
        const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 35 * pulse);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.9)');
        grad.addColorStop(0.5, 'rgba(0, 120, 255, 0.6)');
        grad.addColorStop(1, 'rgba(0, 0, 200, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 35 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

// Color helpers
function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}
function lighten(hex: string, amt: number): string {
    try {
        const [r, g, b] = hexToRgb(hex);
        return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`;
    } catch { return hex; }
}
function darken(hex: string, amt: number): string {
    try {
        const [r, g, b] = hexToRgb(hex);
        return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`;
    } catch { return hex; }
}
