import { create } from 'zustand';
import { apiService } from 'src/services/api.service';

interface BlockStore {
  blockedUsers: Set<number>;
  blockedByUsers: Set<number>;

  init: (userId: number) => Promise<void>;
  blockUser: (userId: number) => Promise<void>;
  unblockUser: (userId: number) => Promise<void>;
  isBlocked: (userId: number) => boolean;
  isBlockedBy: (userId: number) => boolean;
  isEitherBlocked: (userId: number) => boolean;
  addBlockedUser: (userId: number) => void;
  removeBlockedUser: (userId: number) => void;
}

export const useBlockStore = create<BlockStore>((set, get) => ({
  blockedUsers: new Set(),
  blockedByUsers: new Set(),

  init: async (userId: number) => {
    try {
      const result = await apiService.getBlockedUsers();
      if (result && Array.isArray(result)) {
        const blockedIds = result.map((user: any) => user.id);
        set({ blockedUsers: new Set(blockedIds) });
      }
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    }
  },

  blockUser: async (userId: number) => {
    try {
      const result = await apiService.blockUser(userId);
      if (result && (result as any).success) {
        get().addBlockedUser(userId);
      }
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  },

  unblockUser: async (userId: number) => {
    try {
      const result = await apiService.unblockUser(userId);
      if (result && (result as any).success) {
        get().removeBlockedUser(userId);
      }
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  },

  isBlocked: (userId: number) => {
    return get().blockedUsers.has(userId);
  },

  isBlockedBy: (userId: number) => {
    return get().blockedByUsers.has(userId);
  },

  isEitherBlocked: (userId: number) => {
    return get().isBlocked(userId) || get().isBlockedBy(userId);
  },

  addBlockedUser: (userId: number) => {
    set((state) => ({
      blockedUsers: new Set([...state.blockedUsers, userId]),
    }));
  },

  removeBlockedUser: (userId: number) => {
    set((state) => {
      const newSet = new Set(state.blockedUsers);
      newSet.delete(userId);
      return { blockedUsers: newSet };
    });
  },
}));
