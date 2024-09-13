import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const sendMessage = async (
  conversationId: number,
  senderId: number,
  content: string
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { members: true },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const isMember = conversation.members.some(
    (member) => member.id === senderId
  );

  if (!isMember) {
    throw new Error('User not part of the conversation');
  }

  // Crear y guardar el nuevo mensaje
  const newMessage = await prisma.message.create({
    data: {
      content: content,
      conversation: { connect: { id: conversationId } },
      sender: { connect: { id: senderId } },
    },
    include: {
      sender: true,
      conversation: true,
    },
  });

  return newMessage;
};

const getMessages = async (conversationId: number) => {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: { sender: true },
  });

  return messages;
};

export const messageService = {
  sendMessage,
  getMessages,
};
