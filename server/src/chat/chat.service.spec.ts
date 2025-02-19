import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { ChatService } from './chat.service';
import { CreateChatRequestDto, CreateChatResponseDto } from '@shared/chat.dto';

const USER_ID = 1;
const CHAT_ID = 1;

describe('ChatService', () => {
  let service: ChatService;
  let dbService: DbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService, DbService, JwtService],
    }).compile();

    dbService = module.get<DbService>(DbService);
    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a chat', async () => {
    const createChatDto: CreateChatRequestDto = {
      userIds: [USER_ID, 2],
      content: 'Hello',
    };

    const lastConnection = new Date();
    const createdAt = new Date();
    const updatedAt = new Date();
    const deletedAt = null;
    const mockChat: CreateChatResponseDto = {
      id: 1,
      members: [
        {
          id: USER_ID,
          username: 'username1',
          onlineStatus: 'ONLINE',
          bio: 'bio',
          avatarUrl: 'avatarUrl',

          lastConnection,
          createdAt,
          updatedAt,
          deletedAt,
        },
        {
          id: 2,
          username: 'username2',
          onlineStatus: 'ONLINE',
          bio: 'bio',
          avatarUrl: 'avatarUrl',
          lastConnection,
          createdAt,
          updatedAt,
          deletedAt,
        },
      ],
      messages: [],
      createdAt,
    };

    vi.spyOn(dbService.chat, 'findMany').mockResolvedValue([]);
    vi.spyOn(dbService.chat, 'create').mockResolvedValue({
      id: 1,
      createdAt,
      members: [
        {
          id: USER_ID,
          username: 'username1',
          onlineStatus: 'ONLINE',
          lastConnection,
          createdAt,
          updatedAt,
          deletedAt,
        },
        {
          id: 2,
          username: 'username2',
          onlineStatus: 'ONLINE',
          lastConnection,
          createdAt,
          updatedAt,
          deletedAt,
        },
      ],
      messages: [],
    } as Prisma.ChatGetPayload<{
      include: { members: true; messages: true };
    }>);

    const chat = await service.createChat(createChatDto.userIds);
    expect(chat).toEqual(mockChat);
  });

  it('throws an error if chat already exists', async () => {
    const createChatDto: CreateChatRequestDto = {
      userIds: [USER_ID, 2],
      content: 'Hello',
    };

    vi.spyOn(dbService.chat, 'findMany').mockResolvedValue([
      { id: 1, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    ]);

    await expect(
      service.createChat(createChatDto.userIds),
    ).rejects.toThrowError('Chat already exists');
  });

  it('should get a chat', async () => {
    const chat: Prisma.ChatGetPayload<{
      include: {
        members: {
          select: {
            id: true;
            username: true;
            createdAt: true;
            updatedAt: true;
            deletedAt: true;
          };
        };
      };
    }> = {
      id: CHAT_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      members: [
        {
          id: USER_ID,
          username: 'username1',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 2,
          username: 'username2',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ],
    };

    vi.spyOn(dbService.chat, 'findUnique').mockResolvedValue(chat);

    const response = await service.getChat(CHAT_ID);
    expect(response).toEqual(chat);
  });

  it('should throw an error if chat does not exist', async () => {
    const chatId = CHAT_ID;

    vi.spyOn(dbService.chat, 'findUnique').mockResolvedValue(null);

    await expect(service.getChat(chatId)).rejects.toThrowError(
      'Chat not found',
    );
  });

  it("should get all user's chats", async () => {
    const chats: Prisma.ChatGetPayload<{
      include: { members: true };
    }>[] = [
      {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        members: [
          {
            id: USER_ID,
            username: 'username1',
            onlineStatus: 'ONLINE',
            bio: 'bio',
            avatarUrl: 'avatarUrl',
            password: 'password',
            lastConnection: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
          {
            id: 2,
            username: 'username2',
            onlineStatus: 'ONLINE',
            bio: 'bio',
            avatarUrl: 'avatarUrl',
            password: 'password',
            lastConnection: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
      },
      {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        members: [
          {
            id: USER_ID,
            username: 'username1',
            bio: 'bio',
            avatarUrl: 'avatarUrl',
            onlineStatus: 'ONLINE',
            password: 'password',
            lastConnection: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
          {
            id: 3,
            username: 'username3',
            onlineStatus: 'ONLINE',
            bio: 'bio',
            avatarUrl: 'avatarUrl',
            password: 'password',
            lastConnection: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
      },
    ];

    vi.spyOn(dbService.chat, 'findMany').mockResolvedValue(chats);

    const response = await service.getUserChats(USER_ID);
    expect(response).toEqual(chats);
  });
});
