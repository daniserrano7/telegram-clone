import { Message } from '@shared/chat.dto';
import { MessageStatus } from '@shared/gateway.dto';

// Extended status for client-side messages (server only knows SENT | DELIVERED | READ)
export type LocalMessageStatus = MessageStatus | 'PENDING' | 'FAILED';

// LocalMessage extends Message but allows temporary string IDs and extended status
export interface LocalMessage extends Omit<Message, 'id' | 'status'> {
  id: number | string; // Can be temp_<uuid> or numeric
  status: LocalMessageStatus;
  clientMessageId: string; // Unique ID for deduplication
}

// Pending message stored in IndexedDB
export interface PendingMessage {
  queueOrder?: number; // Auto-increment for ordering
  chatId: number;
  content: string;
  clientMessageId: string;
  status: 'PENDING' | 'FAILED';
  senderId: number;
  createdAt: Date;
  retryCount: number;
}

// Helper to check if an ID is a temporary ID
export function isTempId(id: number | string): id is string {
  return typeof id === 'string' && id.startsWith('temp_');
}

// Generate a temporary ID
export function generateTempId(): string {
  return `temp_${crypto.randomUUID()}`;
}

// Generate a client message ID for deduplication
export function generateClientMessageId(): string {
  return crypto.randomUUID();
}
