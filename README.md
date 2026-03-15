# Rage Arena 🥊

A real-time 3D multiplayer browser fighting game built with React Three Fiber, Node.js, and Socket.IO.

**Live Game:** [https://rage-arena.netlify.app/](https://rage-arena.netlify.app/)

## Game Features
- **3D Multiplayer Combat**: Real-time 60fps battles powered by Socket.IO.
- **Cyberpunk Aesthetic**: Neon-drenched arena with bloom, screen shake, and hit-stop effects.
- **Unique Fighters**: Dynamic character archetypes with distinct weight and movesets.
- **Advanced Physics**: Knock-up effects, procedural animations, and collision detection.
- **Room-Based Matchmaking**: Join friends with unique room codes.

## Tech Stack
- **Frontend**: React, Vite, React Three Fiber (Three.js), TailwindCSS v4, Zustand.
- **Backend**: Node.js, Express, Socket.IO, esbuild (Single-Bundle).
- **Language**: TypeScript (Monorepo).

## Local Development

1. Install all dependencies:
   ```bash
   npm install
   ```

2. Start the development environment:
   ```bash
   npm run dev
   ```

   - **Client**: `http://localhost:3000`
   - **Server**: `http://localhost:3001`

## Deployment 🚀

Rage Arena is deployed on **Render** (Backend) and **Netlify** (Frontend).

### Production Build
The project uses an infallible bundling strategy for production:
```bash
npm run build
```
This bundles the server and its dependencies into a single file and compiles the 3D frontend.

### Final Configuration:
- **Server (Render)**: Start command `npm run start --workspace=server`.
- **Client (Netlify)**: Configured via `netlify.toml` with publish directory `client/dist`.
