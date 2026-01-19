export type UserId = number;

export type OnlineStatus = 'ONLINE' | 'OFFLINE';

export interface User {
  id: UserId;
  username: string;
  bio: string | null;
  onlineStatus: OnlineStatus;
  lastConnection: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  avatarUrl: string | null;
  isBlockedByMe?: boolean;
  hasBlockedMe?: boolean;
}

export type GetUserRequestDto = {
  id: UserId;
};
export type GetUsersResponseDto = User[];

export type GetUserResponseDto = User;
