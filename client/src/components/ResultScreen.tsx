import { useStore } from '../store';
import { socket } from '../socket';
import { motion } from 'framer-motion';
import { Trophy, Skull, ArrowRight } from 'lucide-react';

export const ResultScreen = () => {
    const { gameState, playerName, roomCode, screen } = useStore();

    if (screen !== 'results') return null;
    if (!gameState || (gameState.status !== 'ko' && gameState.status !== 'results')) return null;

    const handleLobby = () => {
        socket.emit('return-to-lobby', { code: roomCode });
    };

    const myId = Object.values(gameState.players).find(p => p.name === playerName)?.id;
    const isWinner = gameState.winner === myId;
    const isTie = gameState.winner === 'tie';

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl font-sans overflow-hidden">

            {/* Background effects */}
            {isWinner && !isTie && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.15),transparent_70%)] pointer-events-none"></div>
            )}
            {!isWinner && !isTie && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.15),transparent_70%)] pointer-events-none"></div>
            )}

            <div className="w-full max-w-4xl px-6 relative z-10 flex flex-col items-center">

                <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                    className="text-center w-full"
                >
                    <div className="flex justify-center mb-6">
                        {isTie ? (
                            <div className="w-24 h-24 rounded-full bg-gray-800 border-4 border-gray-600 flex items-center justify-center">
                                <span className="text-4xl font-black text-gray-400">=</span>
                            </div>
                        ) : isWinner ? (
                            <div className="relative">
                                <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-50 rounded-full"></div>
                                <div className="w-24 h-24 rounded-full bg-yellow-500/10 border-4 border-yellow-500 flex items-center justify-center relative z-10">
                                    <Trophy className="w-12 h-12 text-yellow-500" />
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-600 blur-xl opacity-50 rounded-full"></div>
                                <div className="w-24 h-24 rounded-full bg-red-900/40 border-4 border-red-600 flex items-center justify-center relative z-10">
                                    <Skull className="w-12 h-12 text-red-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Add pb-6 (padding-bottom) to prevent clipping the italic descenders like Y */}
                    <h1 className="text-[6rem] md:text-[8rem] font-black italic tracking-tighter uppercase leading-none drop-shadow-2xl mb-4 pb-6">
                        {isTie ? (
                            <span className="text-gray-400">DRAW GAME</span>
                        ) : isWinner ? (
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_30px_rgba(234,179,8,0.6)]">
                                VICTORY
                            </span>
                        ) : (
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 drop-shadow-[0_0_30px_rgba(220,38,38,0.6)]">
                                DEFEATED
                            </span>
                        )}
                    </h1>

                    <div className="h-px w-full max-w-md mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent my-12"></div>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        onClick={handleLobby}
                        className="group relative inline-flex items-center justify-center gap-3 bg-white text-black font-black italic tracking-[0.2em] uppercase py-5 px-10 rounded-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-300 to-white"></div>
                        <span className="relative z-10 flex items-center gap-3">
                            RETURN TO LOBBY <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </motion.button>
                </motion.div>

            </div>

        </div>
    );
};
