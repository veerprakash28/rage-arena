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

        // --- Core Proportions (More Humanoid) ---
        const props = this.getProps(fighter);
        const { bw, bh, hr, legLen, armLen } = props;

        // Dynamic breathing
        let breathY = 0;
        if (animation === 'idle') breathY = Math.sin(t * 3) * 2;
        if (animation === 'walk') breathY = Math.abs(Math.sin(t * 12)) * -4;

        const bodyY = -bh + breathY;
        const headY = bodyY - hr * 1.2 + breathY;

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
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.filter = 'blur(4px)';
            ctx.beginPath();
            ctx.ellipse(0, 0, bw * 1.5 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Styling Base: We use `lineJoin = round` to make them look like contiguous muscle/clothing forms instead of blocks
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // === DRAW PASSES (Back to Front) ===
        this.drawLeg(ctx, bw, bh, bodyY, legLen, true, walkCycle, kickT, inKO, color, fighter);
        this.drawArm(ctx, bw, bodyY, armLen, true, walkCycle, punchT, smashT, isBlocking, color, fighter, t);

        this.drawBody(ctx, bw, bh, bodyY, color, fighter, isBlocking);

        this.drawLeg(ctx, bw, bh, bodyY, legLen, false, walkCycle, kickT, inKO, color, fighter);
        this.drawHead(ctx, hr, headY, color, fighter, hp, t);
        this.drawArm(ctx, bw, bodyY, armLen, false, walkCycle, punchT, smashT, isBlocking, color, fighter, t);

        // Special VFX overlay
        if (animation === 'special') {
            this.drawEnergyAura(ctx, bodyY, bh, color, t);
        }

        ctx.restore();
    }

    private static getProps(fighter: FighterType) {
        if (fighter === FighterType.IRON_BOXER) {
            // Bulky top-heavy bruiser
            return { bw: 32, bh: 65, hr: 16, armLen: 38, legLen: 38 };
        } else if (fighter === FighterType.SHADOW_NINJA) {
            // Slender athletic
            return { bw: 22, bh: 72, hr: 13, armLen: 42, legLen: 46 };
        } else {
            // Balanced Street Brawler
            return { bw: 28, bh: 68, hr: 15, armLen: 40, legLen: 42 };
        }
    }

    // Drawing a single thick contiguous path for limbs creates a "muscle/sleeve" look rather than disconnected robot rectangles.
    private static drawContiguousLimb(ctx: CanvasRenderingContext2D, len1: number, len2: number, w: number, angle1: number, angle2: number, color: string, isArm: boolean) {
        ctx.save();
        ctx.rotate(angle1);

        // Use a thick stroke to draw the limb as a single fluid shape
        ctx.lineWidth = w;
        ctx.strokeStyle = color;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, len1); // upper limb
        ctx.stroke();

        ctx.translate(0, len1);
        ctx.rotate(angle2);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, len2); // lower limb
        ctx.stroke();

        // Inner shadow/highlight for depth to make it look 3D instead of flat
        ctx.lineWidth = w * 0.4;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.moveTo(w * 0.2, 0);
        ctx.lineTo(w * 0.2, len2 * 0.8);
        ctx.stroke();

        ctx.restore();
    }

    private static drawBody(ctx: CanvasRenderingContext2D, bw: number, bh: number, bodyY: number, color: string, fighter: FighterType, blocking: boolean) {
        const lean = blocking ? -0.2 : 0.1;
        ctx.save();
        ctx.translate(0, bodyY + bh);
        ctx.rotate(lean);
        ctx.translate(0, -bh);

        const chestW = blocking ? bw * 0.8 : bw;
        const waistW = bw * 0.7;

        // V-Taper Torso shape (Comic style)
        ctx.beginPath();
        ctx.moveTo(-chestW, 0); // Top Left Shoulder
        ctx.lineTo(chestW, 0);  // Top Right Shoulder
        // Curve to waist
        ctx.bezierCurveTo(chestW, bh * 0.5, waistW, bh * 0.8, waistW, bh);
        ctx.lineTo(-waistW, bh);
        ctx.bezierCurveTo(-waistW, bh * 0.8, -chestW, bh * 0.5, -chestW, 0);
        ctx.closePath();

        // Anime shading gradient
        const grad = ctx.createLinearGradient(-chestW, 0, chestW, bh);
        grad.addColorStop(0, lighten(color, 20));
        grad.addColorStop(0.3, color);
        grad.addColorStop(1, darken(color, 50));
        ctx.fillStyle = grad;
        ctx.fill();

        // Add muscular/clothing definition lines
        ctx.strokeStyle = darken(color, 60);
        ctx.lineWidth = 2;
        ctx.stroke();

        if (fighter === FighterType.IRON_BOXER) {
            // Boxing trunks / belt
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.moveTo(-waistW * 1.1, bh * 0.7);
            ctx.lineTo(waistW * 1.1, bh * 0.7);
            ctx.lineTo(waistW * 1.1, bh);
            ctx.lineTo(-waistW * 1.1, bh);
            ctx.fill();

            // Champion belt buckle
            ctx.fillStyle = '#ffd700'; // Gold
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.ellipse(0, bh * 0.85, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Pectoral lines
            ctx.strokeStyle = darken(color, 40);
            ctx.beginPath(); ctx.moveTo(-chestW * 0.6, bh * 0.3); ctx.lineTo(0, bh * 0.4); ctx.lineTo(chestW * 0.6, bh * 0.3); ctx.stroke();

        } else if (fighter === FighterType.SHADOW_NINJA) {
            // Ninja gi cross-wrap
            ctx.strokeStyle = darken(color, 60);
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-chestW * 0.8, 0); ctx.lineTo(waistW * 0.6, bh * 0.6); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(chestW * 0.8, 0); ctx.lineTo(-waistW * 0.6, bh * 0.6); ctx.stroke();

            // Red Sash
            ctx.fillStyle = '#dd0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.fillRect(-waistW * 1.2, bh * 0.6, waistW * 2.4, 12);
            // Sash tails blowing
            ctx.beginPath(); ctx.moveTo(-waistW, bh * 0.6 + 12); ctx.lineTo(-waistW - 15, bh * 0.6 + 30); ctx.lineTo(-waistW + 5, bh * 0.6 + 30); ctx.fill();
            ctx.shadowBlur = 0;

        } else {
            // Street Brawler jacket / tank top
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.moveTo(-chestW * 0.6, 0);
            ctx.lineTo(-waistW * 0.4, bh);
            ctx.lineTo(waistW * 0.4, bh);
            ctx.lineTo(chestW * 0.6, 0);
            ctx.fill();
        }

        ctx.restore();
    }

    private static drawHead(ctx: CanvasRenderingContext2D, hr: number, headY: number, color: string, fighter: FighterType, hp: number, t: number) {
        ctx.save();
        ctx.translate(0, headY);

        // Strong Jawline Head Shape
        ctx.beginPath();
        ctx.moveTo(-hr, -hr * 0.5);   // top left
        ctx.bezierCurveTo(-hr, -hr * 1.2, hr, -hr * 1.2, hr, -hr * 0.5); // dome
        ctx.lineTo(hr * 0.8, hr * 0.5); // cheek right
        ctx.lineTo(0, hr * 1.0);      // chin center
        ctx.lineTo(-hr * 0.8, hr * 0.5);// cheek left
        ctx.closePath();

        const hGrad = ctx.createRadialGradient(-hr * 0.3, -hr * 0.5, hr * 0.2, 0, 0, hr * 1.5);
        if (fighter === FighterType.SHADOW_NINJA) {
            hGrad.addColorStop(0, '#222');
            hGrad.addColorStop(1, '#000');
        } else {
            hGrad.addColorStop(0, lighten(color, 40));
            hGrad.addColorStop(1, darken(color, 30));
        }
        ctx.fillStyle = hGrad;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = darken(color, 70);
        ctx.stroke();

        // Details
        if (fighter === FighterType.IRON_BOXER) {
            // Face Guard / Headgear
            ctx.fillStyle = '#990000';
            ctx.fillRect(-hr, -hr * 0.2, hr * 2, hr * 0.6); // cheek guards
            ctx.beginPath(); ctx.moveTo(-hr, -hr * 0.5); ctx.lineTo(hr, -hr * 0.5); ctx.lineTo(hr * 0.8, hr * 0.2); ctx.lineTo(-hr * 0.8, hr * 0.2); ctx.fill();

            // Mouth guard
            ctx.fillStyle = '#eee';
            ctx.beginPath(); ctx.roundRect(-hr * 0.4, hr * 0.4, hr * 0.8, hr * 0.3, 2); ctx.fill();
            ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(-hr * 0.4, hr * 0.55); ctx.lineTo(hr * 0.4, hr * 0.55); ctx.stroke();

        } else if (fighter === FighterType.SHADOW_NINJA) {
            // Ninja hood covers nose
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.moveTo(-hr, 0); ctx.lineTo(0, -5); ctx.lineTo(hr, 0); ctx.lineTo(hr * 0.8, hr); ctx.lineTo(0, hr * 1.2); ctx.lineTo(-hr * 0.8, hr); ctx.fill();

            // Demonic Slit Eyes
            ctx.fillStyle = '#ff003c';
            ctx.shadowColor = '#ff003c';
            ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.ellipse(-hr * 0.4, -hr * 0.2, hr * 0.2, 2, 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(hr * 0.4, -hr * 0.2, hr * 0.2, 2, -0.2, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;

        } else {
            // Street Brawler bandana & shades
            ctx.fillStyle = '#cc0000'; // red bandana
            ctx.fillRect(-hr * 1.1, -hr * 0.8, hr * 2.2, hr * 0.5);
            ctx.fillStyle = '#111'; // Aviator shades
            ctx.beginPath(); ctx.arc(-hr * 0.4, 0, hr * 0.4, 0, Math.PI, false); ctx.fill();
            ctx.beginPath(); ctx.arc(hr * 0.4, 0, hr * 0.4, 0, Math.PI, false); ctx.fill();
        }

        // Damage flash
        if (hp < 30) {
            ctx.globalAlpha = 0.3 + 0.3 * Math.abs(Math.sin(t * 15));
            ctx.fillStyle = '#ff0000';
            ctx.globalCompositeOperation = 'source-over';
            ctx.beginPath(); ctx.arc(0, 0, hr * 1.1, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }

    private static drawArm(ctx: CanvasRenderingContext2D, bw: number, bodyY: number, armLen: number, isBack: boolean, walkCycle: number, punchT: number, smashT: number, blocking: boolean, color: string, fighter: FighterType, t: number) {
        ctx.save();
        const shoulderX = isBack ? -bw * 0.8 : bw * 0.8;
        const shoulderY = bodyY + 15;
        ctx.translate(shoulderX, shoulderY);

        let upperAngle = isBack ? 0.3 : 0.8;
        let lowerAngle = isBack ? 1.0 : 0.4; // Elbow bend relative to upper arm

        if (blocking) {
            upperAngle = isBack ? -0.4 : -1.2;
            lowerAngle = isBack ? -1.2 : -2.0; // Folded in to protect face
        } else if (smashT > 0 && !isBack) {
            upperAngle = -2.8; // Reached way back over head
            lowerAngle = -0.5;
        } else if (punchT > 0 && !isBack) {
            upperAngle = -0.1; // Straight forward
            lowerAngle = 0.05; // Straight arm
        } else {
            upperAngle += (isBack ? -walkCycle : walkCycle) * 0.7;
            upperAngle += Math.sin(t * 2 + (isBack ? Math.PI : 0)) * 0.05;
        }

        const armW = fighter === FighterType.IRON_BOXER ? 18 : 14;
        const l1 = armLen * 0.55;
        const l2 = armLen * 0.5;
        const armColor = isBack ? darken(color, 40) : color;

        // Draw fluid connected limb for Upper -> Lower arm
        this.drawContiguousLimb(ctx, l1, l2, armW, upperAngle, lowerAngle, armColor, true);

        // Transform to hand position context
        ctx.rotate(upperAngle);
        ctx.translate(0, l1);
        ctx.rotate(lowerAngle);
        ctx.translate(0, l2);

        // --- Draw Weapon/Hand ---
        if (fighter === FighterType.IRON_BOXER) {
            // Massive Boxing Glove
            ctx.fillStyle = punchT || smashT ? '#ff0055' : '#cc0000';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            if ((punchT > 0 || smashT > 0) && !isBack) {
                ctx.shadowColor = '#ff0055';
                ctx.shadowBlur = 20;
            }

            // Draw glove shape (thumb overlapping main pad)
            ctx.beginPath();
            ctx.ellipse(5, armW, armW * 1.5, armW, 0, 0, Math.PI * 2); // Main pad
            ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(-armW * 0.8, armW * 0.5, armW * 0.6, armW, 0.4, 0, Math.PI * 2); // Thumb
            ctx.fill(); ctx.stroke();

            ctx.shadowBlur = 0;

        } else if (fighter === FighterType.SHADOW_NINJA && !isBack) {
            // Hand holding katana
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.arc(0, armW / 2, armW * 0.8, 0, Math.PI * 2); ctx.fill();

            // Katana Handle
            ctx.fillStyle = '#fff';
            ctx.fillRect(-armW * 0.4, armW, armW * 0.8, 15);

            // Laser Katana Blade
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#ff003c';
            ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.moveTo(-3, armW + 15); ctx.lineTo(3, armW + 15); ctx.lineTo(1, armW + 65); ctx.lineTo(-1, armW + 65); ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Bare fist with finger ridges
            ctx.fillStyle = isBack ? darken(color, 60) : lighten(color, 20);
            ctx.beginPath(); ctx.arc(0, armW / 2, armW, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = darken(color, 80);
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-armW * 0.5, armW); ctx.lineTo(-armW * 0.5, armW * 1.2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, armW * 1.1); ctx.lineTo(0, armW * 1.3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(armW * 0.5, armW); ctx.lineTo(armW * 0.5, armW * 1.2); ctx.stroke();
        }

        ctx.restore();
    }

    private static drawLeg(ctx: CanvasRenderingContext2D, bw: number, bh: number, bodyY: number, legLen: number, isBack: boolean, walkCycle: number, kickT: number, inKO: boolean, color: string, fighter: FighterType) {
        ctx.save();
        const hipX = isBack ? -bw * 0.4 : bw * 0.4;
        const hipY = bodyY + bh - 5;
        ctx.translate(hipX, hipY);

        let upperAngle = isBack ? 0.1 : -0.1;
        let lowerAngle = isBack ? 0.3 : 0.1;

        if (inKO) {
            upperAngle = isBack ? 0.5 : -0.3;
            lowerAngle = 0.1;
        } else if (kickT > 0 && !isBack) {
            upperAngle = -1.6;   // High forward kick
            lowerAngle = 0;      // Straight knee
        } else if (walkCycle !== 0) {
            upperAngle = (isBack ? -walkCycle : walkCycle) * 0.7;
            lowerAngle = walkCycle * (isBack ? 1 : -1) > 0 ? 0 : 0.8; // Bend knee dynamically on lift
        }

        const legW = fighter === FighterType.IRON_BOXER ? 20 : 16;
        const l1 = legLen * 0.5;
        const l2 = legLen * 0.5;
        const legColor = darken(color, isBack ? 50 : 20);

        // Fluid contiguous knee drawing for pants look
        this.drawContiguousLimb(ctx, l1, l2, legW, upperAngle, lowerAngle, legColor, false);

        // Move to ankle
        ctx.rotate(upperAngle);
        ctx.translate(0, l1);
        ctx.rotate(lowerAngle);
        ctx.translate(0, l2);

        // Boot / Shoe
        ctx.fillStyle = isBack ? '#111' : '#333';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        ctx.beginPath();
        // Solid sneaker profile
        ctx.moveTo(-legW * 0.8, -legW * 0.4);
        ctx.lineTo(legW * 0.8, -legW * 0.4);
        ctx.bezierCurveTo(legW * 1.5, -legW * 0.4, legW * 1.8, legW * 0.5, legW * 1.5, legW * 0.8);
        ctx.lineTo(-legW * 0.8, legW * 0.8);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Sole highlight
        ctx.fillStyle = '#fff';
        ctx.fillRect(-legW * 0.6, legW * 0.6, legW * 1.9, 3);

        // Kick trail emission
        if (kickT > 0 && !isBack) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(legW * 1.5, legW * 0.4, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    private static drawEnergyAura(ctx: CanvasRenderingContext2D, bodyY: number, bh: number, color: string, t: number) {
        ctx.save();
        ctx.translate(0, bodyY + bh * 0.5);
        ctx.globalCompositeOperation = 'screen';

        // Violent aura spikes
        ctx.beginPath();
        const numSpikes = 12;
        for (let i = 0; i <= numSpikes; i++) {
            const angle = (i / numSpikes) * Math.PI * 2 + (t * 5);
            const r = 60 + Math.random() * 40; // jagged
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.fill();

        const pulse = 0.5 + Math.abs(Math.sin(t * 30)) * 0.5;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 90 * pulse);
        grad.addColorStop(0, `rgba(255, 255, 255, 1)`);
        grad.addColorStop(0.2, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 90 * pulse, 0, Math.PI * 2);
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
