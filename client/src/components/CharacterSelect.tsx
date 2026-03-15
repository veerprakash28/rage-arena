import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';
import { FighterType } from '@rage-arena/shared';
import { Users, Copy, Check } from 'lucide-react';

const FIGHTERS = [
    { id: FighterType.SHADOW_NINJA, name: 'Shadow Ninja', desc: 'Fast attacks, high mobility.', color: '#911eb4' },
    { id: FighterType.IRON_BOXER, name: 'Iron Boxer', desc: 'Heavy hits, strong defense.', color: '#f58231' },
    { id: FighterType.STREET_BRAWLER, name: 'Street Brawler', desc: 'Balanced all-rounder.', color: '#4363d8' }
];

export const CharacterSelect = () => {
    const { room, roomCode, playerName } = useStore();
    const [selectedFighter, setSelectedFighter] = useState<FighterType | null>(null);
    const [copied, setCopied] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const me = room?.players.find(p => p.name === playerName);
    const opponent = room?.players.find(p => p.name !== playerName);

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

    if (!room) return <div className="text-white text-center mt-20">Loading...</div>;

    return (
        <div className="w-full h-full flex flex-col items-center bg-gray-950 px-4 py-8 overflow-y-auto">
            {/* Header */}
            <div className="w-full max-w-5xl flex justify-between items-center mb-8 bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg font-mono font-bold tracking-widest text-xl flex items-center gap-3">
                        ROOM: {roomCode}
                        <button onClick={handleCopy} className="hover:text-white transition-colors p-1" title="Copy Room Code">
                            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
                <div className="flex gap-4 items-center bg-black/40 px-4 py-2 rounded-lg">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="font-bold text-lg">{room.players.length} / 2 Players</span>
                </div>
            </div>

            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 flex-1">
                {/* Player 1 Card */}
                <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] border-l-4" style={{ borderLeftColor: me?.color || '#fff' }}>
                    <h2 className="text-2xl font-bold mb-2">YOU</h2>
                    <h3 className="text-xl text-gray-400 mb-6">{me?.name}</h3>

                    {me?.fighter ? (
                        <div className="text-center">
                            <div className="text-4xl font-bold title-text mb-4 text-glow">{me.fighter.replace('_', ' ')}</div>
                            {me.isReady ? (
                                <div className="inline-block bg-green-500/20 text-green-400 px-6 py-2 rounded-full font-bold tracking-widest">READY</div>
                            ) : (
                                <div className="inline-block bg-yellow-500/20 text-yellow-400 px-6 py-2 rounded-full font-bold tracking-widest">SELECTING...</div>
                            )}
                        </div>
                    ) : (
                        <div className="text-gray-500 italic">No fighter selected</div>
                    )}
                </div>

                {/* Center: Fighter Selection */}
                <div className="flex flex-col gap-4">
                    {FIGHTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => !isReady && setSelectedFighter(f.id)}
                            disabled={isReady}
                            className={`p-4 rounded-xl border transition-all text-left group
                  ${selectedFighter === f.id
                                    ? 'border-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                    : 'border-gray-800 bg-black/40 hover:bg-white/5'
                                }
                  ${isReady ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                        >
                            <div className="font-bold text-xl title-text">{f.name}</div>
                            <div className="text-sm text-gray-400 mt-1">{f.desc}</div>
                        </button>
                    ))}

                    {room.status === 'countdown' ? (
                        <div className="mt-8 text-center text-red-500 font-bold text-5xl title-text animate-pulse drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]">
                            MATCH STARTING!
                        </div>
                    ) : (
                        <button
                            onClick={toggleReady}
                            disabled={!selectedFighter}
                            className={`w-full mt-4 py-4 rounded-xl font-bold tracking-widest transition-all text-lg
                  ${!selectedFighter
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : isReady
                                        ? 'bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500/10'
                                        : 'bg-red-600 text-white hover:bg-red-500 hover:scale-105 shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                                }
                `}
                        >
                            {isReady ? 'CANCEL READY' : 'READY TO FIGHT'}
                        </button>
                    )}
                </div>

                {/* Player 2 Card */}
                <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] border-r-4" style={{ borderRightColor: opponent?.color || '#333' }}>
                    <h2 className="text-2xl font-bold mb-2">OPPONENT</h2>
                    {opponent ? (
                        <>
                            <h3 className="text-xl text-gray-400 mb-6">{opponent.name}</h3>
                            {opponent.fighter ? (
                                <div className="text-center">
                                    <div className="text-4xl font-bold title-text mb-4 opacity-80">{opponent.fighter.replace('_', ' ')}</div>
                                    {opponent.isReady ? (
                                        <div className="inline-block bg-green-500/10 text-green-500 border border-green-500/30 px-6 py-2 rounded-full font-bold tracking-widest">READY</div>
                                    ) : (
                                        <div className="inline-block bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-6 py-2 rounded-full font-bold tracking-widest">SELECTING...</div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-500 italic">No fighter selected</div>
                            )}
                        </>
                    ) : (
                        <div className="text-gray-500 flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-2 border-gray-700 border-t-red-500 rounded-full animate-spin"></div>
                            Waiting to join...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
