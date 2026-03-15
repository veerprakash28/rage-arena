# Rage Arena 🥊

A real-time multiplayer browser fighting game built with React, Node.js, and Socket.IO.

## Game Features
- Real-time 60fps multiplayer combat
- Unique fighter archetypes (Shadow Ninja, Iron Boxer, Street Brawler)
- Retro arcade aesthetic with a custom HTML5 canvas renderer
- Global state management & room-code based matchmaking
- Cross-platform play with desktop keyboard and mobile touch controls

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS v4, Zustand, HTML5 Canvas API
- **Backend**: Node.js, Express, Socket.IO
- **Language**: TypeScript (Monorepo with NPM Workspaces)

## Local Development

1. Install all dependencies recursively:
   ```bash
   npm install
   ```

2. Start both the client and server concurrently:
   ```bash
   npm run dev
   ```

   - **Client**: `http://localhost:3000`
   - **Server**: `http://localhost:3001`

## Deployment 🚀

Rage Arena is optimized for deployment on **Railway** (Server) and **Vercel** (Client).

### Quick Setup:
1. **Server (Railway)**: Build command `npm install && npm run build`, Start command `npm start`.
2. **Client (Vercel)**: Build command `npm run build`, env var `VITE_SERVER_URL` set to your Railway URL.
