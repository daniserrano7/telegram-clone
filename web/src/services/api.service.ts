import {
  SwapDatesWithStrings,
  RegisterRequestDto,
  RegisterResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  ErrorResponseDto,
} from '@shared/auth.dto';
import { GetUserResponseDto } from '@shared/user.dto';
import {
  GetChatResponseDto,
  CreateChatRequestDto,
  CreateGroupRequestDto,
  UpdateGroupRequestDto,
  AddMembersRequestDto,
} from '@shared/chat.dto';
import { ChatMemberRole } from '@shared/gateway.dto';
import axios from 'axios';

type ServiceResponse<T> = Promise<
  { status: 'success'; data: T } | { status: 'error'; errorMsg: string }
>;

export class ApiService {
  private readonly BASE_URL = import.meta.env.VITE_API_URL;
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  async register({
    username,
    password,
    confirmPassword,
  }: RegisterRequestDto): ServiceResponse<RegisterResponseDto> {
    try {
      const res = await fetch(`${this.BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, confirmPassword }),
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
    console.log('API_URL', import.meta.env.VITE_API_URL);
    console.log('NODE_ENV', import.meta.env.VITE_NODE_ENV);
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

  async blockUser(userId: number) {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/users/${userId}/block`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  async unblockUser(userId: number) {
    try {
      const response = await axios.delete(
        `${this.BASE_URL}/users/${userId}/block`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }

  async getBlockedUsers() {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/users/blocked`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get blocked users:', error);
      return [];
    }
  }

  async getBlockStatus(userId: number) {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/users/${userId}/block-status`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get block status:', error);
      return { isBlockedByMe: false, hasBlockedMe: false };
    }
  }

  // ==================== GROUP METHODS ====================

  async createGroup(data: CreateGroupRequestDto): ServiceResponse<GetChatResponseDto> {
    try {
      const res = await fetch(`${this.BASE_URL}/chats/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(data),
      });

      if (res.status !== 201) {
        const errorData = (await res.json()) as ErrorResponseDto;
        return { status: 'error', errorMsg: errorData.error || 'Failed to create group' };
      }

      const chat: SwapDatesWithStrings<GetChatResponseDto> = await res.json();
      return { status: 'success', data: parseChat(chat) };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', errorMsg };
    }
  }

  async updateGroupAvatar(chatId: number, file: File) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post(
        `${this.BASE_URL}/chats/groups/${chatId}/avatar`,
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
      console.error('Failed to update group avatar:', error);
      console.error('Error details:', error.response?.data || error.message);
      return { status: 'error', error };
    }
  }

  async updateGroup(chatId: number, updates: UpdateGroupRequestDto): ServiceResponse<GetChatResponseDto> {
    try {
      const res = await fetch(`${this.BASE_URL}/chats/groups/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(updates),
      });

      if (res.status !== 200) {
        const errorData = (await res.json()) as ErrorResponseDto;
        return { status: 'error', errorMsg: errorData.error || 'Failed to update group' };
      }

      const chat: SwapDatesWithStrings<GetChatResponseDto> = await res.json();
      return { status: 'success', data: parseChat(chat) };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', errorMsg };
    }
  }

  async addGroupMembers(chatId: number, userIds: number[]): ServiceResponse<GetChatResponseDto> {
    try {
      const res = await fetch(`${this.BASE_URL}/chats/groups/${chatId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ userIds } as AddMembersRequestDto),
      });

      if (res.status !== 200) {
        const errorData = (await res.json()) as ErrorResponseDto;
        return { status: 'error', errorMsg: errorData.error || 'Failed to add members' };
      }

      const chat: SwapDatesWithStrings<GetChatResponseDto> = await res.json();
      return { status: 'success', data: parseChat(chat) };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', errorMsg };
    }
  }

  async removeGroupMember(chatId: number, userId: number): ServiceResponse<GetChatResponseDto> {
    try {
      const res = await fetch(`${this.BASE_URL}/chats/groups/${chatId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (res.status !== 200) {
        const errorData = (await res.json()) as ErrorResponseDto;
        return { status: 'error', errorMsg: errorData.error || 'Failed to remove member' };
      }

      const chat: SwapDatesWithStrings<GetChatResponseDto> = await res.json();
      return { status: 'success', data: parseChat(chat) };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', errorMsg };
    }
  }

  async leaveGroup(chatId: number): ServiceResponse<void> {
    try {
      const res = await fetch(`${this.BASE_URL}/chats/groups/${chatId}/leave`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (res.status !== 204) {
        const errorData = (await res.json()) as ErrorResponseDto;
        return { status: 'error', errorMsg: errorData.error || 'Failed to leave group' };
      }

      return { status: 'success', data: undefined };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', errorMsg };
    }
  }

  async updateMemberRole(chatId: number, userId: number, role: ChatMemberRole): ServiceResponse<GetChatResponseDto> {
    try {
      const res = await fetch(`${this.BASE_URL}/chats/groups/${chatId}/members/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ role }),
      });

      if (res.status !== 200) {
        const errorData = (await res.json()) as ErrorResponseDto;
        return { status: 'error', errorMsg: errorData.error || 'Failed to update role' };
      }

      const chat: SwapDatesWithStrings<GetChatResponseDto> = await res.json();
      return { status: 'success', data: parseChat(chat) };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', errorMsg };
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
  memberships: (chat.memberships || []).map((membership) => ({
    ...membership,
    addedAt: new Date(membership.addedAt),
  })),
  messages: chat.messages.map((message) => ({
    ...message,
    createdAt: new Date(message.createdAt),
    deletedAt: message.deletedAt ? new Date(message.deletedAt) : null,
  })),
});
