import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestingModule, Test } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import { NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { JwtService } from '@nestjs/jwt';

const USER_ID = 1;
const USER_EMAIL = 'test@email.com';

describe('UserController', () => {
  let module: TestingModule;
  let app: INestApplication;
  let userService: UserService;
  let userController: UserController;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService, DbService, JwtService],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    await app.init();
    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    vi.clearAllMocks(); // Limpia los mocks entre tests
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  it('should return all users', async () => {
    const mockUsers = [{ id: USER_ID, email: USER_EMAIL }];

    vi.spyOn(userService, 'getAllUsers').mockResolvedValue(mockUsers);

    const res = await request(app.getHttpServer()).get('/users').expect(200);

    expect(res.body).toEqual(mockUsers);
    expect(userService.getAllUsers).toHaveBeenCalledTimes(1);
  });

  it('should return a single user by id', async () => {
    const mockUser = { id: USER_ID, email: USER_EMAIL };

    vi.spyOn(userService, 'getUserById').mockResolvedValue(mockUser);

    const res = await request(app.getHttpServer())
      .get(`/users/${USER_ID}`)
      .expect(200);

    expect(res.body).toEqual(mockUser);
    expect(userService.getUserById).toHaveBeenCalledWith(USER_ID);
    expect(userService.getUserById).toHaveBeenCalledTimes(1);
  });

  it('should return 404 if user not found', async () => {
    vi.spyOn(userService, 'getUserById').mockRejectedValue(
      new NotFoundException('User not found'),
    );

    const res = await request(app.getHttpServer())
      .get(`/users/${USER_ID}`)
      .expect(404);

    expect(res.body.message).toEqual('User not found');
    expect(userService.getUserById).toHaveBeenCalledWith(USER_ID);
  });

  it('should delete a user by id', async () => {
    const mockDeleteResult = { message: 'User deleted successfully' };

    vi.spyOn(userService, 'deleteUser').mockResolvedValue(mockDeleteResult);
    const res = await request(app.getHttpServer())
      .delete(`/users/${USER_ID}`)
      .expect(200);

    expect(res.body).toEqual(mockDeleteResult);
    expect(userService.deleteUser).toHaveBeenCalledWith(USER_ID);
    expect(userService.deleteUser).toHaveBeenCalledTimes(1);
  });

  it('should return 404 when trying to delete a non-existent user', async () => {
    vi.spyOn(userService, 'deleteUser').mockRejectedValue(
      new NotFoundException('User not found'),
    );

    const res = await request(app.getHttpServer())
      .delete(`/users/${USER_ID}`)
      .expect(404);

    expect(res.body.message).toEqual('User not found');
    expect(userService.deleteUser).toHaveBeenCalledWith(USER_ID);
  });

  it('should return 500 when an error occurs', async () => {
    vi.spyOn(userService, 'deleteUser').mockRejectedValue(new Error('Error'));

    const res = await request(app.getHttpServer())
      .delete(`/users/${USER_ID}`)
      .expect(500);

    expect(res.body.message).toEqual('Failed to delete user');
    expect(userService.deleteUser).toHaveBeenCalledWith(USER_ID);
  });

  it('should return 403 when trying to access a protected route without a token', async () => {
    module.get<AuthGuard>(AuthGuard).canActivate = () => false;
    const res = await request(app.getHttpServer()).get('/users').expect(403);

    expect(res.body.message).toEqual('Forbidden resource');
  });
});
