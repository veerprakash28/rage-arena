import { GAME_CONSTANTS } from '@rage-arena/shared';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
}

export class Arena {
    private width: number;
    private height: number;
    private time: number = 0;

    private stars: { x: number; y: number; s: number; alphaOffset: number }[] = [];
    private particles: Particle[] = [];

    // Cyberpunk color palette
    private readonly G_SKY_TOP = '#040b16';
    private readonly G_SKY_BOT = '#1a0b2e';
    private readonly NEON_CYAN = '#00f3ff';
    private readonly NEON_PINK = '#ff003c';
    private readonly NEON_PURPLE = '#b829ff';

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        // Generate distant stars
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * (height * 0.7),
                s: Math.random() * 2 + 0.5,
                alphaOffset: Math.random() * Math.PI * 2
            });
        }
    }

    update(dt: number) {
        this.time += dt;

        // Embers / Dust particles logic
        if (Math.random() < 0.3) {
            this.particles.push({
                x: Math.random() * this.width,
                y: GAME_CONSTANTS.GROUND_Y + Math.random() * 20,
                vx: (Math.random() - 0.5) * 20,
                vy: -(Math.random() * 30 + 10),
                life: 0,
                maxLife: 2 + Math.random() * 2,
                size: Math.random() * 3 + 1,
                color: Math.random() > 0.5 ? this.NEON_PINK : this.NEON_CYAN
            });
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, cameraX: number = 0) {
        // 1. Deep Atmospheric Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.GROUND_Y);
        skyGrad.addColorStop(0, this.G_SKY_TOP);
        skyGrad.addColorStop(1, this.G_SKY_BOT);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Twinkling Stars
        for (const star of this.stars) {
            const alpha = 0.3 + 0.7 * Math.abs(Math.sin(this.time * 0.5 + star.alphaOffset));
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.s, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Huge Distant Planet / Moon
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.arc(this.width * 0.8, this.height * 0.3, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(184, 41, 255, 0.08)'; // Purple moon glow
        ctx.beginPath();
        ctx.arc(this.width * 0.82, this.height * 0.32, 110, 0, Math.PI * 2);
        ctx.fill();

        // 4. Parallax Distant City (Dark)
        const bg1X = (cameraX * 0.1) % this.width;
        this.drawCityscape(ctx, bg1X, GAME_CONSTANTS.GROUND_Y, '#070514', 150, 400, 80, false);
        this.drawCityscape(ctx, bg1X - this.width, GAME_CONSTANTS.GROUND_Y, '#070514', 150, 400, 80, false);

        // 5. Parallax Mid City (Lit)
        const bg2X = (cameraX * 0.3) % this.width;
        this.drawCityscape(ctx, bg2X, GAME_CONSTANTS.GROUND_Y, '#0d0a27', 100, 250, 50, true);
        this.drawCityscape(ctx, bg2X - this.width, GAME_CONSTANTS.GROUND_Y, '#0d0a27', 100, 250, 50, true);

        // 6. Volumetric Light Beams (Searchlights)
        ctx.globalCompositeOperation = 'screen';
        const numBeams = 3;
        for (let i = 0; i < numBeams; i++) {
            const angle = Math.sin(this.time * 0.5 + i * 2) * 0.5;
            const baseX = this.width * (0.2 + 0.3 * i);
            const beamGrad = ctx.createLinearGradient(baseX, GAME_CONSTANTS.GROUND_Y, baseX + Math.sin(angle) * 500, 0);
            beamGrad.addColorStop(0, 'rgba(0, 243, 255, 0.0)');
            beamGrad.addColorStop(1, 'rgba(0, 243, 255, 0.15)');

            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(baseX - 20, GAME_CONSTANTS.GROUND_Y);
            ctx.lineTo(baseX + 20, GAME_CONSTANTS.GROUND_Y);
            ctx.lineTo(baseX + Math.sin(angle) * 1000 + 300, -500);
            ctx.lineTo(baseX + Math.sin(angle) * 1000 - 300, -500);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';

        // 7. Perspective Cyber Grid Floor
        const groundHeight = this.height - GAME_CONSTANTS.GROUND_Y;
        const floorGrad = ctx.createLinearGradient(0, GAME_CONSTANTS.GROUND_Y, 0, this.height);
        floorGrad.addColorStop(0, '#000000');
        floorGrad.addColorStop(1, '#0f0518');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, GAME_CONSTANTS.GROUND_Y, this.width, groundHeight);

        // Grid Lines
        ctx.strokeStyle = this.NEON_PURPLE;
        ctx.lineWidth = 1.5;
        const vanishY = GAME_CONSTANTS.GROUND_Y - 50; // vanishing point above horizon for perspective
        const vanishX = this.width / 2;

        ctx.globalAlpha = 0.4;
        // Vertical lines radiating out
        const numVLines = 20;
        const panOffset = (cameraX * 2) % (this.width / numVLines);
        for (let i = -numVLines; i <= numVLines * 2; i++) {
            const startX = (i * (this.width / numVLines)) - panOffset;
            ctx.beginPath();
            ctx.moveTo(startX, this.height);
            ctx.lineTo(vanishX, vanishY);
            ctx.stroke();
        }

        // Horizontal depth lines
        const numHLines = 8;
        for (let i = 0; i < numHLines; i++) {
            // Quadratic curve spacing for 3D fake perspective
            const z = i / numHLines;
            let y = GAME_CONSTANTS.GROUND_Y + (z * z * groundHeight);

            // Move lines forward over time for fake forward motion effect (optional, keeping it static for fighting game stability for now)
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        // 8. Ground Horizon Neon Line
        ctx.shadowColor = this.NEON_CYAN;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, GAME_CONSTANTS.GROUND_Y);
        ctx.lineTo(this.width, GAME_CONSTANTS.GROUND_Y);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 9. Particles (Dust / Embers floating up from grid)
        ctx.globalCompositeOperation = 'screen';
        for (const p of this.particles) {
            const alpha = 1 - (p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
    }

    private drawCityscape(
        ctx: CanvasRenderingContext2D,
        offsetX: number,
        groundY: number,
        baseColor: string,
        minH: number, maxH: number, maxW: number,
        hasNeon: boolean
    ) {
        let x = offsetX;
        const pseudoPattern = [3, 7, 2, 8, 4, 9, 1, 6, 5];
        let idx = 0;

        while (x < this.width + maxW * 2) {
            const seed = pseudoPattern[idx % pseudoPattern.length];
            const w = 40 + (seed * 10);
            const h = minH + (seed * ((maxH - minH) / 10));
            const y = groundY - h;

            // Building silhouette
            ctx.fillStyle = baseColor;
            ctx.fillRect(x, y, w, h);

            // Windows
            if (hasNeon && seed % 2 === 0) {
                const neonColor = seed % 3 === 0 ? this.NEON_CYAN : (seed % 4 === 0 ? this.NEON_PINK : '#ffffaa');
                ctx.fillStyle = neonColor;
                ctx.shadowColor = neonColor;
                ctx.shadowBlur = 5;

                const rows = Math.floor(h / 20);
                const cols = Math.floor(w / 15);

                for (let r = 2; r < rows - 1; r++) {
                    for (let c = 1; c < cols; c++) {
                        if ((r + c + seed) % 5 !== 0) { // Random on/off
                            ctx.fillRect(x + c * 15, y + r * 20, 6, 10);
                        }
                    }
                }
                ctx.shadowBlur = 0;
            }

            x += w + 10; // gap
            idx++;
        }
    }
}
