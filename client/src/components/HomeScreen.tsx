import { useState } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';
import { Swords, ArrowRight, UserPlus, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const HomeScreen = () => {
    const { playerName, setPlayerName, setRoomCode } = useStore();
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');

    const handleCreate = () => {
        if (!playerName.trim()) {
            setError('Enter a player name first!');
            return;
        }
        setError('');
        socket.connect();
        socket.emit('create-room', { playerName });

        socket.once('room-created', (code) => {
            setRoomCode(code);
        });
    };

    const handleJoin = () => {
        if (!playerName.trim()) {
            setError('Enter a player name first!');
            return;
        }
        if (!joinCode.trim() || joinCode.length !== 6) {
            setError('Enter a valid 6-character room code!');
            return;
        }
        setError('');
        socket.connect();
        socket.emit('join-room', { code: joinCode.toUpperCase(), playerName });

        socket.once('room-error', (msg) => {
            setError(msg);
            socket.disconnect();
        });
        socket.once('room-joined', (code) => {
            setRoomCode(code);
        });
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0f] relative overflow-hidden font-sans">
            {/* Background Grid & Glows */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="z-10 text-center mb-16"
            >
                <div className="flex items-center justify-center gap-4 mb-6 relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute w-24 h-24 border border-red-500/20 rounded-full"
                    />
                    <Swords className="w-14 h-14 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" strokeWidth={1.5} />
                </div>
                <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-tighter drop-shadow-2xl">
                    RAGE ARENA
                </h1>
                <p className="text-red-400/80 mt-4 text-sm font-medium tracking-[0.3em] uppercase">
                    Next-Gen Web Brawler
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full max-w-md z-10"
            >
                <div className="bg-white/[0.02] border border-white/[0.05] p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    {/* Inner subtle glow */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>

                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
                                <UserPlus className="w-4 h-4" /> Identity
                            </label>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white font-medium focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder:text-gray-600"
                                placeholder="Enter fighter name..."
                                maxLength={16}
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-red-400 text-sm font-medium bg-red-950/30 p-4 rounded-xl border border-red-900/30 flex items-center gap-2"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                {error}
                            </motion.div>
                        )}

                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full my-2"></div>

                        <button
                            onClick={handleCreate}
                            className="group relative w-full bg-white text-black font-black py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden flex items-center justify-center gap-3"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-200 to-white"></div>
                            <span className="relative z-10 flex items-center gap-2">
                                <Gamepad2 className="w-5 h-5" /> HOST A MATCH
                            </span>
                        </button>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px bg-white/5 flex-1"></div>
                            <span className="text-gray-600 text-xs font-bold tracking-widest uppercase">Or Join</span>
                            <div className="h-px bg-white/5 flex-1"></div>
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                className="flex-[2] bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-center font-mono font-bold tracking-[0.2em] focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700 placeholder:tracking-normal"
                                placeholder="ROOM CODE"
                                maxLength={6}
                            />
                            <button
                                onClick={handleJoin}
                                className="flex-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                JOIN <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="absolute bottom-6 text-gray-600 text-xs tracking-widest font-mono">
                RAGE ARENA BUILD v0.9.0
            </div>
        </div>
    );
};
