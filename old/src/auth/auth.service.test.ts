import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { AuthService } from './auth.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/__mocks__/db';

vi.mock('bcryptjs');
vi.mock('jsonwebtoken');
vi.mock('../../prisma/db');

describe('AuthService', () => {
  const authService = new AuthService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should throw an error if email or password is missing', async () => {
      await expect(authService.register('', 'password')).rejects.toThrow(
        'Email and password are required'
      );
      await expect(authService.register('email', '')).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('should throw an error if user already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'anyPassword',
      });

      await expect(
        authService.register('test@example.com', 'password')
      ).rejects.toThrow('User already exists');
    });

    it('should hash password and create user', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // No existe usuario
      prisma.user.create.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      });
      (bcrypt.hash as Mock).mockResolvedValue('hashedPassword');
      (jwt.sign as Mock).mockReturnValue('token');

      const result = await authService.register(
        'test@example.com',
        'hashedPassword'
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('hashedPassword', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'test@example.com', password: 'hashedPassword' },
      });
      expect(result).toEqual({
        user: { id: 1, email: 'test@example.com' },
        token: 'token',
      });
    });
  });

  describe('login', () => {
    it('should throw an error if email or password is missing', async () => {
      await expect(authService.login('', 'password')).rejects.toThrow(
        'Email and password are required'
      );
      await expect(authService.login('email', '')).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('should throw an error if invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // Usuario no encontrado

      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw an error if password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      });
      (bcrypt.compare as Mock).mockResolvedValue(false); // Contraseña incorrecta

      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should return token if login is successful', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      });
      (bcrypt.compare as Mock).mockResolvedValue(true); // Contraseña correcta
      (jwt.sign as Mock).mockReturnValue('token');

      const result = await authService.login('test@example.com', 'password');

      expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });
      expect(result).toEqual({
        token: 'token',
        user: { id: 1, email: 'test@example.com', password: 'hashedPassword' },
      });
    });
  });
});
