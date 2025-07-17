import { useState, useRef, useEffect } from 'react';
import cx from 'classix';
import { type UserId } from '@shared/user.dto';
import { useRecentSearches } from 'src/hooks/useLocalStorageService';
import { Avatar } from 'src/components/avatar';
import {
  HiOutlineXMark,
  HiOutlineBars3,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { apiService } from 'src/services/api.service';
import { useChatStore } from 'src/stores/chat.store';
import { useAuthStore } from 'src/stores/auth.store';
import { SettingsPanel } from 'src/components/settings-panel';
import { ProfileDialog } from 'src/components/profile-dialog';
import { useUserStore } from 'src/stores/user.store';
import { ThemeSettingsDialog } from './theme-settings-dialog';

type ChatPreview = {
  id: UserId;
  name: string;
  description: string;
  avatarUrl: string | null;
};

type SearchUser = {
  id: number;
  username: string;
  avatarUrl: string | null;
  lastSearched: Date;
};

export const Sidebar = ({ onChatSelect }: { onChatSelect?: () => void }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<'profile' | 'settings' | null>(
    null
  );
  const [isSearchFocus, setIsSearchFocus] = useState(false);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUsers, setFoundUsers] = useState<ChatPreview[]>([]);
  const [recentSearches, setRecentSearches] = useRecentSearches();
  const [focusedUserIndex, setFocusedUserIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userListRef = useRef<HTMLDivElement>(null);
  const openChatWithUser = useChatStore((state) => state.openChatWithUser);
  const user = useAuthStore((state) => state.user);

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset focused user when search changes
  useEffect(() => {
    setFocusedUserIndex(-1);
  }, [search]);

  // Get the currently active list of users (either search results or recent searches)
  const getActiveUserList = () => {
    if (search) {
      return foundUsers;
    } else {
      return recentSearches.map((user) => ({
        id: user.id,
        name: user.username,
        avatarUrl: user.avatarUrl,
        description: `Last searched ${new Date(
          user.lastSearched
        ).toLocaleDateString()}`,
      }));
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setIsSearching(true);
    apiService
      .searchUsers(e.target.value)
      .then((res) => {
        if (res.status === 'success') {
          setFoundUsers(
            res.data
              .filter((u) => u.id !== user?.id)
              .map((u) => ({
                id: u.id,
                name: u.username,
                description: '',
                avatarUrl: u.avatarUrl || null,
              }))
          );
        }
      })
      .catch((error) => {
        console.error('Failed to search users', error);
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  const handleUserSelect = (
    userId: number,
    username: string,
    avatarUrl: string | null
  ) => {
    const newRecent = [
      { id: userId, username, lastSearched: new Date(), avatarUrl },
      ...recentSearches.filter((u) => u.id !== userId),
    ].slice(0, 5);

    setRecentSearches(newRecent);
    setIsSearchFocus(false);
    setSearch('');
    openChatWithUser(userId);
    onChatSelect?.();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const activeUserList = getActiveUserList();
    const userCount = activeUserList.length;

    if (userCount === 0) return;

    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      setFocusedUserIndex(0);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedUserIndex(0);
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const activeUserList = getActiveUserList();
    const userCount = activeUserList.length;

    if (userCount === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedUserIndex((prev) => (prev + 1) % userCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedUserIndex((prev) => (prev - 1 + userCount) % userCount);
    } else if (e.key === 'Enter' && focusedUserIndex >= 0) {
      e.preventDefault();
      const selectedUser = activeUserList[focusedUserIndex];
      handleUserSelect(
        selectedUser.id,
        selectedUser.name,
        selectedUser.avatarUrl
      );
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setFocusedUserIndex(-1);
      searchInputRef.current?.focus();
    }
  };

  // Focus management
  useEffect(() => {
    if (focusedUserIndex >= 0 && userListRef.current) {
      // Focus the user list when a user is focused
      userListRef.current.focus();
    }
  }, [focusedUserIndex]);

  // Scroll the focused item into view
  useEffect(() => {
    if (focusedUserIndex >= 0 && userListRef.current) {
      const listItems = userListRef.current.querySelectorAll('[role="option"]');
      if (listItems && listItems[focusedUserIndex]) {
        listItems[focusedUserIndex].scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [focusedUserIndex]);

  return (
    <div className="h-full flex flex-col border-r border-border">
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        openSection={setOpenSection}
      />
      {openSection === 'profile' ? (
        <ProfileDialog isOpen={true} onClose={() => setOpenSection(null)} />
      ) : openSection === 'settings' ? (
        <ThemeSettingsDialog
          isOpen={true}
          onClose={() => setOpenSection(null)}
        />
      ) : null}
      <div className="px-4 flex-shrink-0 h-[64px] flex gap-3 items-center border-b border-border">
        <button onClick={() => setIsSettingsOpen(true)}>
          {/* Search Bar */}
          <HiOutlineBars3 className="size-[24px] text-icon-subtle hover:text-icon" />
        </button>
        <form
          className="md:w-auto w-full py-3"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="relative w-full">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search"
              value={search}
              onChange={handleSearch}
              onFocus={() => setIsSearchFocus(true)}
              onBlur={() => {
                // Only blur if we're not focusing on the list
                if (focusedUserIndex === -1) {
                  setIsSearchFocus(false);
                }
              }}
              onKeyDown={handleSearchKeyDown}
              className={cx(
                'w-full rounded-full py-2 pl-4 pr-20 text-font placeholder-font-subtle focus:outline-none focus:ring-2 focus:ring-primary-light',
                isSearchFocus
                  ? 'bg-transparent'
                  : 'bg-input-background hover:bg-input-background-hover active:bg-input-background-active'
              )}
              aria-controls="search-results"
              aria-expanded={isSearchFocus}
              role="combobox"
              aria-autocomplete="list"
              aria-haspopup="listbox"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isSearchFocus && (
                <button
                  onMouseDown={() => {
                    setSearch('');
                    setIsSearchFocus(false);
                    setFocusedUserIndex(-1);
                  }}
                  className="hover:bg-elevation-hover rounded-full flex justify-center items-center p-[2px]"
                  aria-label="Clear search"
                >
                  <HiOutlineXMark className="size-4 text-icon-subtle" />
                </button>
              )}
              {!isSearchFocus && (
                <kbd className="hidden md:flex items-center gap-0.5 px-1.5 h-5 text-[10px] font-medium text-font-subtle bg-elevation rounded">
                  <span className="text-[10px]">
                    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                  </span>
                  <span>K</span>
                </kbd>
              )}
            </div>
          </div>
        </form>
      </div>
      {/* Search Results */}
      {isSearchFocus ? (
        <SearchList
          query={search}
          isSearching={isSearching}
          foundUsers={foundUsers}
          recentSearches={recentSearches}
          clearRecentSearches={() => setRecentSearches([])}
          onUserSelect={handleUserSelect}
          focusedUserIndex={focusedUserIndex}
          onKeyDown={handleListKeyDown}
          listRef={userListRef}
        />
      ) : (
        <ChatList
          onChatSelect={onChatSelect}
          triggerSearch={(username) => {
            setSearch(username);
            setIsSearchFocus(true);
            handleSearch({
              target: { value: username },
            } as React.ChangeEvent<HTMLInputElement>);
          }}
        />
      )}
    </div>
  );
};

const ChatListSkeleton = () => {
  return (
    <div className="flex-1 overflow-y-auto">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-elevation-hover animate-pulse" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-background-primary rounded-full bg-elevation-hover animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <div className="h-5 w-24 bg-elevation-hover rounded animate-pulse" />
              <div className="h-4 w-16 bg-elevation-hover rounded animate-pulse" />
            </div>
            <div className="h-4 w-3/4 bg-elevation-hover rounded mt-1 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

const ChatList = ({
  onChatSelect,
  triggerSearch,
}: {
  onChatSelect?: () => void;
  triggerSearch: (search: string) => void;
}) => {
  const chats = useChatStore((state) => state.chats);
  const isLoading = useChatStore((state) => state.isLoading);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const activeChat = useChatStore((state) => state.activeChat);
  const findPartner = useChatStore((state) => state.getChatPartner);
  const contacts = useUserStore((state) => state.contacts);

  if (isLoading) {
    return <ChatListSkeleton />;
  }

  const formatLastMessage = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date.toDateString() === today.toDateString()
      ? `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : date.toLocaleDateString();
  };

  const getLastMessageTime = (chat: (typeof chats)[0]): Date => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    return lastMessage ? new Date(lastMessage.createdAt) : new Date(0);
  };

  // Sort chats by most recent message
  const sortedChats = [...chats].sort((a, b) => {
    const timeA = getLastMessageTime(a).getTime();
    const timeB = getLastMessageTime(b).getTime();
    return timeB - timeA;
  });

  if (sortedChats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-elevation rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-font-subtle"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-font mb-2">No chats yet</h3>
        <p className="text-font-subtle text-sm max-w-[240px]">
          Use the search bar above to find people and start a new conversation
        </p>
        <span className="text-font-subtle text-sm my-2">- o -</span>
        <p className="text-font-subtle text-sm max-w-[240px]">
          You can start chatting with me!
        </p>
        <button
          onClick={() => triggerSearch('daniel.serrano')}
          className="text-font-primary text-sm rounded-md mt-1 px-2 py-1 bg-elevation hover:bg-elevation-hover active:bg-elevation-active transition-colors"
        >
          daniel.serrano
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {sortedChats.map((chat) => {
        const partner = findPartner(chat);
        if (!partner) return null;

        const contact = contacts[partner.id];
        const status = contact?.onlineStatus;
        const isOnline = status === 'ONLINE';

        return (
          <div
            key={chat.id}
            onClick={() => {
              setActiveChat(chat);
              onChatSelect?.();
            }}
            className={`p-4 flex items-center space-x-3 cursor-pointer ${
              activeChat?.id === chat.id
                ? 'bg-primary text-font-primary-contrast'
                : 'text-font hover:bg-elevation-hover'
            }`}
          >
            <div className="relative">
              <Avatar
                username={partner.username}
                src={partner.avatarUrl}
                size={48}
              />
              <div
                className={cx(
                  'absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-background-primary rounded-full',
                  isOnline ? 'bg-green-500' : 'bg-gray-500'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h3
                  className={`font-bold p-0 truncate ${
                    activeChat?.id === chat.id
                      ? 'text-font-primary-contrast dark:text-font'
                      : 'text-font'
                  }`}
                >
                  {partner.username}
                </h3>
                <span
                  className={`text-xs ${
                    activeChat?.id === chat.id
                      ? 'text-font-primary-contrast dark:text-font'
                      : 'text-font-subtle'
                  }`}
                >
                  {formatLastMessage(getLastMessageTime(chat))}
                </span>
              </div>
              <p
                className={`text-sm truncate ${
                  activeChat?.id === chat.id
                    ? 'text-font-primary-contrast dark:text-font'
                    : 'text-font-subtle'
                }`}
              >
                {chat.messages[chat.messages.length - 1]?.content ||
                  'No messages yet'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SearchList = ({
  query,
  isSearching,
  foundUsers,
  recentSearches,
  clearRecentSearches,
  onUserSelect,
  focusedUserIndex,
  onKeyDown,
  listRef,
}: {
  query: string;
  isSearching: boolean;
  foundUsers: ChatPreview[];
  recentSearches: SearchUser[];
  clearRecentSearches: () => void;
  onUserSelect: (
    userId: number,
    username: string,
    avatarUrl: string | null
  ) => void;
  focusedUserIndex: number;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  listRef: React.RefObject<HTMLDivElement>;
}) => {
  // Determine if we're showing search results or recent searches
  const isShowingSearchResults = !!query;

  // Get the list of users to display
  const displayUsers = isShowingSearchResults
    ? foundUsers
    : recentSearches.map((user) => ({
        id: user.id,
        name: user.username,
        avatarUrl: user.avatarUrl,
        description: `Last searched ${new Date(
          user.lastSearched
        ).toLocaleDateString()}`,
      }));

  return (
    <div
      className="flex-1 overflow-y-auto bg-background-primary focus:outline-none"
      ref={listRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="listbox"
      id="search-results"
      aria-label={isShowingSearchResults ? 'Search results' : 'Recent searches'}
    >
      {isSearching ? (
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      ) : (
        <div className="py-2">
          <div className="px-4 py-2 flex justify-between items-center">
            <h3 className="text-sm text-font-subtle">
              {isShowingSearchResults ? 'Global Search' : 'Recent Searches'}
            </h3>
            {!isShowingSearchResults && recentSearches.length > 0 && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  clearRecentSearches();
                }}
                className="p-1.5 rounded-full hover:bg-elevation-hover transition-colors group"
                title="Clear recent searches"
                aria-label="Clear recent searches"
              >
                <HiOutlineTrash className="w-4 h-4 text-icon-subtle group-hover:text-icon-error" />
              </button>
            )}
          </div>
          {displayUsers.length === 0 ? (
            <p className="px-4 py-2 text-font-subtle">
              {isShowingSearchResults ? 'No users found' : 'No recent searches'}
            </p>
          ) : (
            displayUsers.map((user, index) => (
              <UserListItem
                key={user.id}
                user={user}
                isActive={focusedUserIndex === index}
                onClick={() => onUserSelect(user.id, user.name, user.avatarUrl)}
                position={index}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const UserListItem = ({
  user,
  isActive,
  onClick,
  position,
}: {
  user: ChatPreview;
  isActive?: boolean;
  onClick: () => void;
  position: number;
}) => (
  <div
    className={cx(
      'px-4 py-2 flex items-center space-x-3 cursor-pointer transition-colors',
      isActive
        ? 'bg-primary text-font-primary-contrast ring-2 ring-primary-light ring-opacity-75'
        : 'text-font hover:bg-elevation-hover'
    )}
    onMouseDown={onClick}
    role="option"
    aria-selected={isActive}
    id={`user-option-${position}`}
    tabIndex={-1}
    data-index={position}
  >
    <Avatar username={user.name} src={user.avatarUrl} />
    <div>
      <h4
        className={cx(
          isActive ? 'text-font-primary-contrast dark:text-font' : 'text-font'
        )}
      >
        {user.name}
      </h4>
      {user.description && (
        <p
          className={cx(
            'text-sm',
            isActive
              ? 'text-font-primary-contrast dark:text-font'
              : 'text-font-subtle'
          )}
        >
          {user.description}
        </p>
      )}
    </div>
  </div>
);
