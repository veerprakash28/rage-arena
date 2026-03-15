import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';
import { PlayerStateNumber, GameState } from '@rage-arena/shared';
import { InputManager } from './InputManager';
import { soundEngine } from './SoundEngine';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Environment3D } from '../components/3d/Environment3D';
import { FighterModel } from '../components/3d/FighterModel';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// --- CUSTOM CAMERA CONTROLLER ---
const CameraController = ({ me, opponent }: { me?: PlayerStateNumber, opponent?: PlayerStateNumber }) => {

    useFrame((state, delta) => {
        const camera = state.camera as THREE.PerspectiveCamera;
        if (!me || !opponent || !camera.isPerspectiveCamera) return;

        // 1. Calculate dynamic framing
        const midX = (me.x + opponent.x) / 2;
        const targetX = (midX - 400) * 0.025; // MATCH FighterModel.tsx

        const dist = Math.abs(me.x - opponent.x);

        // Dynamic zoom: closer = lower Z, further = higher Z. 
        const targetZ = THREE.MathUtils.clamp(6 + (dist * 0.02), 8, 18);
        const targetY = 2.5 + (dist * 0.01);

        // Smoothly interpolate camera position
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 5 * delta);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 5 * delta);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 5 * delta);

        // 2. Look At Center
        const lookTarget = new THREE.Vector3(targetX, 1.2, 0);

        // 3. Screen Shake & FOV Kick!
        const meHit = me.actionCooldowns?.['stun'] || 0;
        const oppHit = opponent.actionCooldowns?.['stun'] || 0;
        const totalHit = Math.max(meHit, oppHit);

        if (totalHit > 5) {
            const intensity = 0.2;
            camera.position.x += (Math.random() - 0.5) * intensity;
            camera.position.y += (Math.random() - 0.5) * intensity;
            // Cinematic FOV squeeze on impact
            camera.fov = THREE.MathUtils.lerp(camera.fov, 40, 0.5);
        } else {
            camera.fov = THREE.MathUtils.lerp(camera.fov, 45, 0.1);
        }

        camera.lookAt(lookTarget);
        camera.updateProjectionMatrix();
    });

    return null;
};

export const GameCanvas: React.FC = () => {
    const { roomCode, playerName } = useStore();
    const inputManagerRef = useRef<InputManager | null>(null);

    // Server state tracking
    const [gameState, setGameState] = useState<GameState | null>(null);
    const lastGameState = useRef<GameState | null>(null);

    useEffect(() => {
        if (!roomCode) return;

        // Initialize Inputs and Sounds
        inputManagerRef.current = new InputManager(socket, roomCode);
        inputManagerRef.current.init();
        soundEngine.init();

        const onGameState = (state: GameState) => {
            const oldState = lastGameState.current;
            lastGameState.current = state;
            setGameState(state);

            // Handle Audio/FX Events based on state diffs
            if (oldState && state) {
                const playerIds = Object.keys(state.players);
                playerIds.forEach(id => {
                    const oldP = oldState.players[id];
                    const newP = state.players[id];

                    if (!oldP || !newP) return;

                    // Attacks
                    if (oldP.animation !== newP.animation) {
                        if (newP.animation === 'punch') soundEngine.playPunch();
                        if (newP.animation === 'kick') soundEngine.playKick();
                        if (newP.animation === 'smash' || newP.animation === 'special') soundEngine.playSmash();
                        if (newP.animation === 'block') soundEngine.playBlock();
                    }

                    // Hits
                    if (oldP.hp > newP.hp && newP.animation === 'hit') {
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

        return () => {
            socket.off('game-state', onGameState);
            inputManagerRef.current?.cleanup();
        };
    }, [roomCode]);

    if (!gameState) return null;

    const myId = Object.keys(gameState.players).find(id => gameState.players[id].name === playerName);
    const oppId = Object.keys(gameState.players).find(id => gameState.players[id].name !== playerName);

    const me = myId ? gameState.players[myId] : undefined;
    const opponent = oppId ? gameState.players[oppId] : undefined;

    return (
        <div className="w-full h-full relative overflow-hidden bg-[#050510]">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[0, 3.5, 12]} fov={45} />
                <CameraController me={me} opponent={opponent} />

                <Environment3D />

                {me && <FighterModel player={me} />}
                {opponent && <FighterModel player={opponent} />}

                {/* Powerful Cyberpunk Bloom Post-Processing */}
                <EffectComposer>
                    <Bloom
                        luminanceThreshold={1.2} // Only highly emissive objects glow (neon/eyes)
                        mipmapBlur
                        intensity={2.5}
                    />
                </EffectComposer>
            </Canvas>
        </div>
    );
};
