import { FighterType, PlayerStateNumber, GAME_CONSTANTS } from '@rage-arena/shared';

const GND = GAME_CONSTANTS.GROUND_Y;

export class FighterSprite {
    static draw(ctx: CanvasRenderingContext2D, player: PlayerStateNumber, time: number) {
        const { x, y, fighter, color, facing, animation, hp } = player;

        ctx.save();
        ctx.translate(x, y);
        if (facing === 'left') ctx.scale(-1, 1);

        const t = time * 0.001; // seconds
        const isGround = y >= GND - 2;

        // --- Core Proportions ---
        const props = this.getProps(fighter);
        const { bw, bh, hr, legLen, armLen } = props;

        // Dynamic breathing
        let breathY = 0;
        if (animation === 'idle') breathY = Math.sin(t * 3) * 2;
        if (animation === 'walk') breathY = Math.abs(Math.sin(t * 12)) * -4;

        const bodyY = -bh + breathY;
        const headY = bodyY - hr * 1.5 + breathY;

        // --- Animation States ---
        let walkCycle = 0;
        let punchT = 0;
        let kickT = 0;
        let smashT = 0;
        let isBlocking = false;
        let inHit = false;
        let inKO = false;

        if (animation === 'walk') walkCycle = Math.sin(t * 12);
        if (animation === 'punch') punchT = 1;
        if (animation === 'kick') kickT = 1;
        if (animation === 'smash') smashT = 1;
        if (animation === 'block') isBlocking = true;
        if (animation === 'hit') inHit = true;
        if (animation === 'ko') inKO = true;
        if (animation === 'special') { punchT = 1; smashT = 0.5; }

        // --- Master Transforms ---
        if (inKO) {
            ctx.rotate(Math.PI / 2);
            ctx.translate(-20, -bh / 2);
        } else if (inHit) {
            ctx.rotate(-0.3);
            ctx.translate(-10, 0);
        }

        // --- Draw Shadow ---
        if (isGround && !inKO) {
            const shadowScale = 1 - Math.max(0, (GND - y) / 200);
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.ellipse(0, 0, bw * 1.5 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // === DRAW PASSES ===
        // Back Arm -> Back Leg -> Body -> Head -> Front Leg -> Front Arm
        this.drawArm(ctx, bw, bodyY, armLen, true, walkCycle, punchT, smashT, isBlocking, color, fighter, t);
        this.drawLeg(ctx, bw, bh, bodyY, legLen, true, walkCycle, kickT, inKO, color, t);
        this.drawBody(ctx, bw, bh, bodyY, color, fighter, isBlocking);
        this.drawHead(ctx, hr, headY, color, fighter, hp, t);
        this.drawLeg(ctx, bw, bh, bodyY, legLen, false, walkCycle, kickT, inKO, color, t);
        this.drawArm(ctx, bw, bodyY, armLen, false, walkCycle, punchT, smashT, isBlocking, color, fighter, t);

        // Special VFX overlay
        if (animation === 'special') {
            this.drawEnergyAura(ctx, bodyY, bh, color, t);
        }

        ctx.restore();
    }

    private static getProps(fighter: FighterType) {
        if (fighter === FighterType.IRON_BOXER) {
            return { bw: 32, bh: 70, hr: 18, armLen: 38, legLen: 40 };
        } else if (fighter === FighterType.SHADOW_NINJA) {
            return { bw: 20, bh: 76, hr: 14, armLen: 44, legLen: 46 };
        } else {
            return { bw: 26, bh: 72, hr: 16, armLen: 40, legLen: 42 }; // Street Brawler
        }
    }

    private static drawBody(ctx: CanvasRenderingContext2D, bw: number, bh: number, bodyY: number, color: string, fighter: FighterType, blocking: boolean) {
        const lean = blocking ? -0.2 : 0.1;
        ctx.save();
        ctx.translate(0, bodyY + bh);
        ctx.rotate(lean);
        ctx.translate(0, -bh);

        // Advanced Torso Gradient
        const grad = ctx.createLinearGradient(-bw, 0, bw, bh);
        grad.addColorStop(0, lighten(color, 50));
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, darken(color, 50));
        ctx.fillStyle = grad;

        // Shoulders to waist taper
        ctx.beginPath();
        const topW = bw * (blocking ? 0.8 : 1);
        ctx.moveTo(-topW, 0);
        ctx.lineTo(topW, 0);
        ctx.lineTo(bw * 0.8, bh);
        ctx.lineTo(-bw * 0.8, bh);
        ctx.closePath();
        ctx.fill();

        // High gloss highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(topW * 0.8, 0);
        ctx.lineTo(bw * 0.6, bh);
        ctx.lineTo(0, bh);
        ctx.fill();

        // Fighter Specifics
        if (fighter === FighterType.IRON_BOXER) {
            ctx.fillStyle = '#111';
            ctx.fillRect(-bw * 0.8, bh * 0.4, bw * 1.6, bh * 0.2); // Mid chassis gap
            // Arc reactor center
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, bh * 0.3, bw * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else if (fighter === FighterType.SHADOW_NINJA) {
            ctx.strokeStyle = '#cc0000';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-topW, 0);
            ctx.lineTo(bw * 0.8, bh * 0.8);
            ctx.stroke(); // Ninja Sash
        } else {
            // Street Brawler Jacket Open
            ctx.fillStyle = '#222';
            ctx.fillRect(-5, 0, 10, bh * 0.9);
        }

        ctx.restore();
    }

    private static drawHead(ctx: CanvasRenderingContext2D, hr: number, headY: number, color: string, fighter: FighterType, hp: number, t: number) {
        ctx.save();
        ctx.translate(0, headY);

        // Dark neck
        ctx.fillStyle = darken(color, 60);
        ctx.fillRect(-hr * 0.3, hr * 0.5, hr * 0.6, hr);

        // Head Base
        const hGrad = ctx.createRadialGradient(-hr * 0.3, -hr * 0.3, hr * 0.2, 0, 0, hr);
        hGrad.addColorStop(0, lighten(color, 40));
        hGrad.addColorStop(1, darken(color, 30));
        ctx.fillStyle = hGrad;

        if (fighter === FighterType.IRON_BOXER) {
            // Mecha Box Head
            ctx.roundRect(-hr, -hr, hr * 2.2, hr * 2.2, 5);
            ctx.fill();
            // Glowing visor
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.fillRect(-hr * 0.8, -hr * 0.2, hr * 1.8, hr * 0.4);
            ctx.shadowBlur = 0;
        } else if (fighter === FighterType.SHADOW_NINJA) {
            // Pointed ninja hood
            ctx.beginPath();
            ctx.moveTo(0, -hr * 1.5);
            ctx.lineTo(hr * 1.2, hr);
            ctx.lineTo(-hr * 1.2, hr);
            ctx.fill();
            // Demonic eyes
            ctx.fillStyle = '#ff003c';
            ctx.shadowColor = '#ff003c';
            ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(-hr * 0.2, -hr * 0.2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(hr * 0.4, -hr * 0.2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Smooth domed head
            ctx.beginPath();
            ctx.arc(0, 0, hr, 0, Math.PI * 2);
            ctx.fill();
            // Tech-Glasses
            ctx.fillStyle = '#111';
            ctx.fillRect(-hr * 0.8, -hr * 0.3, hr * 1.6, hr * 0.5);
            ctx.fillStyle = 'rgba(255,255,255,0.8)'; // Lens glare
            ctx.fillRect(hr * 0.2, -hr * 0.3, 2, hr * 0.5);
        }

        // Critical HP flashing overlay
        if (hp < 30) {
            const dangerAlpha = 0.2 + 0.4 * Math.abs(Math.sin(t * 15));
            ctx.globalAlpha = dangerAlpha;
            ctx.fillStyle = '#ff0000';
            ctx.globalCompositeOperation = 'source-over';
            ctx.beginPath(); ctx.arc(0, 0, hr * 1.1, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }

    private static drawArm(ctx: CanvasRenderingContext2D, bw: number, bodyY: number, armLen: number, isBack: boolean, walkCycle: number, punchT: number, smashT: number, blocking: boolean, color: string, fighter: FighterType, t: number) {
        ctx.save();
        const shoulderX = isBack ? -bw * 0.6 : bw * 0.6;
        const shoulderY = bodyY + 10;
        ctx.translate(shoulderX, shoulderY);

        // Core IK Angles
        let upperAngle = isBack ? 0.3 : 0.8;
        let lowerAngle = isBack ? 1.0 : 0.5;

        if (blocking) {
            upperAngle = isBack ? -0.5 : -1.2;
            lowerAngle = isBack ? -1.0 : -2.0;
        } else if (smashT > 0 && !isBack) {
            upperAngle = -2.5;
            lowerAngle = -0.5;
            ctx.shadowColor = color;
            ctx.shadowBlur = 20;
        } else if (punchT > 0 && !isBack) {
            upperAngle = -0.2;
            lowerAngle = 0.1; // Straight punch
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 10;
        } else {
            // Walk swing
            upperAngle += (isBack ? -walkCycle : walkCycle) * 0.6;
            // Idle breathing swing
            upperAngle += Math.sin(t * 2 + (isBack ? Math.PI : 0)) * 0.05;
        }

        const armW = 12;
        const l1 = armLen * 0.5;
        const l2 = armLen * 0.5;

        // Upper Arm
        ctx.rotate(upperAngle);
        ctx.fillStyle = darken(color, isBack ? 40 : 10);
        ctx.beginPath(); ctx.roundRect(-armW / 2, 0, armW, l1 + armW / 2, armW / 2); ctx.fill();

        // Elbow Joint
        ctx.translate(0, l1);
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(0, 0, armW * 0.6, 0, Math.PI * 2); ctx.fill();

        // Lower Arm
        ctx.rotate(lowerAngle);
        ctx.fillStyle = darken(color, isBack ? 50 : 20);
        ctx.beginPath(); ctx.roundRect(-armW / 2, 0, armW, l2, armW / 2); ctx.fill();

        // Fist / Weapon
        ctx.translate(0, l2);

        if (fighter === FighterType.IRON_BOXER && !isBack) {
            // Massive glowing boxing glove
            ctx.fillStyle = punchT || smashT ? '#ff0055' : '#aa0000';
            ctx.shadowColor = '#ff0055';
            ctx.beginPath(); ctx.arc(0, armW, armW * 1.8, 0, Math.PI * 2); ctx.fill();
        } else if (fighter === FighterType.SHADOW_NINJA && !isBack) {
            // Energy blade
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.arc(0, armW / 2, armW, 0, Math.PI * 2); ctx.fill(); // hand
            ctx.fillStyle = '#ff003c';
            ctx.shadowColor = '#ff003c';
            ctx.shadowBlur = 15;
            ctx.fillRect(-2, armW, 4, 35); // blade
        } else {
            ctx.fillStyle = isBack ? darken(color, 60) : lighten(color, 20);
            ctx.beginPath(); ctx.arc(0, armW / 2, armW * 1.2, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }

    private static drawLeg(ctx: CanvasRenderingContext2D, bw: number, bh: number, bodyY: number, legLen: number, isBack: boolean, walkCycle: number, kickT: number, inKO: boolean, color: string, t: number) {
        ctx.save();
        const hipX = isBack ? -bw * 0.4 : bw * 0.4;
        const hipY = bodyY + bh - 5;
        ctx.translate(hipX, hipY);

        let upperAngle = isBack ? 0.2 : -0.2;
        let lowerAngle = 0.3;

        if (inKO) {
            upperAngle = isBack ? 0.5 : -0.3;
            lowerAngle = 0.1;
        } else if (kickT > 0 && !isBack) {
            upperAngle = -1.5;   // massive high kick
            lowerAngle = 0.1;    // straight out
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 20;
        } else if (walkCycle !== 0) {
            upperAngle = (isBack ? -walkCycle : walkCycle) * 0.6;
            lowerAngle = walkCycle * (isBack ? 1 : -1) > 0 ? 0 : 0.6; // bend knee on backswing
        }

        const legW = 14;
        const l1 = legLen * 0.5;
        const l2 = legLen * 0.5;

        // Thigh
        ctx.rotate(upperAngle);
        ctx.fillStyle = darken(color, isBack ? 60 : 30);
        ctx.beginPath(); ctx.roundRect(-legW / 2, 0, legW, l1 + legW / 2, legW / 2); ctx.fill();

        // Knee Joint
        ctx.translate(0, l1);
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(0, 0, legW * 0.6, 0, Math.PI * 2); ctx.fill();

        // Shin
        ctx.rotate(lowerAngle);
        ctx.fillStyle = darken(color, isBack ? 70 : 40);
        ctx.beginPath(); ctx.roundRect(-legW * 0.4, 0, legW * 0.8, l2, legW * 0.4); ctx.fill();

        // Boot
        ctx.translate(0, l2);
        ctx.fillStyle = isBack ? '#000' : '#222';
        ctx.beginPath();
        // Pointy boot forward
        ctx.moveTo(-legW, 0);
        ctx.lineTo(legW * 1.5, 0);
        ctx.lineTo(legW * 1.5, 12);
        ctx.lineTo(-legW, 12);
        ctx.fill();

        ctx.restore();
    }

    private static drawEnergyAura(ctx: CanvasRenderingContext2D, bodyY: number, bh: number, color: string, t: number) {
        ctx.save();
        ctx.translate(0, bodyY + bh * 0.5);
        ctx.globalCompositeOperation = 'screen';

        const pulse = 0.5 + Math.abs(Math.sin(t * 30)) * 0.5;

        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 80 * pulse);
        grad.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
        grad.addColorStop(0.3, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 80 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Color Utility Functions
function hexToRgb(hex: string): [number, number, number] {
    if (hex.startsWith('#')) hex = hex.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16);
    return [num >> 16, (num >> 8) & 255, num & 255];
}

function lighten(hex: string, percent: number): string {
    const [r, g, b] = hexToRgb(hex);
    const adjust = Math.floor(255 * (percent / 100));
    const nr = Math.min(255, r + adjust);
    const ng = Math.min(255, g + adjust);
    const nb = Math.min(255, b + adjust);
    return `rgb(${nr}, ${ng}, ${nb})`;
}

function darken(hex: string, percent: number): string {
    const [r, g, b] = hexToRgb(hex);
    const adjust = Math.floor(255 * (percent / 100));
    const nr = Math.max(0, r - adjust);
    const ng = Math.max(0, g - adjust);
    const nb = Math.max(0, b - adjust);
    return `rgb(${nr}, ${ng}, ${nb})`;
}
