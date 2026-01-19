import { db } from './db.service';
import { networkService } from './network.service';
import { socketService } from './socket.service';
import { Events } from '@shared/gateway.dto';
import { Message } from '@shared/chat.dto';
import { PendingMessage, generateClientMessageId } from '../types/local-message';

const SEND_TIMEOUT_MS = 10000; // 10 seconds timeout
const MAX_RETRY_COUNT = 3;

type SyncEventType =
  | 'message-queued'
  | 'message-sending'
  | 'message-sent'
  | 'message-failed'
  | 'sync-started'
  | 'sync-completed';

type SyncEventPayload = {
  'message-queued': { clientMessageId: string; chatId: number };
  'message-sending': { clientMessageId: string };
  'message-sent': { clientMessageId: string; message: Message };
  'message-failed': { clientMessageId: string; error: string };
  'sync-started': { pendingCount: number };
  'sync-completed': { successCount: number; failedCount: number };
};

type SyncListener<T extends SyncEventType> = (payload: SyncEventPayload[T]) => void;

class SyncService {
  private listeners: Map<SyncEventType, Set<SyncListener<any>>> = new Map();
  private isSyncing = false;
  private unsubscribeNetwork: (() => void) | null = null;
  private unsubscribeSocket: (() => void) | null = null;

  init() {
    // Subscribe to network changes
    this.unsubscribeNetwork = networkService.subscribe((isOnline) => {
      if (isOnline) {
        this.attemptSync();
      }
    });

    // Subscribe to socket connection changes
    this.unsubscribeSocket = socketService.onConnectionChange((connected) => {
      if (connected) {
        this.attemptSync();
      }
    });
  }

  destroy() {
    if (this.unsubscribeNetwork) {
      this.unsubscribeNetwork();
      this.unsubscribeNetwork = null;
    }
    if (this.unsubscribeSocket) {
      this.unsubscribeSocket();
      this.unsubscribeSocket = null;
    }
  }

  private canSync(): boolean {
    return networkService.isOnline() && socketService.isActuallyConnected();
  }

  /**
   * Queue a message for sending. Returns immediately with a clientMessageId.
   */
  async queueMessage(
    chatId: number,
    content: string,
    senderId: number
  ): Promise<string> {
    const clientMessageId = generateClientMessageId();
    const pendingMessage: Omit<PendingMessage, 'queueOrder'> = {
      chatId,
      content,
      clientMessageId,
      status: 'PENDING',
      senderId,
      createdAt: new Date(),
      retryCount: 0,
    };

    await db.addPendingMessage(pendingMessage);
    this.emit('message-queued', { clientMessageId, chatId });

    // Try to send immediately if online
    if (this.canSync()) {
      this.attemptSync();
    }

    return clientMessageId;
  }

  /**
   * Process the pending message queue
   */
  async attemptSync(): Promise<void> {
    if (this.isSyncing || !this.canSync()) {
      return;
    }

    this.isSyncing = true;

    try {
      const pendingMessages = await db.getPendingMessages();

      if (pendingMessages.length === 0) {
        this.isSyncing = false;
        return;
      }

      this.emit('sync-started', { pendingCount: pendingMessages.length });

      let successCount = 0;
      let failedCount = 0;

      // Process messages sequentially to preserve order
      for (const pendingMessage of pendingMessages) {
        if (!this.canSync()) {
          // Connection lost during sync
          break;
        }

        const success = await this.sendPendingMessage(pendingMessage);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      this.emit('sync-completed', { successCount, failedCount });
    } finally {
      this.isSyncing = false;
    }
  }

  private async sendPendingMessage(pendingMessage: PendingMessage): Promise<boolean> {
    this.emit('message-sending', { clientMessageId: pendingMessage.clientMessageId });

    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        this.handleSendFailure(pendingMessage, 'Timeout');
        resolve(false);
      }, SEND_TIMEOUT_MS);

      socketService.emit(
        Events.SEND_MESSAGE,
        {
          chatId: pendingMessage.chatId,
          content: pendingMessage.content,
          clientMessageId: pendingMessage.clientMessageId,
        },
        async (result: { status: 'success' | 'error'; message: Message }) => {
          clearTimeout(timeout);

          if (result.status === 'success') {
            // Remove from pending queue
            await db.removePendingMessage(pendingMessage.clientMessageId);
            this.emit('message-sent', {
              clientMessageId: pendingMessage.clientMessageId,
              message: result.message,
            });
            resolve(true);
          } else {
            await this.handleSendFailure(pendingMessage, 'Server error');
            resolve(false);
          }
        }
      );
    });
  }

  private async handleSendFailure(
    pendingMessage: PendingMessage,
    error: string
  ): Promise<void> {
    const newRetryCount = pendingMessage.retryCount + 1;

    if (newRetryCount >= MAX_RETRY_COUNT) {
      // Mark as failed after max retries
      await db.updatePendingMessageStatus(
        pendingMessage.clientMessageId,
        'FAILED',
        newRetryCount
      );
    } else {
      // Update retry count but keep as pending
      await db.updatePendingMessageStatus(
        pendingMessage.clientMessageId,
        'PENDING',
        newRetryCount
      );
    }

    this.emit('message-failed', {
      clientMessageId: pendingMessage.clientMessageId,
      error,
    });
  }

  /**
   * Retry a failed message
   */
  async retryFailedMessage(clientMessageId: string): Promise<boolean> {
    const pendingMessage = await db.getPendingMessageByClientId(clientMessageId);
    if (!pendingMessage) {
      return false;
    }

    // Reset status to PENDING and retry count
    await db.updatePendingMessageStatus(clientMessageId, 'PENDING', 0);

    // Attempt to sync
    if (this.canSync()) {
      this.attemptSync();
    }

    return true;
  }

  /**
   * Cancel a pending or failed message
   */
  async cancelPendingMessage(clientMessageId: string): Promise<boolean> {
    const deleted = await db.removePendingMessage(clientMessageId);
    return deleted > 0;
  }

  // Event emitter methods

  on<T extends SyncEventType>(event: T, listener: SyncListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  private emit<T extends SyncEventType>(event: T, payload: SyncEventPayload[T]): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }
}

export const syncService = new SyncService();
