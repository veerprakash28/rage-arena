import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';
import { GAME_CONSTANTS, GameState } from '@rage-arena/shared';
import { Renderer } from './Renderer';
import { InputManager } from './InputManager';
import { soundEngine } from './SoundEngine';

export const GameCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const rendererRef = useRef<Renderer | null>(null);
    const inputManagerRef = useRef<InputManager | null>(null);
    const lastStateRef = useRef<GameState | null>(null);
    const targetStateRef = useRef<GameState | null>(null);
    const lastTimeRef = useRef<number>(performance.now());
    const interpolationTimeRef = useRef<number>(0);

    const { roomCode } = useStore();

    useEffect(() => {
        if (!canvasRef.current || !roomCode) return;

        // Initialize Canvas + Renderer
        const canvas = canvasRef.current;
        rendererRef.current = new Renderer(canvas.getContext('2d')!, GAME_CONSTANTS.STAGE_WIDTH, GAME_CONSTANTS.STAGE_HEIGHT);

        // Initialize Inputs and Sounds
        inputManagerRef.current = new InputManager(socket, roomCode);
        inputManagerRef.current.init();

        // User interacted by entering room, so AudioContext can start
        soundEngine.init();

        // Listen to network state updates
        const onGameState = (state: GameState) => {
            if (!lastStateRef.current) {
                lastStateRef.current = state;
            } else {
                lastStateRef.current = targetStateRef.current || state;
            }
            targetStateRef.current = state;
            interpolationTimeRef.current = 0; // reset interpolation timer

            // Detect hits for particles and sounds
            if (lastStateRef.current && targetStateRef.current) {
                const playerIds = Object.keys(state.players);
                playerIds.forEach(id => {
                    const oldP = lastStateRef.current!.players[id];
                    const newP = targetStateRef.current!.players[id];

                    // Attacks
                    if (oldP.animation !== newP.animation) {
                        if (newP.animation === 'punch') soundEngine.playPunch();
                        if (newP.animation === 'kick') soundEngine.playKick();
                        if (newP.animation === 'smash' || newP.animation === 'special') soundEngine.playSmash();
                        if (newP.animation === 'block') soundEngine.playBlock();
                    }

                    // Hits
                    if (oldP.hp > newP.hp && newP.animation === 'hit') {
                        rendererRef.current?.addHitEffect(newP.x, newP.y);
                        soundEngine.playPunch(); // Thud sound
                    }

                    // KO
                    if (oldP.animation !== 'ko' && newP.animation === 'ko') {
                        soundEngine.playKO();
                    }
                });
            }
        };

        socket.on('game-state', onGameState);

        // Render loop
        const renderLoop = (time: number) => {
            const dt = time - lastTimeRef.current;
            lastTimeRef.current = time;

            if (targetStateRef.current && lastStateRef.current && rendererRef.current) {
                // Add elapsed time to interpolation timer
                interpolationTimeRef.current += dt;

                // Calculate alpha (0.0 to 1.0) based on tick rate
                // If we receive packets every 16.6ms, 16.6ms is alpha = 1.0
                let alpha = interpolationTimeRef.current / GAME_CONSTANTS.MS_PER_TICK;
                // Clamp alpha to prevent severe overshooting
                alpha = Math.min(alpha, 1.2);

                rendererRef.current.render(targetStateRef.current, lastStateRef.current, alpha, dt);
            }

            requestRef.current = requestAnimationFrame(renderLoop);
        };

        requestRef.current = requestAnimationFrame(renderLoop);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            socket.off('game-state', onGameState);
            inputManagerRef.current?.cleanup();
        };
    }, [roomCode]);

    return (
        <div className="w-full h-full flex items-center justify-center bg-black">
            {/* We use aspect-video to maintain proportion (16:9 approx). The internal canvas size is fixed, CSS scales it. */}
            <canvas
                ref={canvasRef}
                width={GAME_CONSTANTS.STAGE_WIDTH}
                height={GAME_CONSTANTS.STAGE_HEIGHT}
                className="w-full h-full object-contain"
                
            />
        </div>
    );
};
