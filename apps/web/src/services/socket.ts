import { io, Socket } from 'socket.io-client';

const getWsUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_WS_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3333';
};

let socket: Socket | null = null;
// Secondary socket for device approval wait screen (no auth token yet)
let publicSocket: Socket | null = null;

export const socketService = {
  connect(restaurantId: string): Socket {
    const token = localStorage.getItem('gourmet_token') || '';

    if (socket) {
      if (socket.connected) return socket;
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }

    socket = io(getWsUrl(), {
      query: { restaurantId, token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log(`[WebSocket] Connected. Socket ID: ${socket?.id}. Room: ${restaurantId}`);
    });
    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });
    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection Error:', error);
    });

    return socket;
  },

  /**
   * Connect without a valid auth token — used by DeviceApprovalWaitScreen.
   * The device needs to receive 'device:approved' / 'device:rejected' events
   * while waiting for admin decision, before it has an access token.
   */
  connectPublic(restaurantId: string): Socket {
    if (publicSocket?.connected) return publicSocket;

    if (publicSocket) {
      publicSocket.removeAllListeners();
      publicSocket.disconnect();
      publicSocket = null;
    }

    publicSocket = io(getWsUrl(), {
      query: { restaurantId, token: 'pending-device' },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    publicSocket.on('connect', () => {
      console.log(`[WebSocket/Public] Connected for device approval: ${publicSocket?.id}`);
    });

    return publicSocket;
  },

  disconnectPublic() {
    if (publicSocket) {
      publicSocket.removeAllListeners();
      publicSocket.disconnect();
      publicSocket = null;
    }
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
      console.log('[WebSocket] Connection closed.');
    }
  },

  getSocket(): Socket | null {
    return socket;
  },

  on(event: string, callback: (...args: any[]) => void) {
    if (socket) socket.on(event, callback);
    if (publicSocket) publicSocket.on(event, callback);
  },

  off(event: string, callback?: (...args: any[]) => void) {
    if (socket) socket.off(event, callback);
    if (publicSocket) publicSocket.off(event, callback);
  }
};
