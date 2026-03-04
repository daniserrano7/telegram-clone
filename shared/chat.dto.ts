import { type User } from './user.dto';
import {
  MessageStatus,
  ChatType,
  ChatMemberRole,
  MessageType,
} from './gateway.dto';

export interface ChatMembership {
  id: number;
  userId: number;
  role: ChatMemberRole;
  addedBy: number | null;
  addedAt: Date;
}

export interface Message {
  id: number;
  content: string;
  type: MessageType;
  chatId: number;
  senderId: number | null;
  status: MessageStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface Chat {
  id: number;
  type: ChatType;
  name: string | null;
  description: string | null;
  avatarUrl: string | null;
  createdBy: number | null;
  members: User[];
  memberships: ChatMembership[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateChatRequestDto {
  userIds: number[];
  content: string;
}

export interface CreateGroupRequestDto {
  name: string;
  description?: string;
  avatarUrl?: string;
  userIds: number[];
  content?: string;
}

export interface UpdateGroupRequestDto {
  name?: string;
  description?: string;
  avatarUrl?: string;
}

export interface AddMembersRequestDto {
  userIds: number[];
}

export interface RemoveMemberRequestDto {
  userId: number;
}

export interface UpdateMemberRoleRequestDto {
  userId: number;
  role: ChatMemberRole;
}

export interface CreateChatResponseDto {
  id: number;
  type: ChatType;
  name: string | null;
  description: string | null;
  avatarUrl: string | null;
  createdBy: number | null;
  createdAt: Date;
  members: User[];
  memberships: ChatMembership[];
  messages: Message[];
}

export interface GetChatResponseDto {
  id: number;
  type: ChatType;
  name: string | null;
  description: string | null;
  avatarUrl: string | null;
  createdBy: number | null;
  members: User[];
  memberships: ChatMembership[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
