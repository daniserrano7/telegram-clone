import { io, Socket } from 'socket.io-client';
import { Events } from '@shared/gateway.dto';

type Listener = (...args: any[]) => void;
type EventName = (typeof Events)[keyof typeof Events];

class SocketService {
  private socket: Socket | null = null;

  /**
   * Initialise the websocket connection only once. Subsequent calls are no-ops.
   */
  init(token: string | undefined | null): void {
    if (this.socket) return;

    const socketUrl = import.meta.env.VITE_WS_URL;
    this.socket = io(socketUrl, {
      auth: {
        token,
      },
    });

    // Heartbeat handling – keeps the connection alive and verified
    this.on(Events.HEARTBEAT, () => {
      this.emit(Events.HEARTBEAT_RESPONSE);
    });
  }

  /**
   * Register an event listener (typed by Events enum)
   */
  on(event: EventName, listener: Listener): void {
    if (!this.socket) {
      console.warn('[SocketService] on() called before init');
      return;
    }
    this.socket.on(event, listener);
  }

  /**
   * Convenience wrapper to unregister a listener
   */
  off(event: EventName, listener: Listener): void {
    if (!this.socket) return;
    this.socket.off(event, listener);
  }

  /**
   * Emit an event with arbitrary payload / acknowledgement callback.
   */
  emit(event: EventName, ...args: any[]): void {
    if (!this.socket) {
      console.warn('[SocketService] emit() called before init');
      return;
    }
    // @ts-ignore – rest args follow Socket.IO signature
    this.socket.emit(event, ...args);
  }

  /**
   * Whether the socket is currently created (not necessarily connected).
   */
  isConnected(): boolean {
    return !!this.socket;
  }

  /**
   * Disconnect and dispose the socket instance.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
