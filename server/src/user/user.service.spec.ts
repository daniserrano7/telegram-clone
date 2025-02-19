import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { UserService } from './user.service';
import { DbService } from '../db/db.service';

const USER_ID = 1;
const USER_ID_2 = 2;

describe('UserService', () => {
  let service: UserService;
  let dbService: DbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, DbService, JwtService],
    }).compile();

    dbService = module.get<DbService>(DbService);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return an array of users', async () => {
      const mockUsers: Awaited<ReturnType<typeof service.getAllUsers>> = [
        {
          id: USER_ID,
          username: 'username1',
          bio: 'bio',
          avatarUrl: 'avatarUrl',
          onlineStatus: 'ONLINE',
          lastConnection: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: USER_ID_2,
          username: 'username2',
          bio: 'bio',
          avatarUrl: 'avatarUrl',
          onlineStatus: 'ONLINE',
          lastConnection: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      vi.spyOn(dbService.user, 'findMany').mockResolvedValue(
        mockUsers as Prisma.UserGetPayload<{
          include: null;
        }>[],
      );

      const users = await service.getAllUsers();
      expect(users).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should return a single user by id', async () => {
      const mockUser: Awaited<ReturnType<typeof service.getUserById>> = {
        id: USER_ID,
        username: 'username1',
        bio: 'bio',
        avatarUrl: 'avatarUrl',
        onlineStatus: 'ONLINE',
        lastConnection: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      vi.spyOn(dbService.user, 'findUnique').mockResolvedValue(
        mockUser as Prisma.UserGetPayload<{
          include: null;
        }>,
      );

      const user = await service.getUserById(USER_ID);
      expect(user).toEqual(mockUser);
    });

    it('should throw an error if user not found', async () => {
      vi.spyOn(dbService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getUserById(USER_ID)).rejects.toThrowError(
        `User with ID ${USER_ID} not found`,
      );
    });
  });

  describe('findUsersByUsername', () => {
    it('should return all users that match username search', async () => {
      const mockUser: Awaited<ReturnType<typeof service.findUsersByUsername>> =
        [
          {
            id: USER_ID,
            username: 'username1',
            bio: 'bio',
            avatarUrl: 'avatarUrl',
            onlineStatus: 'ONLINE',
            lastConnection: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ];

      vi.spyOn(dbService.user, 'findMany').mockResolvedValue(
        mockUser as Prisma.UserGetPayload<{
          include: null;
        }>[],
      );

      const users = await service.findUsersByUsername('username1');
      expect(users).toEqual(mockUser);
    });

    it('should return an empty array if no users match the search', async () => {
      vi.spyOn(dbService.user, 'findMany').mockResolvedValue([]);

      const users = await service.findUsersByUsername('username1');
      expect(users).toEqual([]);
    });
  });

  // describe('updateUser', () => {
  //   it('should update and return the updated user', async () => {
  //     const mockUser = {
  //       id: 1,
  //       email: 'test@example.com',
  //       name: 'Updated Name',
  //       password: 'password',
  //     };

  //     // Simulamos que Prisma devuelve el usuario actualizado
  //     vi.spyOn(dbService.user, 'findUnique').mockResolvedValue(mockUser);
  //     vi.spyOn(dbService.user, 'update').mockResolvedValue(mockUser);

  //     const updatedUser = await service.updateUser(1, { name: 'Updated Name' });
  //     expect(updatedUser).toEqual(mockUser);
  //   });

  //   it('should throw an error if user to update is not found', async () => {
  //     // Simulamos que Prisma no encuentra el usuario
  //     vi.spyOn(dbService.user, 'findUnique').mockResolvedValue(null);

  //     await expect(
  //       service.updateUser(1, { name: 'Updated Name' }),
  //     ).rejects.toThrowError('User with ID 1 not found');
  //   });
  // });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const mockUser: User = {
        id: USER_ID,
        username: 'usernameUSER_ID',
        bio: 'bio',
        avatarUrl: 'avatarUrl',
        onlineStatus: 'ONLINE',
        password: 'password',
        lastConnection: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Simulamos que Prisma encuentra el usuario y lo elimina
      vi.spyOn(dbService.user, 'findUnique').mockResolvedValue(mockUser);
      vi.spyOn(dbService.user, 'delete').mockResolvedValue(mockUser);

      const result = await service.deleteUser(USER_ID);
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw an error if user to delete is not found', async () => {
      vi.spyOn(dbService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.deleteUser(USER_ID)).rejects.toThrowError(
        `User with ID ${USER_ID} not found`,
      );
    });
  });
});
