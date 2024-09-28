import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { ChatService } from './chat.service';
import { CreateChatDto, CreateChatResponseDto } from './chat.dto';

const USER_ID = 1;

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
    const createChatDto: CreateChatDto = {
      memberIds: [USER_ID, 2],
    };

    const createdAt = new Date();
    const mockChat: CreateChatResponseDto = {
      id: 1,
      memberIds: [USER_ID, 2],
      createdAt,
    };

    vi.spyOn(dbService.chat, 'findMany').mockResolvedValue([]);
    vi.spyOn(dbService.chat, 'create').mockResolvedValue({
      id: 1,
      createdAt,
      members: [{ id: USER_ID }, { id: 2 }],
    } as Prisma.ChatGetPayload<{
      include: { members: true };
    }>);

    const chat = await service.createChat(createChatDto.memberIds);
    expect(chat).toEqual(mockChat);
  });

  it('throws an error if chat already exists', async () => {
    const createChatDto: CreateChatDto = {
      memberIds: [USER_ID, 2],
    };

    vi.spyOn(dbService.chat, 'findMany').mockResolvedValue([
      { id: 1, createdAt: new Date() },
    ]);

    await expect(
      service.createChat(createChatDto.memberIds),
    ).rejects.toThrowError('Chat already exists');
  });
});
