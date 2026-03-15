import { io, Socket } from 'socket.io-client';

const URL = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:3001';

export const socket: Socket = io(URL, {
    autoConnect: false // We will connect manually when user enters name
});
