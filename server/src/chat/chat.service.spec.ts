import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { ChatService } from './chat.service';
import { CreateChatRequestDto, CreateChatResponseDto } from '@shared/chat.dto';
import { BlockService } from 'src/user/block.service';

const USER_ID = 1;
const CHAT_ID = 1;

describe('ChatService', () => {
  let service: ChatService;
  let dbService: DbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        DbService,
        JwtService,
        {
          provide: BlockService,
          useValue: {
            isEitherBlocked: vi.fn().mockResolvedValue(false),
          },
        },
      ],
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
      type: 'DIRECT',
      name: null,
      description: null,
      avatarUrl: null,
      createdBy: null,
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
      memberships: [
        { id: 1, userId: USER_ID, role: 'MEMBER', addedBy: null, addedAt: createdAt },
        { id: 2, userId: 2, role: 'MEMBER', addedBy: null, addedAt: createdAt },
      ],
      messages: [],
      createdAt,
    };

    vi.spyOn(dbService.chat, 'findFirst').mockResolvedValue(null);
    vi.spyOn(dbService.chat, 'create').mockResolvedValue({
      id: 1,
      type: 'DIRECT',
      name: null,
      description: null,
      avatarUrl: null,
      createdBy: null,
      createdAt,
      updatedAt,
      deletedAt,
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
      memberships: [
        { id: 1, chatId: 1, userId: USER_ID, role: 'MEMBER', addedBy: null, addedAt: createdAt },
        { id: 2, chatId: 1, userId: 2, role: 'MEMBER', addedBy: null, addedAt: createdAt },
      ],
      messages: [],
    } as Prisma.ChatGetPayload<{
      include: { members: true; memberships: true; messages: true };
    }>);

    const chat = await service.createChat(createChatDto.userIds);
    expect(chat.id).toEqual(mockChat.id);
    expect(chat.type).toEqual('DIRECT');
  });

  it('throws an error if chat already exists', async () => {
    const createChatDto: CreateChatRequestDto = {
      userIds: [USER_ID, 2],
      content: 'Hello',
    };

    vi.spyOn(dbService.chat, 'findFirst').mockResolvedValue({
      id: 1,
      type: 'DIRECT',
      name: null,
      description: null,
      avatarUrl: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await expect(
      service.createChat(createChatDto.userIds),
    ).rejects.toThrowError('Chat already exists');
  });

  it('should get a chat', async () => {
    const chat = {
      id: CHAT_ID,
      type: 'DIRECT',
      name: null,
      description: null,
      avatarUrl: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      members: [
        {
          id: USER_ID,
          username: 'username1',
          bio: null,
          avatarUrl: null,
          onlineStatus: 'ONLINE',
          lastConnection: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 2,
          username: 'username2',
          bio: null,
          avatarUrl: null,
          onlineStatus: 'ONLINE',
          lastConnection: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ],
      memberships: [],
      messages: [],
    };

    vi.spyOn(dbService.chat, 'findUnique').mockResolvedValue(chat as any);

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
    const chats = [
      {
        id: 1,
        type: 'DIRECT',
        name: null,
        description: null,
        avatarUrl: null,
        createdBy: null,
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
            lastConnection: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
        memberships: [],
        messages: [],
      },
      {
        id: 2,
        type: 'DIRECT',
        name: null,
        description: null,
        avatarUrl: null,
        createdBy: null,
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
            lastConnection: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
        memberships: [],
        messages: [],
      },
    ];

    vi.spyOn(dbService.chat, 'findMany').mockResolvedValue(chats as any);

    const response = await service.getUserChats(USER_ID);
    expect(response).toEqual(chats);
  });
});
