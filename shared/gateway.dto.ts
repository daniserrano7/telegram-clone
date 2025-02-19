export const Events = {
  USER_STATUS_CHANGE: 'user-status-change',
  USER_TYPING: 'user-typing',
  START_TYPING: 'start-typing',
  STOP_TYPING: 'stop-typing',
  GET_USER_STATUS: 'get-user-status',
  NEW_CHAT: 'new-chat',
  JOIN_CHAT: 'join-chat',
  LEAVE_CHAT: 'leave-chat',
  JOIN_USER: 'join-user',
  LEAVE_USER: 'leave-user',
  SEND_MESSAGE: 'send-message',
  MESSAGE: 'message',
  MESSAGE_STATUS_CHANGE: 'message-status-change',
  MESSAGE_DELIVERED: 'message-delivered',
  MESSAGE_READ: 'message-read',
} as const;

export type UserStatus = 'ONLINE' | 'OFFLINE';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';
