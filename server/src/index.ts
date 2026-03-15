import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms/RoomManager';
import { setupHandlers } from './sockets/handlers';
import { GameEngine } from './game-engine/GameLoop';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', // Allow development client
        methods: ['GET', 'POST']
    }
});

const roomManager = new RoomManager();
const gameEngine = new GameEngine(io, roomManager);

// Setup socket event handlers
setupHandlers(io, roomManager, gameEngine);

// Basic health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
