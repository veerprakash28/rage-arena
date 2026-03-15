import { HUD } from './HUD';
import { GameCanvas } from '../game/GameCanvas';
import { MobileControls } from './MobileControls';
import { Chat } from './Chat';

export const FightScreen = () => {
    return (
        <div className="w-full h-full relative bg-gray-900 overflow-hidden select-none">
            {/* Game Canvas Wrapper will go here */}
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <GameCanvas />
            </div>

            <HUD />
            <Chat />
            <MobileControls />
        </div>
    );
};
