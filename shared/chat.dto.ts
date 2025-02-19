import { type User } from './user.dto';
import { MessageStatus } from './gateway.dto';
export interface Message {
  id: number;
  content: string;
  chatId: number;
  senderId: number;
  status: MessageStatus;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface CreateChatRequestDto {
  userIds: number[];
  content: string;
}

export interface CreateChatResponseDto {
  id: number;
  createdAt: Date;
  members: User[];
  messages: Message[];
}

export interface GetChatResponseDto {
  id: number;
  members: User[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
