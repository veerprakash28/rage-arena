import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';

export const HUD = () => {
    const { gameState, roomCode, playerName } = useStore();
    const [countdown, setCountdown] = useState<number | null>(null);

    useEffect(() => {
        socket.on('game-countdown', (count: number) => {
            setCountdown(count);
            let c = count;
            const int = setInterval(() => {
                c--;
                if (c > 0) setCountdown(c);
                else {
                    setCountdown(0); // 'FIGHT!'
                    setTimeout(() => setCountdown(null), 1000);
                    clearInterval(int);
                }
            }, 1000);
        });

        return () => {
            socket.off('game-countdown');
        };
    }, []);

    if (!gameState) return null;

    const playerIds = Object.keys(gameState.players);
    let p1 = gameState.players[playerIds[0]];
    let p2 = gameState.players[playerIds[1]];

    // Make sure I am always P1 on my screen, or fallback to first ID
    if (p2.name === playerName) {
        [p1, p2] = [p2, p1];
    }

    const formatTime = (seconds: number) => {
        return Math.max(0, Math.floor(seconds)).toString().padStart(2, '0');
    };

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between">
            {/* Top Bar */}
            <div className="w-full flex justify-between items-start px-8 pt-8 min-w-[320px] max-w-6xl mx-auto">

                {/* P1 Health/Energy (Left) */}
                <div className="flex-1 max-w-sm flex flex-col items-start gap-1">
                    <div className="text-2xl font-bold title-text" style={{ color: p1.color }}>{p1.name}</div>
                    <div className="w-full h-8 bg-gray-900 border-2 border-gray-700 relative overflow-hidden transform skew-x-[-15deg] shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                        <div
                            className="h-full bg-gradient-to-l from-yellow-300 to-red-600 transition-all duration-150 ease-out"
                            style={{ width: `${(p1.hp / 100) * 100}%` }}
                        ></div>
                    </div>
                    {/* Energy Left */}
                    <div className="w-3/4 h-3 bg-gray-900 border border-gray-700 relative overflow-hidden transform skew-x-[-15deg] mt-1">
                        <div
                            className="h-full bg-cyan-400 box-glow transition-all duration-200"
                            style={{ width: `${(p1.energy / 100) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Timer */}
                <div className="mx-8 flex flex-col items-center justify-center transform scale-y-110 mt-2">
                    <div className="text-5xl font-bold title-text text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,1)]">
                        {formatTime(gameState.roundTimer)}
                    </div>
                </div>

                {/* P2 Health/Energy (Right) */}
                <div className="flex-1 max-w-sm flex flex-col items-end gap-1">
                    <div className="text-2xl font-bold title-text" style={{ color: p2.color }}>{p2.name}</div>
                    <div className="w-full h-8 bg-gray-900 border-2 border-gray-700 relative overflow-hidden transform skew-x-[15deg] shadow-[0_0_10px_rgba(0,0,0,0.5)] flex justify-end">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-300 to-red-600 transition-all duration-150 ease-out"
                            style={{ width: `${(p2.hp / 100) * 100}%` }}
                        ></div>
                    </div>
                    {/* Energy Right */}
                    <div className="w-3/4 h-3 bg-gray-900 border border-gray-700 relative overflow-hidden transform skew-x-[15deg] mt-1 flex justify-end">
                        <div
                            className="h-full bg-cyan-400 box-glow transition-all duration-200"
                            style={{ width: `${(p2.energy / 100) * 100}%` }}
                        ></div>
                    </div>
                </div>

            </div>

            {/* Center Announcements overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                {countdown !== null && (
                    <div className="text-9xl font-bold title-text text-glow text-white animate-bounce">
                        {countdown === 0 ? 'FIGHT!' : countdown}
                    </div>
                )}
                {gameState.status === 'ko' && (
                    <div className="text-9xl font-bold title-text text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,1)] animate-pulse scale-150 mb-20 italic">
                        K.O.
                    </div>
                )}
            </div>

        </div>
    );
};
