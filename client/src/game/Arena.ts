import { GAME_CONSTANTS } from '@rage-arena/shared';

export class Arena {
    private width: number;
    private height: number;
    private time: number = 0;
    private stars: { x: number; y: number; r: number; b: number }[] = [];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        // Pre-generate stars
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * (height * 0.5),
                r: Math.random() * 1.5 + 0.3,
                b: Math.random(),
            });
        }
    }

    update(dt: number) {
        this.time += dt;
    }

    draw(ctx: CanvasRenderingContext2D, cameraX: number = 0) {
        // Sky gradient
        const sky = ctx.createLinearGradient(0, 0, 0, this.height);
        sky.addColorStop(0, '#050510');
        sky.addColorStop(0.6, '#0a0a25');
        sky.addColorStop(1, '#111135');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, this.width, this.height);

        // Stars
        for (const s of this.stars) {
            const twinkle = 0.5 + 0.5 * Math.sin(this.time * 0.002 * s.b + s.x);
            ctx.globalAlpha = twinkle * 0.8;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Parallax city silhouette (very far, large buildings)
        const p2 = (cameraX * 0.15) % this.width;
        this.drawBuildings(ctx, p2, this.height - 80, 100, 180, 60, 100, '#0c0c28');
        this.drawBuildings(ctx, p2 + this.width, this.height - 80, 100, 180, 60, 100, '#0c0c28');

        // Neon city layer (mid distance)
        const p4 = (cameraX * 0.3) % this.width;
        this.drawBuildings(ctx, p4, this.height - 55, 60, 110, 35, 70, '#080820', true);
        this.drawBuildings(ctx, p4 + this.width, this.height - 55, 60, 110, 35, 70, '#080820', true);

        // Floor
        const floorGrad = ctx.createLinearGradient(0, GAME_CONSTANTS.GROUND_Y, 0, this.height);
        floorGrad.addColorStop(0, '#1e1e40');
        floorGrad.addColorStop(1, '#05050f');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, GAME_CONSTANTS.GROUND_Y, this.width, this.height - GAME_CONSTANTS.GROUND_Y);

        // Floor reflection lines (perspective grid)
        ctx.strokeStyle = 'rgba(100,50,200,0.15)';
        ctx.lineWidth = 1;
        const vanishX = this.width / 2;
        const vanishY = GAME_CONSTANTS.GROUND_Y;
        for (let i = 0; i <= 12; i++) {
            const px = (i / 12) * this.width;
            ctx.beginPath();
            ctx.moveTo(px, this.height);
            ctx.lineTo(vanishX + (px - vanishX) * 0.1, vanishY);
            ctx.stroke();
        }
        for (let row = 0; row < 5; row++) {
            const t = row / 4;
            const ry = vanishY + Math.pow(t, 2) * (this.height - vanishY);
            ctx.beginPath();
            ctx.moveTo(0, ry);
            ctx.lineTo(this.width, ry);
            ctx.stroke();
        }

        // Ground neon edge line
        ctx.beginPath();
        ctx.moveTo(0, GAME_CONSTANTS.GROUND_Y);
        ctx.lineTo(this.width, GAME_CONSTANTS.GROUND_Y);
        ctx.strokeStyle = '#9933ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#9933ff';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Side stage edge lines
        ctx.strokeStyle = 'rgba(153,51,255,0.3)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;

        // Animated crowd dots at base
        const crowdCount = 30;
        for (let i = 0; i < crowdCount; i++) {
            const cx = (i / crowdCount) * this.width;
            const bobY = GAME_CONSTANTS.GROUND_Y - 18 + Math.sin(this.time * 0.004 + i * 1.5) * 4;
            ctx.fillStyle = i % 3 === 0 ? 'rgba(255,50,50,0.4)' : i % 3 === 1 ? 'rgba(50,150,255,0.4)' : 'rgba(200,200,200,0.3)';
            ctx.beginPath();
            ctx.arc(cx, bobY, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private drawBuildings(
        ctx: CanvasRenderingContext2D,
        offsetX: number,
        groundY: number,
        minH: number,
        maxH: number,
        minW: number,
        maxW: number,
        color: string,
        addNeon: boolean = false
    ) {
        let x = -offsetX;
        const seed = [73, 31, 97, 53, 11, 67, 23, 89, 41, 17, 59];
        for (let i = 0; x < this.width + maxW; i++) {
            const s = seed[i % seed.length];
            const h = minH + (s % (maxH - minH));
            const w = minW + ((s * 3) % (maxW - minW));
            const bx = x;
            const by = groundY - h;

            ctx.fillStyle = color;
            ctx.fillRect(bx, by, w, h);

            if (addNeon && i % 3 === 0) {
                // Window glow
                const neonColor = i % 6 === 0 ? '#ff2060' : '#00cfff';
                ctx.fillStyle = neonColor;
                ctx.shadowColor = neonColor;
                ctx.shadowBlur = 6;
                const rows = Math.floor(h / 14);
                for (let rr = 0; rr < rows; rr++) {
                    if ((rr + i) % 3 !== 0) continue;
                    ctx.fillRect(bx + 6, by + rr * 14 + 4, w - 12, 5);
                }
                ctx.shadowBlur = 0;
            }

            x += w + 4 + (s % 10);
        }
    }
}
