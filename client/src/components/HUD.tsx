import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';
import { motion, AnimatePresence } from 'framer-motion';

export const HUD = () => {
    const { gameState, playerName } = useStore();
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

    // Ensure local player is always P1 on their screen
    if (p2.name === playerName) {
        [p1, p2] = [p2, p1];
    }

    const formatTime = (seconds: number) => {
        return Math.max(0, Math.floor(seconds)).toString().padStart(2, '0');
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between font-sans">

            {/* Top Bar HUD */}
            <header className="w-full flex justify-between items-start px-4 md:px-12 pt-6 xl:pt-10 max-w-[1600px] mx-auto">
                {/* P1 Stats */}
                <div className="flex-1 max-w-[40%] flex flex-col items-start gap-1.5 z-20">
                    <div className="flex items-end gap-3 mb-1">
                        <span className="text-3xl lg:text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                            {p1.name}
                        </span>
                        <span className="text-sm font-bold tracking-widest text-white/50 mb-1 uppercase hidden md:inline-block">
                            {p1.fighter.replace('_', ' ')}
                        </span>
                    </div>

                    {/* HP Bar Container */}
                    <div className="w-full h-8 lg:h-10 bg-black/60 border-2 border-white/20 relative overflow-hidden transform skew-x-[-15deg] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] z-10 mix-blend-overlay opacity-20"></div>
                        <motion.div
                            initial={{ width: '100%' }}
                            animate={{ width: `${Math.max(0, (p1.hp / 100) * 100)}%` }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                            className="h-full relative z-0"
                            style={{
                                background: p1.hp > 30
                                    ? `linear-gradient(90deg, #eab308 0%, #ef4444 100%)`
                                    : '#ef4444',
                                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
                            }}
                        />
                    </div>

                    {/* Energy Bar */}
                    <div className="w-[70%] h-3 lg:h-4 bg-black/60 border border-white/20 relative overflow-hidden transform skew-x-[-15deg] backdrop-blur-md mt-1">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(p1.energy / 100) * 100}%` }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                            className={`h-full relative ${p1.energy >= 50 ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]' : 'bg-cyan-700'}`}
                        />
                    </div>
                </div>

                {/* Match Timer */}
                <div className="mx-6 lg:mx-12 flex flex-col items-center justify-start mt-1 lg:mt-2 relative z-20">
                    <div className="relative border-4 border-yellow-500/20 bg-black/80 px-6 py-2 rounded-xl backdrop-blur-md shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                        <div className="text-5xl lg:text-7xl font-black italic tracking-tighter text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                            {formatTime(gameState.roundTimer)}
                        </div>
                    </div>
                </div>

                {/* P2 Stats */}
                <div className="flex-1 max-w-[40%] flex flex-col items-end gap-1.5 z-20">
                    <div className="flex items-end gap-3 mb-1 flex-row-reverse">
                        <span className="text-3xl lg:text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                            {p2.name}
                        </span>
                        <span className="text-sm font-bold tracking-widest text-white/50 mb-1 uppercase hidden md:inline-block">
                            {p2.fighter.replace('_', ' ')}
                        </span>
                    </div>

                    {/* HP Bar Container */}
                    <div className="w-full h-8 lg:h-10 bg-black/60 border-2 border-white/20 relative overflow-hidden transform skew-x-[15deg] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex justify-end">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] z-10 mix-blend-overlay opacity-20"></div>
                        <motion.div
                            initial={{ width: '100%' }}
                            animate={{ width: `${Math.max(0, (p2.hp / 100) * 100)}%` }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                            className="h-full relative z-0 origin-right"
                            style={{
                                background: p2.hp > 30
                                    ? `linear-gradient(-90deg, #eab308 0%, #ef4444 100%)`
                                    : '#ef4444',
                                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
                            }}
                        />
                    </div>

                    {/* Energy Bar */}
                    <div className="w-[70%] h-3 lg:h-4 bg-black/60 border border-white/20 relative overflow-hidden transform skew-x-[15deg] backdrop-blur-md mt-1 flex justify-end">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(p2.energy / 100) * 100}%` }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                            className={`h-full relative origin-right ${p2.energy >= 50 ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]' : 'bg-cyan-700'}`}
                        />
                    </div>
                </div>
            </header>

            {/* Center Announcements (Countdown / KO) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden">
                <AnimatePresence>
                    {countdown !== null && (
                        <motion.div
                            key="countdown"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 2, opacity: 0 }}
                            className="relative"
                        >
                            <span className="text-[12rem] md:text-[20rem] font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                                {countdown === 0 ? 'FIGHT!' : countdown}
                            </span>
                        </motion.div>
                    )}

                    {gameState.status === 'ko' && (
                        <motion.div
                            key="ko"
                            initial={{ scale: 5, opacity: 0, rotate: -15 }}
                            animate={{ scale: 1, opacity: 1, rotate: [-15, 0, -5, 0] }}
                            transition={{ type: "spring", bounce: 0.6, duration: 1 }}
                            className="relative"
                        >
                            {/* Giant backdrop glow */}
                            <div className="absolute inset-0 bg-red-600 blur-[150px] opacity-50 rounded-full"></div>
                            <span className="text-[15rem] md:text-[25rem] leading-none font-black italic tracking-tighter text-red-600 drop-shadow-[0_10px_50px_rgba(220,38,38,0.8)]">
                                K.O.
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Edge vignettes for cinematic effect */}
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] z-0 mix-blend-overlay"></div>
        </div>
    );
};
