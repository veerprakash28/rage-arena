import React from 'react';
import { Grid, Environment, Stars, Cloud } from '@react-three/drei';


// The server's ground is Y: 380, mapped to roughly 0 in world space
export const Environment3D: React.FC = () => {
    return (
        <group>
            {/* Base ambient lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight
                position={[10, 20, 5]}
                intensity={1.5}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />

            {/* Glowing Neon Cyberpunk Floor Grid */}
            {/* The actual fighting plane gets a bright cyan/purple intersection grid */}
            <Grid
                position={[0, 0, 0]}
                args={[100, 100]}
                cellSize={1}
                cellThickness={1.5}
                cellColor="#b829ff"
                sectionSize={5}
                sectionThickness={2}
                sectionColor="#00f3ff"
                fadeDistance={40}
                fadeStrength={1}
            />

            {/* Solid floor plane below the grid to catch shadows */}
            <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#050510" roughness={0.8} />
            </mesh>

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Distant atmospheric volumetric clouds */}
            <Cloud position={[-10, 5, -20]} speed={0.2} opacity={0.2} color="#ff0055" />
            <Cloud position={[15, 10, -25]} speed={0.4} opacity={0.3} color="#00f3ff" />

            {/* Deep Fog for depth perception */}
            <fog attach="fog" args={['#050510', 10, 40]} />

            {/* Environmental reflection map (Cyberpunk Night) for metallic materials */}
            <Environment preset="night" />
        </group>
    );
};
