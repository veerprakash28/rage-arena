import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';
import { FighterType } from '@rage-arena/shared';
import { Users, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FIGHTERS = [
    { id: FighterType.SHADOW_NINJA, name: 'Shadow Ninja', desc: 'Fast attacks, high mobility.', color: '#ef4444', accent: 'from-red-600 to-red-900', stats: { speed: 9, power: 4, defense: 3 } },
    { id: FighterType.IRON_BOXER, name: 'Iron Boxer', desc: 'Heavy hits, strong defense.', color: '#f59e0b', accent: 'from-amber-500 to-amber-700', stats: { speed: 4, power: 8, defense: 9 } },
    { id: FighterType.STREET_BRAWLER, name: 'Street Brawler', desc: 'Balanced all-rounder.', color: '#3b82f6', accent: 'from-blue-600 to-blue-900', stats: { speed: 6, power: 6, defense: 6 } }
];

export const CharacterSelect = () => {
    const { room, roomCode, playerName } = useStore();
    const [selectedFighter, setSelectedFighter] = useState<FighterType | null>(null);
    const [copied, setCopied] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const me = room?.players.find((p: any) => p.name === playerName);
    const opponent = room?.players.find((p: any) => p.name !== playerName);

    useEffect(() => {
        if (selectedFighter && me?.color) {
            socket.emit('select-fighter', { code: roomCode, fighter: selectedFighter, color: me.color });
        }
    }, [selectedFighter, me?.color, roomCode]);

    const handleCopy = () => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const toggleReady = () => {
        if (!selectedFighter) return;
        const next = !isReady;
        setIsReady(next);
        socket.emit('player-ready', { code: roomCode, ready: next });
    };

    if (!room) return (
        <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
            <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
        </div>
    );

    const getFighterDetails = (id?: FighterType) => FIGHTERS.find((f: any) => f.id === id);

    return (
        <div className="w-full h-full flex flex-col bg-[#0a0a0f] text-white p-6 md:p-12 relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(220,38,38,0.15),transparent_70%)] pointer-events-none"></div>

            {/* Header */}
            <header className="w-full max-w-7xl mx-auto flex justify-between items-center mb-12 z-10 relative">
                <div className="flex items-center gap-6">
                    <h1 className="text-3xl font-black italic tracking-tighter">RAGE ARENA</h1>
                    <div className="h-6 w-px bg-white/20"></div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopy}
                        className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-lg cursor-pointer hover:bg-white/10 hover:border-red-500/50 transition-all font-mono"
                    >
                        <span className="text-gray-400 text-xs">ROOM CODE</span>
                        <span className="font-bold tracking-[0.2em]">{roomCode}</span>
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </motion.div>
                </div>

                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2 rounded-full">
                    <Users className="w-4 h-4 text-red-400" />
                    <span className="font-bold text-sm tracking-widest">{room.players.length} / 2 FIGHTERS</span>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px_1fr] gap-8 z-10 relative">

                {/* Player 1 Details */}
                <div className="flex flex-col relative h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="text-[12rem] font-black italic -tracking-[0.05em] leading-none">P1</span>
                    </div>

                    <h2 className="text-xl font-bold tracking-widest text-gray-400 mb-2 uppercase">{me?.name}</h2>
                    <div className="flex-1 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
                        {me?.fighter ? (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={me.fighter}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="h-full flex flex-col justify-between relative z-10"
                                >
                                    <div>
                                        <h3 className="text-5xl font-black italic tracking-tight uppercase leading-none mb-4">
                                            {getFighterDetails(me.fighter)?.name}
                                        </h3>
                                        <p className="text-gray-400">{getFighterDetails(me.fighter)?.desc}</p>
                                    </div>

                                    <div className="flex flex-col gap-4 mt-8 pb-12">
                                        {(['speed', 'power', 'defense'] as const).map(stat => (
                                            <div key={stat}>
                                                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                                    <span>{stat}</span>
                                                    <span>{getFighterDetails(me.fighter)?.stats[stat]}/10</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(getFighterDetails(me.fighter)?.stats[stat] || 0) * 10}%` }}
                                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                                        className="h-full bg-white rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-gray-600 font-medium tracking-widest uppercase">Select your fighter</span>
                            </div>
                        )}

                        {/* Status Overlay */}
                        {me?.fighter && (
                            <div className="absolute bottom-6 right-6 flex items-center gap-2">
                                {me.isReady ? (
                                    <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div> READY
                                    </div>
                                ) : (
                                    <div className="bg-white/5 border border-white/20 text-white/50 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase">
                                        SELECTING
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Center Roster */}
                <div className="flex flex-col h-full justify-center">
                    <div className="text-center font-bold tracking-[0.3em] text-sm text-gray-500 mb-6 uppercase">Choose Fighter</div>
                    <div className="flex flex-col gap-3">
                        {FIGHTERS.map(f => {
                            const isSelected = selectedFighter === f.id;
                            const isP2Selected = opponent?.fighter === f.id;

                            return (
                                <motion.button
                                    key={f.id}
                                    whileHover={!isReady ? { scale: 1.02, x: 5 } : {}}
                                    onClick={() => !isReady && setSelectedFighter(f.id)}
                                    disabled={isReady}
                                    className={`relative p-5 rounded-2xl border text-left flex items-center justify-between overflow-hidden transition-all
                                        ${isSelected
                                            ? 'border-white bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                                            : 'border-white/5 bg-black/40 hover:bg-white/5'
                                        }
                                        ${isReady ? 'opacity-40 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {isSelected && (
                                        <motion.div layoutId="selectionGlow" className={`absolute inset-0 bg-gradient-to-r ${f.accent} opacity-20`} />
                                    )}

                                    <div className="relative z-10 flex flex-col gap-1">
                                        <div className="font-bold text-xl italic tracking-tight uppercase">{f.name}</div>
                                    </div>

                                    {/* Indicators if P1 or P2 has selected this */}
                                    <div className="flex gap-2 relative z-10">
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#fff]"></div>}
                                        {isP2Selected && <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]"></div>}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    <div className="mt-8 h-20">
                        {room.status === 'countdown' ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full h-full flex items-center justify-center bg-red-600 rounded-2xl border border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.5)]"
                            >
                                <span className="text-2xl font-black italic tracking-widest uppercase animate-pulse">Match Starting</span>
                            </motion.div>
                        ) : (
                            <button
                                onClick={toggleReady}
                                disabled={!selectedFighter}
                                className={`w-full h-full rounded-2xl font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center
                                    ${!selectedFighter
                                        ? 'bg-white/5 text-gray-600 border border-white/10 cursor-not-allowed'
                                        : isReady
                                            ? 'bg-transparent border-2 border-white/20 text-gray-400 hover:bg-white/5 hover:border-white/40'
                                            : 'bg-white text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                    }
                                `}
                            >
                                {isReady ? 'CANCEL' : 'READY TO FIGHT'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Player 2 Details */}
                <div className="flex flex-col relative h-full">
                    <div className="absolute top-0 left-0 p-4 opacity-10">
                        <span className="text-[12rem] font-black italic -tracking-[0.05em] leading-none">P2</span>
                    </div>

                    <h2 className="text-xl font-bold tracking-widest text-gray-400 mb-2 uppercase text-right">{opponent?.name || 'WAITING'}</h2>
                    <div className="flex-1 bg-gradient-to-bl from-white/5 to-transparent border border-white/10 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
                        {opponent ? (
                            opponent.fighter ? (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={opponent.fighter}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="h-full flex flex-col justify-between relative z-10 text-right"
                                    >
                                        <div>
                                            <h3 className="text-5xl font-black italic tracking-tight uppercase leading-none mb-4 text-gray-300">
                                                {getFighterDetails(opponent.fighter)?.name}
                                            </h3>
                                            <p className="text-gray-500">{getFighterDetails(opponent.fighter)?.desc}</p>
                                        </div>

                                        <div className="flex flex-col gap-4 mt-8 pb-12">
                                            {(['speed', 'power', 'defense'] as const).map(stat => (
                                                <div key={stat}>
                                                    <div className="flex justify-between text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 flex-row-reverse">
                                                        <span>{stat}</span>
                                                        <span>{getFighterDetails(opponent.fighter)?.stats[stat]}/10</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex justify-end">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(getFighterDetails(opponent.fighter)?.stats[stat] || 0) * 10}%` }}
                                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                                            className="h-full bg-gray-500 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-gray-600 font-medium tracking-widest uppercase">Selecting fighter</span>
                                </div>
                            )
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-gray-500">
                                <div className="relative">
                                    <div className="w-16 h-16 border-2 border-white/10 rounded-full"></div>
                                    <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                                </div>
                                <span className="font-bold tracking-[0.2em] text-sm uppercase">Awaiting Challenger</span>
                            </div>
                        )}

                        {/* Status Overlay P2 */}
                        {opponent?.fighter && (
                            <div className="absolute bottom-6 left-6 flex items-center gap-2">
                                {opponent.isReady ? (
                                    <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> READY
                                    </div>
                                ) : (
                                    <div className="bg-white/5 border border-white/20 text-white/50 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase">
                                        SELECTING
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
