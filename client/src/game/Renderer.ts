import { GameState, GAME_CONSTANTS } from '@rage-arena/shared';
import { Arena } from './Arena';
import { FighterSprite } from './FighterSprite';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private arena: Arena;
    private particles: { x: number, y: number, vx: number, vy: number, life: number, maxLife: number, color: string }[] = [];

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.arena = new Arena(width, height);
    }

    public render(state: GameState, lastState: GameState, alpha: number, dt: number) {
        // 1. Advance arena time for background animations
        this.arena.update(dt);

        // 2. Interpolate camera X (center between players, clamped)
        // Actually, simple static camera for this arena size is fine (800x450 fits on screen mostly)
        // But if we want slight panning parallax:
        const pIds = Object.keys(state.players);
        if (pIds.length !== 2) return;

        const p1 = state.players[pIds[0]];
        const p2 = state.players[pIds[1]];

        const centerX = Math.floor((p1.x + p2.x) / 2);
        // Parallax offset, small amount to not be nauseating
        const cameraShiftX = (centerX - (GAME_CONSTANTS.STAGE_WIDTH / 2)) * 0.2;

        // Clear and draw background
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.arena.draw(this.ctx, cameraShiftX);

        // 3. Interpolate player positions
        pIds.forEach(id => {
            const cur = state.players[id];
            const prev = lastState.players[id] || cur;

            // Render state object
            const renderPlayer = {
                ...cur,
                x: prev.x + (cur.x - prev.x) * alpha,
                y: prev.y + (cur.y - prev.y) * alpha
            };

            FighterSprite.draw(this.ctx, renderPlayer, performance.now());
        });

        // 4. Update and draw hit particles
        this.updateAndDrawParticles(dt);
    }

    public addHitEffect(x: number, y: number, color: string = '#ffea00') {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x, y: y - 50, // center on body
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: 1.0,
                color
            });
        }
        // Add one central spark
        this.particles.push({
            x, y: y - 50, vx: 0, vy: 0, life: 1.5, maxLife: 1.5, color: '#ffffff'
        });
    }

    private updateAndDrawParticles(dt: number) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt * 0.002;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // gravity

            this.ctx.save();
            this.ctx.globalAlpha = p.life / p.maxLife;
            this.ctx.fillStyle = p.color;

            if (p.vx === 0 && p.vy === 0) { // Central spark
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 20 * (p.life / p.maxLife), 0, Math.PI * 2);
                this.ctx.fill();
            } else { // Small sparks
                this.ctx.fillRect(p.x, p.y, 4, 4);
            }

            this.ctx.restore();
        }
    }
}
