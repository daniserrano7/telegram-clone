import { exec } from 'child_process';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, it, afterAll, expect } from 'vitest';
import request from 'supertest';
import { io } from 'socket.io-client';
import { type User } from '@shared/user.dto';
import { DbService } from 'src/db/db.service';
import { DbModule } from 'src/db/db.module';
import { AuthModule } from 'src/auth/auth.module';
import { ChatModule } from 'src/chat/chat.module';
import { UserModule } from 'src/user/user.module';

describe('User tests (e2e)', () => {
  let app: INestApplication;
  let dbService: DbService;

  beforeAll(() => {
    exec('pnpm exec prisma db push --force-reset');
  });

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [DbModule, AuthModule, ChatModule, UserModule],
      providers: [ConfigService],
    }).compile();

    app = moduleFixture.createNestApplication();
    dbService = moduleFixture.get<DbService>(DbService);

    const databaseUrl = moduleFixture
      .get<ConfigService>(ConfigService)
      .get('DATABASE_URL') as string;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    if (!databaseUrl.includes('test')) {
      throw new Error(
        `DATABASE_URL should point to the test database: ${databaseUrl}`,
      );
    }

    await app.init();

    // Limpiar la base de datos antes de cada test
    await dbService.$queryRaw`TRUNCATE TABLE "Chat", "User", "Message" CASCADE`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('register and login users, create a chat and send a message', async () => {
    // Register first user
    const email1 = 'user1@example.com';
    const username1 = 'user1';
    const password1 = 'password123';

    const registerResult1 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: email1,
        username: username1,
        password: password1,
      })
      .expect(201);

    const registerUser1: User = registerResult1.body.user;

    expect(registerResult1.body).toHaveProperty('token');
    expect(registerUser1.id).toBeDefined();
    expect(registerUser1.email).toEqual(email1);
    expect(registerUser1.username).toEqual(username1);
    expect(registerUser1.createdAt).toBeDefined();
    expect(registerUser1.updatedAt).toBeDefined();
    expect(registerUser1.deletedAt).toBeNull();

    const loginResult1 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: email1,
        password: password1,
      })
      .expect(200);

    const loginUser1: User = loginResult1.body.user;

    expect(loginResult1.body).toHaveProperty('token');
    expect(loginUser1.id).toBeDefined();
    expect(loginUser1.email).toEqual(email1);
    expect(loginUser1.username).toEqual(username1);
    expect(loginUser1.createdAt).toBeDefined();
    expect(loginUser1.updatedAt).toBeDefined();
    expect(loginUser1.deletedAt).toBeNull();

    // Register second user
    const email2 = 'user2@example.com';
    const username2 = 'user2';
    const password2 = 'password123';

    const registerResult2 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: email2,
        username: username2,
        password: password2,
      })
      .expect(201);

    const registerUser2: User = registerResult2.body.user;

    expect(registerResult2.body).toHaveProperty('token');
    expect(registerUser2.id).toBeDefined();
    expect(registerUser2.email).toEqual(email2);
    expect(registerUser2.username).toEqual(username2);
    expect(registerUser2.createdAt).toBeDefined();
    expect(registerUser2.updatedAt).toBeDefined();
    expect(registerUser2.deletedAt).toBeNull();

    const loginResult2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: email2,
        password: password2,
      })
      .expect(200);

    const loginUser2: User = loginResult2.body.user;

    expect(loginResult2.body).toHaveProperty('token');
    expect(loginUser2.id).toBeDefined();
    expect(loginUser2.email).toEqual(email2);
    expect(loginUser2.username).toEqual(username2);
    expect(loginUser2.createdAt).toBeDefined();
    expect(loginUser2.updatedAt).toBeDefined();
    expect(loginUser2.deletedAt).toBeNull();

    // Chat between users should not exist
    const user1ChatsEmptyResult = await request(app.getHttpServer())
      .get(`/chats/user/${loginUser1.id}`)
      .set('Authorization', `Bearer ${loginResult1.body.token}`)
      .expect(404);

    expect(user1ChatsEmptyResult.body).toHaveLength(0);

    const user2ChatsEmptyResult = await request(app.getHttpServer())
      .get(`/chats/user/${loginUser2.id}`)
      .set('Authorization', `Bearer ${loginResult2.body.token}`)
      .expect(404);

    expect(user2ChatsEmptyResult.body).toHaveLength(0);
    expect(user1ChatsEmptyResult.body).toEqual(user2ChatsEmptyResult.body);

    // Create WebSocket client connection
    const socketClient = io('http://localhost:5000', {
      auth: { token: loginResult1.body.token },
    });
    const userId = loginUser1.id;

    await new Promise<void>((resolve) => {
      socketClient.on('connect', () => resolve());
    });

    socketClient.on('connect_error', (error) => {
      throw error;
    });

    socketClient.emit('joinUser', { userId }, ({ message }) =>
      expect(message).toEqual(`Joined user ${userId}`),
    );

    // Create chat between users
    const createChatResult = await request(app.getHttpServer())
      .post('/chats')
      .send({
        userIds: [loginUser1.id, loginUser2.id],
      })
      .set('Authorization', `Bearer ${loginResult1.body.token}`)
      .expect(201);

    // Chat between users should still not exist because there are no messages
    const user1ChatsStillEmptyResult = await request(app.getHttpServer())
      .get(`/chats/user/${loginUser1.id}`)
      .set('Authorization', `Bearer ${loginResult1.body.token}`)
      .expect(404);

    expect(user1ChatsStillEmptyResult.body).toHaveLength(0);

    const user2ChatsStillEmptyResult = await request(app.getHttpServer())
      .get(`/chats/user/${loginUser2.id}`)
      .set('Authorization', `Bearer ${loginResult2.body.token}`)
      .expect(404);

    expect(user2ChatsStillEmptyResult.body).toHaveLength(0);
    expect(user1ChatsStillEmptyResult.body).toEqual(
      user2ChatsStillEmptyResult.body,
    );

    // Send message to chat
    const chatId = createChatResult.body.id;
    const messageContent = 'Hello, world!';

    socketClient.emit('joinChat', { chatId }, ({ message }) =>
      expect(message).toEqual(`Joined chat ${chatId}`),
    );

    const listenMessagePromise = new Promise<void>((resolve, reject) => {
      socketClient.on('message', (message) => {
        try {
          expect(message).toHaveProperty('id');
          expect(message).toHaveProperty('content');
          expect(message).toHaveProperty('createdAt');
          expect(message).toHaveProperty('deletedAt');
          expect(message.content).toEqual(messageContent);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      socketClient.emit(
        'sendMessage',
        { chatId, content: messageContent },
        ({ status }) => {
          try {
            expect(status).toEqual('success');

            resolve();
          } catch (error) {
            console.error(error);
            reject(error);
          }
        },
      );
    });

    await listenMessagePromise;

    // Chat between users should now exist
    const user1GetChatsResult = await request(app.getHttpServer())
      .get(`/chats/user/${userId}`)
      .set('Authorization', `Bearer ${loginResult1.body.token}`)
      .expect(200);

    expect(user1GetChatsResult.body).toHaveLength(1);
    expect(user1GetChatsResult.body[0]).toHaveProperty('id');
    expect(user1GetChatsResult.body[0]).toHaveProperty('members');
    expect(user1GetChatsResult.body[0]).toHaveProperty('messages');
    expect(user1GetChatsResult.body[0].members).toHaveLength(2);
    expect(user1GetChatsResult.body[0].members).toContainEqual(loginUser1);
    expect(user1GetChatsResult.body[0].members).toContainEqual(loginUser2);
    expect(user1GetChatsResult.body[0].messages).toHaveLength(1);
    expect(user1GetChatsResult.body[0].messages[0].content).toEqual(
      messageContent,
    );

    const user2GetChatsResult = await request(app.getHttpServer())
      .get(`/chats/user/${loginUser2.id}`)
      .set('Authorization', `Bearer ${loginResult2.body.token}`)
      .expect(200);

    expect(user2GetChatsResult.body).toHaveLength(1);
    expect(user2GetChatsResult.body[0]).toHaveProperty('id');
    expect(user2GetChatsResult.body[0]).toHaveProperty('members');
    expect(user2GetChatsResult.body[0]).toHaveProperty('messages');
    expect(user2GetChatsResult.body[0].members).toHaveLength(2);
    expect(user2GetChatsResult.body[0].members).toContainEqual(loginUser1);
    expect(user2GetChatsResult.body[0].members).toContainEqual(loginUser2);
    expect(user2GetChatsResult.body[0].messages).toHaveLength(1);
    expect(user2GetChatsResult.body[0].messages[0].content).toEqual(
      messageContent,
    );

    socketClient.disconnect();
  }, 30000);
});
