import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PlayerStateNumber, FighterType } from '@rage-arena/shared';
import * as THREE from 'three';

interface FighterModelProps {
    player: PlayerStateNumber;
    isOpponent: boolean;
}

// Convert 2D canvas coords to 3D world coords
// Canvas width: 800, height: 450. Ground Y: 380
// Origin (0,0,0) in 3D should roughly map to (400, 380) in 2D.
const mapX = (x: number) => (x - 400) * 0.025;
const mapY = (y: number) => (380 - y) * 0.025;

// Basic Material Palettes
const materials = {
    [FighterType.IRON_BOXER]: {
        primary: new THREE.MeshStandardMaterial({ color: '#c0a030', roughness: 0.3, metalness: 0.8 }),
        secondary: new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.6 }),
        accent: new THREE.MeshStandardMaterial({ color: '#ff2020', emissive: '#ff0000', emissiveIntensity: 2 })
    },
    [FighterType.SHADOW_NINJA]: {
        primary: new THREE.MeshStandardMaterial({ color: '#1a1a2e', roughness: 0.8, metalness: 0.1 }),
        secondary: new THREE.MeshStandardMaterial({ color: '#0f0f1a', roughness: 0.9 }),
        accent: new THREE.MeshStandardMaterial({ color: '#00f3ff', emissive: '#00ccff', emissiveIntensity: 2 })
    },
    [FighterType.STREET_BRAWLER]: {
        primary: new THREE.MeshStandardMaterial({ color: '#882222', roughness: 0.7, metalness: 0.2 }),
        secondary: new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.8 }),
        accent: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1 })
    }
};

export const FighterModel: React.FC<FighterModelProps> = ({ player }) => {
    const groupRef = useRef<THREE.Group>(null);
    const torsoRef = useRef<THREE.Mesh>(null);
    const headRef = useRef<THREE.Group>(null);

    // Joint Refs for IK
    const armL = useRef<THREE.Group>(null);
    const armR = useRef<THREE.Group>(null);
    const legL = useRef<THREE.Group>(null);
    const legR = useRef<THREE.Group>(null);

    const mats = materials[player.fighter] || materials[FighterType.STREET_BRAWLER];
    const baseColor = new THREE.Color(player.color);

    // Dynamic material instance for color tinting
    const primaryMat = useMemo(() => {
        const m = mats.primary.clone();
        m.color.lerp(baseColor, 0.5); // Blend literal fighter type color with player color selection
        return m;
    }, [player.color, player.fighter]);

    useFrame((state) => {
        if (!groupRef.current) return;

        let t = state.clock.elapsedTime;
        const { x, y, facing, animation, actionCooldowns } = player;

        // Crazy Game Dev Trick: HIT STOP!
        // If a player is in the first few frames of severe hitstun, we FREEZE their local animation time
        // This gives attacks massive, bone-crunching weight
        const stunFrames = actionCooldowns?.['stun'] || 0;
        if (stunFrames > 0) {
            // Locally freeze this character's animation to the exact moment of impact
            t = t - (stunFrames * 0.05);
        }

        // 1. Position tracking (Interpolated smoothly from discrete server ticks)
        const targetX = mapX(x);
        const targetY = mapY(y);

        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.3);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.3);

        // 2. Facing
        const targetRotY = facing === 'left' ? -Math.PI / 2 : Math.PI / 2;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.2);

        // 3. Animation State Machine
        let walkT = 0;
        let punchT = 0;
        let kickT = 0;

        if (animation === 'walk') walkT = t * 15;
        if (animation === 'punch' || animation === 'smash' || animation === 'special') punchT = 1;
        if (animation === 'kick') kickT = 1;

        // Apply procedural IK rotations
        if (torsoRef.current) {
            torsoRef.current.position.y = 1.5 + Math.sin(t * 5) * 0.05; // Idle breathing
            if (animation === 'block') {
                torsoRef.current.rotation.x = -0.2; // lean back
            } else if (punchT > 0 || kickT > 0) {
                torsoRef.current.rotation.x = 0.2; // lean in
            } else {
                torsoRef.current.rotation.x = 0;
            }
        }

        // Arms
        if (armL.current && armR.current) {
            if (animation === 'block') {
                armL.current.rotation.z = 2.5; // fold up
                armR.current.rotation.z = 2.5;
            } else if (punchT > 0) {
                armL.current.rotation.z = 1.6; // extend front arm
                armR.current.rotation.z = -0.5; // pull back arm
            } else {
                armL.current.rotation.z = Math.sin(walkT) * 1.0;
                armR.current.rotation.z = Math.sin(walkT + Math.PI) * 1.0;
            }
        }

        // Legs
        if (legL.current && legR.current) {
            if (kickT > 0) {
                legL.current.rotation.z = -1.8; // high kick
                legR.current.rotation.z = 0.2; // plant foot
            } else if (animation === 'walk') {
                legL.current.rotation.z = Math.sin(walkT) * 0.8;
                legR.current.rotation.z = Math.sin(walkT + Math.PI) * 0.8;
            } else {
                legL.current.rotation.z = 0;
                legR.current.rotation.z = 0;
            }
        }

        // KO State
        if (animation === 'ko') {
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, facing === 'left' ? -Math.PI / 2 : Math.PI / 2, 0.1);
            groupRef.current.position.y = 0.5;
        } else if (animation === 'hit') {
            // More visceral flinch!
            groupRef.current.rotation.z = facing === 'left' ? -0.4 : 0.4;
        } else {
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.2);
        }
    });

    return (
        <group ref={groupRef} receiveShadow castShadow>
            {/* Pivot at base (feet at y=0) */}

            {/* Torso (Bouncy Capsule) */}
            <mesh ref={torsoRef} castShadow position={[0, 1.5, 0]}>
                <capsuleGeometry args={[0.6, 0.5, 16, 32]} />
                <primitive object={primaryMat} attach="material" />

                {/* Head (Round Sphere) */}
                <group ref={headRef} position={[0, 0.9, 0]}>
                    <mesh castShadow>
                        <sphereGeometry args={[0.45, 32, 32]} />
                        <primitive object={primaryMat} attach="material" />
                    </mesh>
                    {/* Glowing Eyes/Visor */}
                    <mesh position={[0.3, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <capsuleGeometry args={[0.08, 0.4, 16, 16]} />
                        <primitive object={mats.accent} attach="material" />
                    </mesh>
                </group>

                {/* Left Arm (Front to camera) */}
                <group position={[0, 0.3, 0.65]} ref={armL}>
                    <mesh position={[0, -0.5, 0]} castShadow>
                        <capsuleGeometry args={[0.2, 0.6, 16, 16]} />
                        <primitive object={mats.secondary} attach="material" />
                    </mesh>
                    {/* Glove/Hand (Round Sphere) */}
                    <mesh position={[0, -1.1, 0]}>
                        <sphereGeometry args={[0.35, 32, 32]} />
                        <primitive object={mats.accent} attach="material" />
                    </mesh>
                </group>

                {/* Right Arm (Back) */}
                <group position={[0, 0.3, -0.65]} ref={armR}>
                    <mesh position={[0, -0.5, 0]} castShadow>
                        <capsuleGeometry args={[0.2, 0.6, 16, 16]} />
                        <primitive object={mats.secondary} attach="material" />
                    </mesh>
                    <mesh position={[0, -1.1, 0]}>
                        <sphereGeometry args={[0.35, 32, 32]} />
                        <primitive object={mats.accent} attach="material" />
                    </mesh>
                </group>

                {/* Left Leg */}
                <group position={[0, -0.7, 0.35]} ref={legL}>
                    <mesh position={[0, -0.5, 0]} castShadow>
                        <capsuleGeometry args={[0.22, 0.6, 16, 16]} />
                        <primitive object={mats.secondary} attach="material" />
                    </mesh>
                    {/* Foot */}
                    <mesh position={[0.1, -1.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <capsuleGeometry args={[0.2, 0.3, 16, 16]} />
                        <primitive object={mats.secondary} attach="material" />
                    </mesh>
                </group>

                {/* Right Leg */}
                <group position={[0, -0.7, -0.35]} ref={legR}>
                    <mesh position={[0, -0.5, 0]} castShadow>
                        <capsuleGeometry args={[0.22, 0.6, 16, 16]} />
                        <primitive object={mats.secondary} attach="material" />
                    </mesh>
                    {/* Foot */}
                    <mesh position={[0.1, -1.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <capsuleGeometry args={[0.2, 0.3, 16, 16]} />
                        <primitive object={mats.secondary} attach="material" />
                    </mesh>
                </group>

            </mesh>
        </group>
    );
};
