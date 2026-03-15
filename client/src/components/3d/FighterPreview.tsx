import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment } from '@react-three/drei';
import { FighterModel } from './FighterModel';
import { PlayerStateNumber } from '@rage-arena/shared';

interface FighterPreviewProps {
    player: PlayerStateNumber;
}

export const FighterPreview: React.FC<FighterPreviewProps> = ({ player }) => {
    // We create a mock player state for the model if it's missing gameplay props
    // but FighterModel mainly needs fighter, color, and animation.
    const previewPlayer = {
        ...player,
        x: 400, // Center
        y: 380, // Ground
        facing: 'right' as const,
        animation: 'idle' as const,
    };

    return (
        <div className="w-full h-full min-h-[300px] relative">
            <Canvas shadows camera={{ position: [0, 0, 5], fov: 35 }}>
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.5} shadows="contact">
                        <FighterModel player={previewPlayer as any} />
                    </Stage>
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        autoRotate
                        autoRotateSpeed={2}
                        minPolarAngle={Math.PI / 2.5}
                        maxPolarAngle={Math.PI / 1.8}
                    />
                </Suspense>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
            </Canvas>
        </div>
    );
};
