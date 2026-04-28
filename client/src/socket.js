/**
 * socket.js
 * Creates and exports a single Socket.IO client instance
 * shared across the entire React app.
 */

import { io } from 'socket.io-client';

// In production (Render/Railway), the server URL comes from env.
// In development, Vite proxies /socket.io → localhost:3001.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

const socket = io(SERVER_URL, {
  // Don't auto-connect — we connect manually when needed
  autoConnect: false,
  // Reconnect logic
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'], // websocket first, polling fallback
});

// Debug logging in development
if (import.meta.env.DEV) {
  socket.on('connect',    () => console.log('[Socket] Connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
  socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));
}

export default socket;
