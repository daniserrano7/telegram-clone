import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { DbService } from '../db/db.service';

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
      const mockUsers = [
        { id: 1, email: 'test1@example.com', password: 'password' },
        { id: 2, email: 'test2@example.com', password: 'password' },
      ];

      vi.spyOn(dbService.user, 'findMany').mockResolvedValue(mockUsers);

      const users = await service.getAllUsers();
      expect(users).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should return a single user by id', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
      };

      vi.spyOn(dbService.user, 'findUnique').mockResolvedValue(mockUser);

      const user = await service.getUserById(1);
      expect(user).toEqual(mockUser);
    });

    it('should throw an error if user not found', async () => {
      // Simulamos que Prisma no encuentra el usuario
      vi.spyOn(dbService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getUserById(1)).rejects.toThrowError(
        'User with ID 1 not found',
      );
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
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
      };

      // Simulamos que Prisma encuentra el usuario y lo elimina
      vi.spyOn(dbService.user, 'findUnique').mockResolvedValue(mockUser);
      vi.spyOn(dbService.user, 'delete').mockResolvedValue(mockUser);

      const result = await service.deleteUser(1);
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw an error if user to delete is not found', async () => {
      vi.spyOn(dbService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.deleteUser(1)).rejects.toThrowError(
        'User with ID 1 not found',
      );
    });
  });
});
