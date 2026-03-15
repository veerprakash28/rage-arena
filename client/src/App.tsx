import { useEffect } from 'react';
import { useStore } from './store';
import { socket } from './socket';
import { HomeScreen } from './components/HomeScreen';
import { CharacterSelect } from './components/CharacterSelect';
import { FightScreen } from './components/FightScreen';
import { ResultScreen } from './components/ResultScreen';

function App() {
    const { screen, setRoom, setScreen, setGameState } = useStore();

    useEffect(() => {
        socket.on('room-update', (room) => {
            setRoom(room);

            // Auto-transition based on room status
            const currentScreen = useStore.getState().screen;
            if (room.status === 'waiting' && (currentScreen === 'home' || currentScreen === 'results' || currentScreen === 'fight')) {
                // If we just joined from home, or returned from results, go to character select
                setGameState(null); // clear stale game state so KO overlay doesn't show
                setScreen('select');
            }
            else if (room.status === 'countdown' || room.status === 'playing') {
                if (currentScreen !== 'fight') setScreen('fight');
            }
            else if (room.status === 'results' && currentScreen !== 'results') {
                setScreen('results');
            }
        });

        socket.on('game-state', (state) => {
            setGameState(state);
        });

        socket.on('game-countdown', () => {
            // Could trigger sound or animation
        });

        return () => {
            socket.off('room-update');
            socket.off('game-state');
            socket.off('game-countdown');
        };
    }, [setRoom, setScreen, setGameState]);

    return (
        <div className="w-full h-full">
            {screen === 'home' && <HomeScreen />}
            {screen === 'select' && <CharacterSelect />}
            {screen === 'fight' && <FightScreen />}
            {screen === 'results' && <ResultScreen />}
        </div>
    );
}

export default App;
