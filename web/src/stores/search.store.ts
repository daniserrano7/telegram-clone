import { create } from 'zustand';
import { type Message } from '@shared/chat.dto';

interface SearchState {
  searchQuery: string;
  searchResults: Message[];
  isSearching: boolean;
  currentMatchIndex: number;
  totalMatches: number;
  setSearchQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  clearSearch: () => void;
  setTotalMatches: (total: number) => void;
  nextMatch: () => void;
  previousMatch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  currentMatchIndex: 0,
  totalMatches: 0,
  setSearchQuery: (query: string) =>
    set({ searchQuery: query, currentMatchIndex: 0, totalMatches: 0 }),
  setIsSearching: (isSearching: boolean) => set({ isSearching }),
  clearSearch: () =>
    set({
      searchQuery: '',
      isSearching: false,
      currentMatchIndex: 0,
      totalMatches: 0,
    }),
  setTotalMatches: (total: number) => set({ totalMatches: total }),
  nextMatch: () =>
    set((state) => ({
      currentMatchIndex:
        (state.currentMatchIndex + 1) % Math.max(1, state.totalMatches),
    })),
  previousMatch: () =>
    set((state) => ({
      currentMatchIndex:
        state.currentMatchIndex === 0
          ? Math.max(0, state.totalMatches - 1)
          : state.currentMatchIndex - 1,
    })),
}));
