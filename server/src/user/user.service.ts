import { Injectable, NotFoundException } from '@nestjs/common';
import { User as DbUser } from '@prisma/client';
import { DbService } from '../db/db.service';
import { User, UserId } from '@shared/user.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class UserService {
  constructor(
    private readonly dbService: DbService,
    private readonly uploadService: UploadService,
  ) {}

  async getAllUsers() {
    const dbUsers = await this.dbService.user.findMany({
      omit: {
        password: true,
      },
    });

    const users: User[] = dbUsers.map(mapDbUserToUser);
    return users;
  }

  async getUserById(userId: UserId) {
    const dbUser = await this.dbService.user.findUnique({
      where: { id: userId },
      omit: {
        password: true,
      },
    });

    if (!dbUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return mapDbUserToUser(dbUser);
  }

  async findUsersByUsername(username: string) {
    const dbUsers = await this.dbService.user.findMany({
      where: { username },
      omit: {
        password: true,
      },
    });

    const users: User[] = dbUsers.map(mapDbUserToUser);
    return users;
  }

  async searchUsers(search: string) {
    const dbUsers = await this.dbService.user.findMany({
      where: {
        username: { contains: search },
      },
      omit: {
        password: true,
      },
      take: 10,
    });

    const users: User[] = dbUsers.map(mapDbUserToUser);
    return users;
  }

  async deleteUser(userId: number) {
    const user = await this.dbService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.dbService.user.delete({ where: { id: userId } });
    return { message: 'User deleted successfully' };
  }

  async isUserRegistered(userId: number) {
    const dbUser = await this.dbService.user.findUnique({
      where: { id: userId },
    });

    const user = mapDbUserToUser(dbUser);
    return !!user;
  }

  async getUserContacts(userId: UserId) {
    const dbContacts = await this.dbService.user.findMany({
      where: {
        AND: [
          {
            chats: {
              some: {
                members: {
                  some: {
                    id: userId,
                  },
                },
              },
            },
          },
          {
            id: {
              not: userId,
            },
          },
        ],
      },
      omit: {
        password: true,
      },
    });

    const contacts: User[] = dbContacts.map(mapDbUserToUser);
    return contacts;
  }

  async updateUserOnlineStatus(userId: number, status: 'ONLINE' | 'OFFLINE') {
    await this.dbService.user.update({
      where: { id: userId },
      data: {
        onlineStatus: status,
        lastConnection: new Date(),
      },
    });
  }

  async updateUserBio(userId: number, bio: string) {
    const dbUser = await this.dbService.user.update({
      where: { id: userId },
      data: { bio },
      omit: {
        password: true,
      },
    });

    return mapDbUserToUser(dbUser);
  }

  async updateUserAvatar(userId: number, avatarUrl: string) {
    const dbUser = await this.dbService.user.findUnique({
      where: { id: userId },
      omit: {
        password: true,
      },
    });

    if (dbUser?.avatarUrl) {
      await this.uploadService.deleteAvatar(dbUser.avatarUrl);
    }

    const updatedUser = await this.dbService.user.update({
      where: { id: userId },
      data: { avatarUrl },
      omit: {
        password: true,
      },
    });

    return mapDbUserToUser(updatedUser);
  }
}

export const mapDbUserToUser = (user: Omit<DbUser, 'password'>): User => ({
  id: user.id,
  username: user.username,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  onlineStatus: user.onlineStatus,
  lastConnection: user.lastConnection,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  deletedAt: user.deletedAt,
});
