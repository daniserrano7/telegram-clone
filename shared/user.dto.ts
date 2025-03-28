export type UserId = number;

export type OnlineStatus = 'ONLINE' | 'OFFLINE';

export interface User {
  id: UserId;
  username: string;
  bio: string;
  onlineStatus: OnlineStatus;
  lastConnection: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  avatarUrl: string;
}

export type GetUserRequestDto = {
  id: UserId;
};
export type GetUsersResponseDto = User[];

export type GetUserResponseDto = User;
