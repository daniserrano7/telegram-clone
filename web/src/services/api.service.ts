import {
  SwapDatesWithStrings,
  RegisterRequestDto,
  RegisterResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  ErrorResponseDto,
} from '@shared/auth.dto';
import { GetUserResponseDto } from '@shared/user.dto';
import { GetChatResponseDto, CreateChatRequestDto } from '@shared/chat.dto';
import axios from 'axios';

type ServiceResponse<T> = Promise<
  { status: 'success'; data: T } | { status: 'error'; errorMsg: string }
>;

export class ApiService {
  private readonly BASE_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  async register({
    email,
    username,
    password,
  }: RegisterRequestDto): ServiceResponse<RegisterResponseDto> {
    try {
      const res = await fetch(`${this.BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      });

      if (res.status !== 201) {
        const data = (await res.json()) as ErrorResponseDto;
        return { status: 'error', errorMsg: data.error };
      }

      const { user, token } =
        (await res.json()) as SwapDatesWithStrings<LoginResponseDto>;

      const parsedUser = parseUser(user);

      this.setToken(token);
      return { status: 'success', data: { token, user: parsedUser } };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', errorMsg };
    }
  }

  async login({
    username,
    password,
  }: LoginRequestDto): ServiceResponse<LoginResponseDto> {
    try {
      const res = await fetch(`${this.BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (res.status !== 200) {
        const data = (await res.json()) as ErrorResponseDto;
        return { status: 'error', errorMsg: data.error };
      }

      const { user, token } =
        (await res.json()) as SwapDatesWithStrings<LoginResponseDto>;

      const parsedUser = parseUser(user);

      this.setToken(token);
      return { status: 'success', data: { token, user: parsedUser } };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', errorMsg };
    }
  }

  async getUser(userId: number): ServiceResponse<GetUserResponseDto> {
    const res = await fetch(`${this.BASE_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    const user: SwapDatesWithStrings<GetUserResponseDto> = await res.json();
    const parsedUser = parseUser(user);

    if (res.status === 200) {
      return { status: 'success', data: parsedUser };
    }

    return { status: 'error', errorMsg: 'Failed to fetch user' };
  }

  async searchUsers(search: string): ServiceResponse<GetUserResponseDto[]> {
    try {
      const res = await fetch(`${this.BASE_URL}/users/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ search }),
      });

      if (res.status !== 200) {
        const data = (await res.json()) as ErrorResponseDto;
        return { status: 'error', errorMsg: data.error };
      }

      const users: SwapDatesWithStrings<GetUserResponseDto>[] =
        await res.json();
      const parsedUsers = users.map(parseUser);

      return { status: 'success', data: parsedUsers };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', errorMsg };
    }
  }

  async createChat({
    userIds,
    content,
  }: CreateChatRequestDto): ServiceResponse<GetChatResponseDto> {
    try {
      const res = await fetch(`${this.BASE_URL}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ userIds, content }),
      });

      if (res.status !== 201) {
        const data = (await res.json()) as ErrorResponseDto;
        return { status: 'error', errorMsg: data.error };
      }

      const chat: SwapDatesWithStrings<GetChatResponseDto> = await res.json();
      const parsedChat = parseChat(chat);

      return { status: 'success', data: parsedChat };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', errorMsg };
    }
  }

  async getChats(userId: number): ServiceResponse<GetChatResponseDto[]> {
    try {
      const res = await fetch(`${this.BASE_URL}/chats/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (res.status !== 200) {
        const data = (await res.json()) as ErrorResponseDto;
        return { status: 'error', errorMsg: data.error };
      }

      const chats: SwapDatesWithStrings<GetChatResponseDto>[] =
        await res.json();

      const parsedChats = chats.map(parseChat);

      return { status: 'success', data: parsedChats };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', errorMsg };
    }
  }

  async getChat(chatId: number): ServiceResponse<GetChatResponseDto> {
    try {
      const res = await fetch(`${this.BASE_URL}/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (res.status !== 200) {
        const data = (await res.json()) as ErrorResponseDto;
        return { status: 'error', errorMsg: data.error };
      }

      const chat: SwapDatesWithStrings<GetChatResponseDto> = await res.json();
      const parsedChat = parseChat(chat);

      return { status: 'success', data: parsedChat };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', errorMsg };
    }
  }

  async getContacts(userId: number): ServiceResponse<GetUserResponseDto[]> {
    try {
      const res = await fetch(`${this.BASE_URL}/users/contacts/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (res.status !== 200) {
        const data = (await res.json()) as ErrorResponseDto;
        return { status: 'error', errorMsg: data.error };
      }

      const contacts: SwapDatesWithStrings<GetUserResponseDto>[] =
        await res.json();
      const parsedContacts = contacts.map(parseUser);

      return { status: 'success', data: parsedContacts };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', errorMsg };
    }
  }

  async updateUserBio(userId: number, bio: string) {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/users/${userId}/bio`,
        { bio },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );
      return { status: 'success', data: response.data };
    } catch (error) {
      console.error('Failed to update bio:', error);
      return { status: 'error', error };
    }
  }

  async updateUserAvatar(userId: number, file: File) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post(
        `${this.BASE_URL}/users/${userId}/avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return { status: 'success', data: response.data };
    } catch (error) {
      console.error('Failed to update avatar:', error);
      return { status: 'error', error };
    }
  }
}

export const apiService = new ApiService();

const parseUser = (user: SwapDatesWithStrings<GetUserResponseDto>) => ({
  ...user,
  lastConnection: new Date(user.lastConnection),
  createdAt: new Date(user.createdAt),
  updatedAt: new Date(user.updatedAt),
  deletedAt: user.deletedAt ? new Date(user.deletedAt) : null,
});

const parseChat = (
  chat: SwapDatesWithStrings<GetChatResponseDto>
): GetChatResponseDto => ({
  ...chat,
  createdAt: new Date(chat.createdAt),
  updatedAt: new Date(chat.updatedAt),
  deletedAt: chat.deletedAt ? new Date(chat.deletedAt) : null,
  members: chat.members.map(parseUser),
  messages: chat.messages.map((message) => ({
    ...message,
    createdAt: new Date(message.createdAt),
    deletedAt: message.deletedAt ? new Date(message.deletedAt) : null,
  })),
});
