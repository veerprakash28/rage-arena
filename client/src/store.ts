import { create } from 'zustand';
import { RoomInfo, GameState } from '@rage-arena/shared';

type AppScreen = 'home' | 'lobby' | 'select' | 'fight' | 'results';

interface AppState {
    screen: AppScreen;
    playerName: string;
    roomCode: string | null;
    room: RoomInfo | null;
    gameState: GameState | null;
    setScreen: (screen: AppScreen) => void;
    setPlayerName: (name: string) => void;
    setRoomCode: (code: string | null) => void;
    setRoom: (room: RoomInfo | null) => void;
    setGameState: (state: GameState | null) => void;
}

export const useStore = create<AppState>((set) => ({
    screen: 'home',
    playerName: '',
    roomCode: null,
    room: null,
    gameState: null,
    setScreen: (screen) => set({ screen }),
    setPlayerName: (name) => set({ playerName: name }),
    setRoomCode: (code) => set({ roomCode: code }),
    setRoom: (room) => set({ room }),
    setGameState: (state) => set({ gameState: state }),
}));
