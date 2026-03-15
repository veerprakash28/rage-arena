import { useState } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';
import { Swords } from 'lucide-react';

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

        // Listen for creation locally
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
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 relative overflow-hidden">
            {/* Background Particles/Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="z-10 text-center mb-12">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <Swords className="w-16 h-16 text-red-500" />
                </div>
                <h1 className="text-7xl font-bold title-text text-glow text-white tracking-wider">
                    Rage Arena
                </h1>
                <p className="text-gray-400 mt-4 text-xl tracking-widest uppercase">Select your fighter. Survive the arena.</p>
            </div>

            <div className="glass-panel p-8 rounded-2xl w-full max-w-md z-10 flex flex-col gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Player Name</label>
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                        placeholder="Enter your name..."
                        maxLength={16}
                    />
                </div>

                {error && <div className="text-red-400 text-sm font-medium bg-red-900/20 p-3 rounded-lg border border-red-900/50">{error}</div>}

                <div className="h-px bg-gray-800 w-full my-2"></div>

                <button
                    onClick={handleCreate}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-lg transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                >
                    CREATE NEW ROOM
                </button>

                <div className="flex items-center gap-4">
                    <div className="h-px bg-gray-800 flex-1"></div>
                    <span className="text-gray-500 text-sm font-bold">OR</span>
                    <div className="h-px bg-gray-800 flex-1"></div>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white text-center font-mono tracking-widest focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="ROOM CODE"
                        maxLength={6}
                    />
                    <button
                        onClick={handleJoin}
                        className="bg-blue-600 hover:bg-blue-500 px-6 font-bold rounded-lg transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    >
                        JOIN
                    </button>
                </div>
            </div>
        </div>
    );
};
