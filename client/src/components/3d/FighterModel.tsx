import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PlayerStateNumber, FighterType } from '@rage-arena/shared';
import * as THREE from 'three';

interface FighterModelProps {
    player: PlayerStateNumber;
}

// Convert 2D canvas coords to 3D world coords
const mapX = (x: number) => (x - 400) * 0.025;
const mapY = (y: number) => (380 - y) * 0.025;

// Basic Material Palettes
const materials = {
    [FighterType.IRON_BOXER]: {
        primary: new THREE.MeshPhysicalMaterial({
            color: '#c0a030', roughness: 0.1, metalness: 0.9, clearcoat: 1.0,
            sheen: 1.0, sheenRoughness: 0.2, sheenColor: '#ffffff'
        }),
        secondary: new THREE.MeshPhysicalMaterial({ color: '#222222', roughness: 0.4, metalness: 0.8 }),
        accent: new THREE.MeshPhysicalMaterial({ color: '#ff2020', emissive: '#ff0000', emissiveIntensity: 0.5 }),
        skin: new THREE.MeshStandardMaterial({ color: '#ffdbac', roughness: 0.6 }),
        hair: new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.9 })
    },
    [FighterType.SHADOW_NINJA]: {
        primary: new THREE.MeshPhysicalMaterial({
            color: '#1a1a2e', roughness: 0.2, metalness: 0.5, clearcoat: 0.5,
            sheen: 1.0, sheenColor: '#00f3ff'
        }),
        secondary: new THREE.MeshPhysicalMaterial({ color: '#0f0f1a', roughness: 0.5, metalness: 0.9 }),
        accent: new THREE.MeshPhysicalMaterial({ color: '#00f3ff', emissive: '#00ccff', emissiveIntensity: 0.5 }),
        skin: new THREE.MeshStandardMaterial({ color: '#333333', roughness: 0.4 }),
        hair: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 })
    },
    [FighterType.STREET_BRAWLER]: {
        primary: new THREE.MeshPhysicalMaterial({
            color: '#882222', roughness: 0.4, metalness: 0.3, clearcoat: 0.2,
            sheen: 0.5, sheenColor: '#ffffff'
        }),
        secondary: new THREE.MeshPhysicalMaterial({ color: '#111111', roughness: 0.6 }),
        accent: new THREE.MeshPhysicalMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.2 }),
        skin: new THREE.MeshStandardMaterial({ color: '#e0ac69', roughness: 0.5 }),
        hair: new THREE.MeshStandardMaterial({ color: '#63472b', roughness: 0.9 })
    }
};

export const FighterModel: React.FC<FighterModelProps> = ({ player }) => {
    const groupRef = useRef<THREE.Group>(null);
    const waistRef = useRef<THREE.Group>(null);
    const chestRef = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Group>(null);

    // Joint Refs
    const shoulderL = useRef<THREE.Group>(null);
    const armL = useRef<THREE.Group>(null);
    const forearmL = useRef<THREE.Group>(null);
    const shoulderR = useRef<THREE.Group>(null);
    const armR = useRef<THREE.Group>(null);
    const forearmR = useRef<THREE.Group>(null);

    const legL = useRef<THREE.Group>(null);
    const calfL = useRef<THREE.Group>(null);
    const legR = useRef<THREE.Group>(null);
    const calfR = useRef<THREE.Group>(null);

    const mats = materials[player.fighter] || materials[FighterType.STREET_BRAWLER];
    const baseColor = new THREE.Color(player.color);

    const primaryMat = useMemo(() => {
        const m = mats.primary.clone();
        m.color.lerp(baseColor, 0.3);
        return m;
    }, [player.color, player.fighter, mats.primary]);

    const skinMat = useMemo(() => {
        const m = (mats as any).skin.clone();
        if (player.fighter === FighterType.STREET_BRAWLER) m.color.lerp(baseColor, 0.1);
        return m;
    }, [player.color, player.fighter, (mats as any).skin]);

    // [x] Phase 15: Post-Humanoid Polish
    //     [x] Remove distracting emissive glows
    //     [x] Implement 3/4 heroic combat stance for 3D depth
    //     [x] Fix orientation (facing) calibration
    //     [x] Strike duration resilience for lag
    useFrame((state) => {
        if (!groupRef.current) return;
        let t = state.clock.elapsedTime;
        const { x, y, facing, animation, actionCooldowns } = player;

        const stunFrames = actionCooldowns?.['stun'] || 0;
        if (stunFrames > 0) t = t - (stunFrames * 0.05);

        const targetX = mapX(x);
        const targetY = mapY(y);
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.3);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.3);
        // 2. Facing (Offset by PI/2 to ensure Side-On Brawler View)
        // If they were facing camera at ±PI/2, then 0/PI is sideways.
        const targetRotY = facing === 'left' ? Math.PI : 0;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.2);

        let walkT = 0;
        let punchT = 0;
        let kickT = 0;

        if (animation === 'walk') walkT = t * 15;

        // LAG RESILIENCE: Striking poses are visual-only transients
        // We pulse them and let them decay even if state is stuck
        const strikeDuration = 0.4; // seconds
        const isStriking = animation === 'punch' || animation === 'smash' || animation === 'special' || animation === 'kick';

        if (isStriking) {
            const strikeT = (t % strikeDuration) / strikeDuration;
            if (animation === 'kick') kickT = Math.sin(strikeT * Math.PI);
            else punchT = Math.sin(strikeT * Math.PI);
        }

        const velocityX = targetX - groupRef.current.position.x;
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -velocityX * 0.5, 0.1);

        if (waistRef.current && chestRef.current) {
            waistRef.current.position.y = 1.0 + Math.sin(t * 5) * 0.05;

            // HEROIC STANCE: 3/4 Internal Rotation for 3D Volume
            // We twist the body so it's not perfectly flat to the camera
            const stanceY = facing === 'left' ? -0.4 : 0.4;
            waistRef.current.rotation.y = THREE.MathUtils.lerp(waistRef.current.rotation.y, stanceY, 0.1);
            chestRef.current.rotation.y = THREE.MathUtils.lerp(chestRef.current.rotation.y, stanceY * 0.5, 0.1);

            if (animation === 'block') {
                waistRef.current.rotation.x = -0.1;
                chestRef.current.rotation.x = -0.3;
            } else if (punchT > 0 || kickT > 0) {
                waistRef.current.rotation.x = 0.2;
                chestRef.current.rotation.x = 0.2;
                waistRef.current.rotation.y = 0; // Square up to target during impact
            } else {
                waistRef.current.rotation.x = 0;
                chestRef.current.rotation.x = 0;
            }
        }

        if (armL.current && forearmL.current) {
            if (animation === 'block') {
                armL.current.rotation.z = 1.8;
                forearmL.current.rotation.z = 1.6;
            } else if (punchT > 0) {
                armL.current.rotation.z = 1.8;
                forearmL.current.rotation.z = 0.1;
            } else {
                armL.current.rotation.z = 0.8 + Math.sin(walkT) * 0.4;
                forearmL.current.rotation.z = 1.0 + Math.abs(Math.sin(walkT)) * 0.3;
            }
        }
        if (armR.current && forearmR.current) {
            if (animation === 'block') {
                armR.current.rotation.z = 1.8;
                forearmR.current.rotation.z = 1.6;
            } else {
                armR.current.rotation.z = 0.8 + Math.sin(walkT + Math.PI) * 0.4;
                forearmR.current.rotation.z = 1.0 + Math.abs(Math.sin(walkT + Math.PI)) * 0.3;
            }
        }

        if (legL.current && calfL.current) {
            if (kickT > 0) {
                legL.current.rotation.z = -2.0;
                calfL.current.rotation.z = -0.5;
            } else if (animation === 'walk') {
                legL.current.rotation.z = Math.sin(walkT) * 0.8;
                calfL.current.rotation.z = Math.max(0, -Math.sin(walkT)) * 1.0;
            } else {
                legL.current.rotation.z = 0.2;
                calfL.current.rotation.z = 0.4;
            }
        }
        if (legR.current && calfR.current) {
            if (animation === 'walk') {
                legR.current.rotation.z = Math.sin(walkT + Math.PI) * 0.8;
                calfR.current.rotation.z = Math.max(0, -Math.sin(walkT + Math.PI)) * 1.0;
            } else {
                legR.current.rotation.z = 0.2;
                calfR.current.rotation.z = 0.4;
            }
        }

        if (animation === 'ko') {
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, facing === 'left' ? -Math.PI / 2 : Math.PI / 2, 0.1);
            groupRef.current.position.y = 0.5;
        } else if (animation === 'hit') {
            groupRef.current.rotation.z += (Math.random() - 0.5) * 0.2;
        }
    });

    return (
        <group ref={groupRef}>
            <pointLight color={player.color} intensity={5} distance={4} decay={2} position={[0, 1, 0.5]} />
            {/* WAIST (Central Hub) */}
            <group ref={waistRef} position={[0, 1, 0]}>
                <mesh castShadow>
                    <capsuleGeometry args={[0.22, 0.25, 16, 16]} />
                    <primitive object={mats.secondary} attach="material" />
                </mesh>

                {/* ABDOMINALS (Premium Core Sculpt) */}
                <group position={[0.2, 0, 0]}>
                    {[...Array(6)].map((_, i) => (
                        <mesh key={i} position={[0, 0.15 - (i % 3) * 0.12, (i < 3 ? 0.08 : -0.08)]} scale={[0.5, 1, 1]}>
                            <sphereGeometry args={[0.07, 8, 8]} />
                            <primitive object={skinMat} attach="material" />
                        </mesh>
                    ))}
                </group>

                {/* CHEST (Upper Torso) */}
                <group ref={chestRef} position={[0, 0.35, 0]}>
                    <mesh castShadow>
                        <boxGeometry args={[0.35, 0.55, 0.7]} />
                        <primitive
                            object={player.animation === 'hit' ? new THREE.MeshBasicMaterial({ color: '#ffffff' }) : primaryMat}
                            attach="material"
                        />
                    </mesh>

                    {/* PECTORALS (Premium Chest Sculpt) */}
                    <group position={[0.2, 0, 0]}>
                        <mesh position={[0, 0, 0.18]} rotation={[0, 0, 0.1]} scale={[0.3, 1, 1.2]}>
                            <sphereGeometry args={[0.18, 16, 16]} />
                            <primitive object={skinMat} attach="material" />
                        </mesh>
                        <mesh position={[0, 0, -0.18]} rotation={[0, 0, 0.1]} scale={[0.3, 1, 1.2]}>
                            <sphereGeometry args={[0.18, 16, 16]} />
                            <primitive object={skinMat} attach="material" />
                        </mesh>
                    </group>

                    {/* SHOULDERS & DELTOIDS */}
                    <group position={[0, 0.2, 0.45]} ref={shoulderL}>
                        <mesh castShadow>
                            <sphereGeometry args={[0.22, 16, 16]} />
                            <primitive object={mats.secondary} attach="material" />
                        </mesh>
                        <group ref={armL}>
                            <mesh position={[0, -0.2, 0]} castShadow>
                                <capsuleGeometry args={[0.14, 0.35, 16, 16]} />
                                <primitive object={skinMat} attach="material" />
                            </mesh>
                            {/* Tricep/Bicep Sculpt */}
                            <mesh position={[0, -0.2, 0]} scale={[1.2, 1, 1]}>
                                <sphereGeometry args={[0.12, 12, 12]} />
                                <primitive object={skinMat} attach="material" />
                            </mesh>

                            <group position={[0, -0.5, 0]} ref={forearmL}>
                                <mesh position={[0, -0.2, 0]} castShadow>
                                    <capsuleGeometry args={[0.12, 0.3, 16, 16]} />
                                    <primitive object={mats.secondary} attach="material" />
                                </mesh>
                                {/* Glove */}
                                <mesh position={[0, -0.4, 0]}>
                                    <sphereGeometry args={[0.22, 16, 16]} />
                                    <primitive object={mats.accent} attach="material" />
                                </mesh>
                            </group>
                        </group>
                    </group>

                    <group position={[0, 0.2, -0.45]} ref={shoulderR}>
                        <mesh castShadow>
                            <sphereGeometry args={[0.22, 16, 16]} />
                            <primitive object={mats.secondary} attach="material" />
                        </mesh>
                        <group ref={armR}>
                            <mesh position={[0, -0.2, 0]} castShadow>
                                <capsuleGeometry args={[0.14, 0.35, 16, 16]} />
                                <primitive object={skinMat} attach="material" />
                            </mesh>
                            <mesh position={[0, -0.2, 0]} scale={[1.2, 1, 1]}>
                                <sphereGeometry args={[0.12, 12, 12]} />
                                <primitive object={skinMat} attach="material" />
                            </mesh>

                            <group position={[0, -0.5, 0]} ref={forearmR}>
                                <mesh position={[0, -0.2, 0]} castShadow>
                                    <capsuleGeometry args={[0.12, 0.3, 16, 16]} />
                                    <primitive object={mats.secondary} attach="material" />
                                </mesh>
                                <mesh position={[0, -0.4, 0]}>
                                    <sphereGeometry args={[0.22, 16, 16]} />
                                    <primitive object={mats.accent} attach="material" />
                                </mesh>
                            </group>
                        </group>
                    </group>

                    {/* HEAD ASSEMBLY */}
                    <group position={[0, 0.5, 0]} ref={headRef}>
                        <mesh castShadow>
                            <sphereGeometry args={[0.28, 32, 32]} />
                            <primitive
                                object={player.animation === 'hit' ? new THREE.MeshBasicMaterial({ color: '#ffffff' }) : skinMat}
                                attach="material"
                            />
                        </mesh>
                        {/* Detailed Facial Kitbash */}
                        <mesh position={[0.2, 0, 0.08]} scale={[1, 0.5, 0.5]}><sphereGeometry args={[0.04, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
                        <mesh position={[0.2, 0, -0.08]} scale={[1, 0.5, 0.5]}><sphereGeometry args={[0.04, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>

                        {player.fighter === FighterType.IRON_BOXER && (
                            <group position={[0, 0.2, 0]}>
                                <mesh><boxGeometry args={[0.3, 0.1, 0.45]} /><primitive object={mats.hair} attach="material" /></mesh>
                                <mesh position={[0.2, -0.25, 0]}><boxGeometry args={[0.08, 0.25, 0.45]} /><primitive object={mats.accent} attach="material" /></mesh>
                            </group>
                        )}
                        {player.fighter === FighterType.SHADOW_NINJA && (
                            <group position={[0, 0.2, 0]}>
                                <mesh rotation={[0.5, 0, 0]}><coneGeometry args={[0.08, 0.5, 4]} /><primitive object={mats.hair} attach="material" /></mesh>
                                <mesh position={[0.2, -0.15, 0]}><boxGeometry args={[0.1, 0.08, 0.35]} /><primitive object={mats.accent} attach="material" /></mesh>
                            </group>
                        )}
                        {player.fighter === FighterType.STREET_BRAWLER && (
                            <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.3, 0.3, 0.08]} /><primitive object={mats.hair} attach="material" /></mesh>
                        )}
                    </group>
                </group>

                {/* LEGS & QUAD SCULPT */}
                <group position={[0, -0.15, 0.2]} ref={legL}>
                    <mesh position={[0, -0.3, 0]} castShadow>
                        <capsuleGeometry args={[0.18, 0.4, 16, 16]} />
                        <primitive object={primaryMat} attach="material" />
                    </mesh>
                    {/* Quad Definition */}
                    <mesh position={[0.1, -0.25, 0]} scale={[1.2, 1, 1]}>
                        <sphereGeometry args={[0.15, 12, 12]} />
                        <primitive object={primaryMat} attach="material" />
                    </mesh>

                    <group position={[0, -0.6, 0]} ref={calfL}>
                        <mesh position={[0, -0.3, 0]} castShadow>
                            <capsuleGeometry args={[0.14, 0.4, 16, 16]} />
                            <primitive object={mats.secondary} attach="material" />
                        </mesh>
                        <mesh position={[0.1, -0.65, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                            <capsuleGeometry args={[0.1, 0.25, 16, 16]} />
                            <primitive object={mats.secondary} attach="material" />
                        </mesh>
                    </group>
                </group>

                <group position={[0, -0.15, -0.2]} ref={legR}>
                    <mesh position={[0, -0.3, 0]} castShadow>
                        <capsuleGeometry args={[0.18, 0.4, 16, 16]} />
                        <primitive object={primaryMat} attach="material" />
                    </mesh>
                    <mesh position={[0.1, -0.25, 0]} scale={[1.2, 1, 1]}>
                        <sphereGeometry args={[0.15, 12, 12]} />
                        <primitive object={primaryMat} attach="material" />
                    </mesh>

                    <group position={[0, -0.6, 0]} ref={calfR}>
                        <mesh position={[0, -0.3, 0]} castShadow>
                            <capsuleGeometry args={[0.14, 0.4, 16, 16]} />
                            <primitive object={mats.secondary} attach="material" />
                        </mesh>
                        <mesh position={[0.1, -0.65, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                            <capsuleGeometry args={[0.1, 0.25, 16, 16]} />
                            <primitive object={mats.secondary} attach="material" />
                        </mesh>
                    </group>
                </group>
            </group>
        </group>
    );
};
