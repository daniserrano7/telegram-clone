import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { UserId } from '@shared/user.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class UserService {
  constructor(
    private readonly dbService: DbService,
    private readonly uploadService: UploadService,
  ) {}

  async getAllUsers() {
    return await this.dbService.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        onlineStatus: true,
        lastConnection: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  }

  async getUserById(userId: UserId) {
    const user = await this.dbService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        onlineStatus: true,
        lastConnection: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async findUsersByUsername(username: string) {
    return await this.dbService.user.findMany({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  }

  async searchUsers(search: string) {
    return await this.dbService.user.findMany({
      where: {
        username: { contains: search },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      take: 10,
    });
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
    const user = await this.dbService.user.findUnique({
      where: { id: userId },
    });
    return !!user;
  }

  async getUserContacts(userId: UserId) {
    const contacts = await this.dbService.user.findMany({
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
      select: {
        id: true,
        username: true,
        onlineStatus: true,
        lastConnection: true,
        avatarUrl: true,
        bio: true,
      },
    });

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
    return await this.dbService.user.update({
      where: { id: userId },
      data: { bio },
      select: {
        id: true,
        username: true,
        bio: true,
        email: true,
        onlineStatus: true,
        lastConnection: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateUserAvatar(userId: number, avatarUrl: string) {
    const user = await this.dbService.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (user?.avatarUrl) {
      await this.uploadService.deleteAvatar(user.avatarUrl);
    }

    return await this.dbService.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        email: true,
        onlineStatus: true,
        lastConnection: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
