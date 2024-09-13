import { prisma } from '../../prisma/db';

const createConversation = async (memberIds) => {
  const conversation = await prisma.conversation.create({
    data: {
      members: {
        connect: memberIds.map((id) => ({ id })),
      },
    },
    include: {
      members: true,
    },
  });
  return conversation;
};

const getConversation = async (conversationId) => {
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
    include: {
      members: true,
      messages: true,
    },
  });
  return conversation;
};

const getUserConversations = async (userId) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: {
          id: userId,
        },
      },
    },
    include: {
      members: true,
      messages: true,
    },
  });
  return conversations;
};

export const conversationService = {
  createConversation,
  getConversation,
  getUserConversations,
};
