import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authController } from './auth.controller';
import { AuthService } from './auth.service';

// Mock del AuthService
vi.mock('./auth.service');

describe('AuthController', () => {
  let req: any;
  let res: any;
  let authServiceMock: any;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    authServiceMock = {
      register: vi.fn(),
      login: vi.fn(),
    };
    // Mockear instancia de AuthService
    (AuthService as any).mockImplementation(() => authServiceMock);
  });

  describe('register', () => {
    it('should register a user and return status 201', async () => {
      // Simular el body del request
      req.body = { email: 'test@example.com', password: 'password123' };

      // Simular respuesta del servicio register
      authServiceMock.register.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });

      await authController.register(req, res);

      // Verificar que el servicio fue llamado correctamente
      expect(authServiceMock.register).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );

      // Verificar que el status y la respuesta sean correctas
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        email: 'test@example.com',
      });
    });

    it('should return status 500 on server error', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };

      // Simular un error en el servicio
      authServiceMock.register.mockRejectedValue(new Error('Server error'));

      await authController.register(req, res);

      // Verificar que se devuelva un error 500
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server internal error' });
    });
  });

  describe('login', () => {
    it('should login a user and return token and user', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };

      // Simular respuesta del servicio login
      authServiceMock.login.mockResolvedValue({
        token: 'valid-token',
        user: { id: 1, email: 'test@example.com' },
      });

      await authController.login(req, res);

      // Verificar que el servicio fue llamado correctamente
      expect(authServiceMock.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );

      // Verificar que el token y el usuario sean devueltos
      expect(res.json).toHaveBeenCalledWith({
        token: 'valid-token',
        user: { id: 1, email: 'test@example.com' },
      });
    });

    it('should return status 401 on invalid credentials', async () => {
      req.body = { email: 'test@example.com', password: 'wrong-password' };

      // Simular un error en el servicio login por credenciales inválidas
      authServiceMock.login.mockRejectedValue(new Error('Invalid credentials'));

      await authController.login(req, res);

      // Verificar que se devuelva un error 401
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });
  });
});
