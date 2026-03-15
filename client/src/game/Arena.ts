import { GAME_CONSTANTS } from '@rage-arena/shared';

// Handles rendering the multi-layer parallax background
export class Arena {
    private width: number;
    private height: number;
    private time: number = 0;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    update(dt: number) {
        this.time += dt;
    }

    draw(ctx: CanvasRenderingContext2D, cameraX: number = 0) {
        // 1. Sky / Distant background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, this.width, this.height);

        // Grid for cyberpunk feel (parallax 0.1)
        ctx.strokeStyle = '#1a1a3a';
        ctx.lineWidth = 1;
        const p1 = cameraX * 0.1;
        for (let i = 0; i < this.width + 100; i += 50) {
            ctx.beginPath();
            const x = (i - (p1 % 50));
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        // 2. City Horizon (parallax 0.3)
        const p3 = cameraX * 0.3;
        ctx.fillStyle = '#0f172a';
        for (let i = 0; i < 20; i++) {
            const x = ((i * 120) - p3) % (this.width + 200) - 100;
            const h = 150 + Math.sin(i * 45) * 100;
            ctx.fillRect(x, this.height - h - 50, 80, h);

            // Neon windows
            ctx.fillStyle = (i % 3 === 0) ? '#ff2a2a' : '#00f0ff';
            if (i % 2 === 0) {
                ctx.fillRect(x + 20, this.height - h - 30, 10, 20);
                ctx.fillRect(x + 50, this.height - h - 10, 10, 20);
            }
            ctx.fillStyle = '#0f172a';
        }

        // 3. Middle ground details / Crowd (parallax 0.6)
        const p6 = cameraX * 0.6;
        ctx.fillStyle = '#1e293b';
        for (let i = 0; i < 15; i++) {
            const x = ((i * 70) - p6) % (this.width + 100) - 50;
            const bounce = Math.sin(this.time * 0.005 + i) * 5;
            // Draw head
            ctx.beginPath();
            ctx.arc(x, GAME_CONSTANTS.GROUND_Y - 30 + bounce, 12, 0, Math.PI * 2);
            ctx.fill();
            // Body
            ctx.fillRect(x - 15, GAME_CONSTANTS.GROUND_Y - 20 + bounce, 30, 40);
        }

        // 4. Ground floor
        const grad = ctx.createLinearGradient(0, GAME_CONSTANTS.GROUND_Y, 0, this.height);
        grad.addColorStop(0, '#334155');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, GAME_CONSTANTS.GROUND_Y, this.width, this.height - GAME_CONSTANTS.GROUND_Y);

        // Ground edge line
        ctx.strokeStyle = '#ff2a2a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, GAME_CONSTANTS.GROUND_Y);
        ctx.lineTo(this.width, GAME_CONSTANTS.GROUND_Y);
        ctx.stroke();

        // Add glow
        ctx.shadowColor = '#ff2a2a';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}
