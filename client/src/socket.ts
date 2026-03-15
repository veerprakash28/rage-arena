import { io, Socket } from 'socket.io-client';

// Use VITE_SERVER_URL from environment for production, fallback to localhost for development
const DEFAULT_URL = 'http://localhost:3001';
const URL = import.meta.env.PROD
    ? (import.meta.env.VITE_SERVER_URL || window.location.origin)
    : DEFAULT_URL;

export const socket: Socket = io(URL, {
    autoConnect: false,
    transports: ['websocket'] // Force websocket for faster RTT in a brawler
});
