import { io } from 'socket.io-client';
const URL = import.meta.env.VITE_SERVER_URL || '';
const socket = io(URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});
export default socket;
