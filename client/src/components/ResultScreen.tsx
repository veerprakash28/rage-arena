import { useStore } from '../store';
import { socket } from '../socket';

export const ResultScreen = () => {
    const { gameState, playerName, roomCode, screen } = useStore();

    // Don't show if we've navigated away from the results screen, or if no game state
    if (screen !== 'results') return null;
    if (!gameState || (gameState.status !== 'ko' && gameState.status !== 'results')) return null;

    const handleLobby = () => {
        // Emit formal event to reset room status
        socket.emit('return-to-lobby', { code: roomCode });
    };

    const myId = Object.values(gameState.players).find(p => p.name === playerName)?.id;
    const isWinner = gameState.winner === myId;
    const isTie = gameState.winner === 'tie';

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 absolute top-0 left-0 z-50 backdrop-blur-sm">
            <div className="text-center animate-[scaleIn_0.5s_ease-out]">
                <h1 className={`text-8xl font-bold title-text mb-8 tracking-widest ${isTie ? 'text-gray-400 text-glow-none' : isWinner ? 'text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,1)]' : 'text-red-600 text-glow'}`}>
                    {isTie ? 'DRAW' : isWinner ? 'YOU WIN' : 'YOU LOSE'}
                </h1>

                <div className="flex gap-6 mt-12 justify-center">
                    <button
                        onClick={handleLobby} // Just going to unready and let roomManager handle UI update back to select
                        className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all hover:scale-105"
                    >
                        RETURN TO LOBBY
                    </button>
                </div>
            </div>
        </div>
    );
};
