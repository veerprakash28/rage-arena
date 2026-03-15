import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';
import { ActionType } from '@rage-arena/shared';

// For touches, we need to bypass React synthetic events for the fastest response
export const MobileControls = () => {
    const { roomCode } = useStore();

    // Only show on touch devices
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);

    if (!isTouchDevice) return null;

    const handleAction = (action: ActionType, isPressed: boolean) => {
        console.log(`Action: ${action} pressed: ${isPressed}`);
        socket.emit('game-action', { code: roomCode, action, isPressed });
    };

    // Prevent default to stop zooming/scrolling, then emit our action
    const buttonProps = (action: ActionType) => ({
        onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); handleAction(action, true); },
        onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); handleAction(action, false); },
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    });

    return (
        <div className="absolute bottom-0 left-0 w-full h-1/2 pointer-events-none z-30 flex justify-between items-end p-6">

            {/* Left Joystick Area */}
            <div className="flex gap-4 pointer-events-auto opacity-70">
                <div className="flex flex-col justify-center items-center gap-2">
                    <button
                        {...buttonProps(ActionType.JUMP)}
                        className="w-16 h-16 bg-gray-800 border-2 border-gray-600 rounded-lg active:bg-gray-600 active:scale-95 flex items-center justify-center font-bold text-xl text-gray-300 mb-2"
                    >
                        W
                    </button>
                    <div className="flex gap-16">
                        <button
                            {...buttonProps(ActionType.MOVE_LEFT)}
                            className="w-16 h-16 bg-gray-800 border-2 border-gray-600 rounded-lg active:bg-gray-600 active:scale-95 flex items-center justify-center font-bold text-xl text-gray-300"
                        >
                            A
                        </button>
                        <button
                            {...buttonProps(ActionType.MOVE_RIGHT)}
                            className="w-16 h-16 bg-gray-800 border-2 border-gray-600 rounded-lg active:bg-gray-600 active:scale-95 flex items-center justify-center font-bold text-xl text-gray-300"
                        >
                            D
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Action Buttons Area */}
            <div className="flex pointer-events-auto opacity-80 select-none pb-4 pr-4 relative">

                <button
                    {...buttonProps(ActionType.PUNCH)}
                    className="absolute bottom-[20px] right-[140px] w-[70px] h-[70px] rounded-full bg-blue-600/80 border-2 border-blue-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(37,99,235,0.8)] active:scale-90 transition-transform"
                >
                    P
                </button>

                <button
                    {...buttonProps(ActionType.KICK)}
                    className="absolute bottom-[20px] right-[50px] w-[70px] h-[70px] rounded-full bg-green-600/80 border-2 border-green-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(22,163,74,0.8)] active:scale-90 transition-transform"
                >
                    K
                </button>

                <button
                    {...buttonProps(ActionType.SMASH)}
                    className="absolute bottom-[90px] right-[95px] w-[70px] h-[70px] rounded-full bg-red-600/80 border-2 border-red-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(220,38,38,0.8)] active:scale-90 transition-transform"
                >
                    S
                </button>

                <button
                    {...buttonProps(ActionType.BLOCK)}
                    className="absolute bottom-[90px] right-[185px] w-[60px] h-[60px] rounded-full bg-zinc-600/80 border-2 border-zinc-400 flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(82,82,91,0.8)] active:scale-90 transition-transform"
                >
                    BLK
                </button>

                <button
                    {...buttonProps(ActionType.SPECIAL)}
                    className="absolute bottom-[160px] right-[140px] w-[70px] h-[70px] rounded-full bg-yellow-500/80 border-2 border-yellow-300 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(234,179,8,0.8)] active:scale-90 transition-transform"
                >
                    SPC
                </button>
            </div>
        </div>
    );
};
