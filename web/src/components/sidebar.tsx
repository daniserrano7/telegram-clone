import { useState } from 'react';
import cx from 'classix';
import { type UserId } from '@shared/user.dto';
import { useLocalStorage } from 'src/hooks/useLocalStorage';
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

type ChatPreview = {
  id: UserId;
  name: string;
  description: string;
  avatarUrl: string;
};

type SearchUser = {
  id: number;
  username: string;
  avatarUrl: string;
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
  const [recentSearches, setRecentSearches] = useLocalStorage<SearchUser[]>(
    'recentSearches',
    []
  );
  const openChatWithUser = useChatStore((state) => state.openChatWithUser);
  const user = useAuthStore((state) => state.user);

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
                avatarUrl: u.avatarUrl,
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
    avatarUrl: string
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

  return (
    <div className="h-full flex flex-col border-r border-border">
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        openSection={setOpenSection}
      />
      {openSection === 'profile' ? (
        <ProfileDialog isOpen={true} onClose={() => setOpenSection(null)} />
      ) : null}
      <div className="px-4 h-[64px] flex gap-3 items-center border-b border-border">
        <button onClick={() => setIsSettingsOpen(true)}>
          {/* Search Bar */}
          <HiOutlineBars3 className="size-[24px] text-icon-subtle" />
        </button>
        <form className="md:w-auto w-full" onSubmit={(e) => e.preventDefault()}>
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={handleSearch}
              onFocus={() => setIsSearchFocus(true)}
              onBlur={() => setIsSearchFocus(false)}
              className={cx(
                'w-full rounded-full py-2 px-4 text-font placeholder-font-subtle focus:outline-none focus:ring-2 focus:ring-primary',
                isSearchFocus ? 'bg-transparent' : 'bg-elevation'
              )}
            />
            <button
              onMouseDown={() => {
                setSearch('');
                setIsSearchFocus(false);
              }}
              className={cx(
                'absolute hover:bg-elevation rounded-full flex justify-center items-center right-3 top-1/2 -translate-y-1/2 p-[2px]',
                isSearchFocus ? 'block' : 'hidden'
              )}
            >
              <HiOutlineXMark className="size-4 text-icon-subtle" />
            </button>
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
        />
      ) : (
        <ChatList onChatSelect={onChatSelect} />
      )}
    </div>
  );
};

const ChatList = ({ onChatSelect }: { onChatSelect?: () => void }) => {
  const chats = useChatStore((state) => state.chats);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const activeChat = useChatStore((state) => state.activeChat);
  const findPartner = useChatStore((state) => state.getChatPartner);
  const contacts = useUserStore((state) => state.contacts);

  console.log('CHATS', chats);

  const formatLastMessage = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date.toDateString() === today.toDateString()
      ? `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : date.toLocaleDateString();
  };

  if (chats.length === 0) {
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
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat) => {
        const partner = findPartner(chat);
        if (!partner) return null;

        const contact = contacts[partner.id];
        console.log('CONTACT', contact);

        const status = contact?.onlineStatus;
        console.log('STATUS', status);
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
                : 'text-font hover:bg-elevation'
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
                      ? 'text-font-primary-contrast'
                      : 'text-font'
                  }`}
                >
                  {partner.username}
                </h3>
                <span
                  className={`text-xs ${
                    activeChat?.id === chat.id
                      ? 'text-font-primary-contrast'
                      : 'text-font-subtle'
                  }`}
                >
                  {formatLastMessage(
                    new Date(chat.messages[chat.messages.length - 1]?.createdAt)
                  )}
                </span>
              </div>
              <p
                className={`text-sm truncate ${
                  activeChat?.id === chat.id
                    ? 'text-font-primary-contrast'
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
}: {
  query: string;
  isSearching: boolean;
  foundUsers: ChatPreview[];
  recentSearches: SearchUser[];
  clearRecentSearches: () => void;
  onUserSelect: (userId: number, username: string, avatarUrl: string) => void;
}) => {
  return (
    <div className="flex-1 overflow-y-auto bg-background-primary">
      {isSearching ? (
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      ) : query ? (
        <div className="py-2">
          <h3 className="px-4 py-2 text-sm text-font-subtle">Global Search</h3>
          {foundUsers.length === 0 ? (
            <p className="px-4 py-2 text-font-subtle">No users found</p>
          ) : (
            foundUsers.map((user) => (
              <UserListItem
                key={user.id}
                user={user}
                onClick={() => onUserSelect(user.id, user.name, user.avatarUrl)}
              />
            ))
          )}
        </div>
      ) : (
        <div className="py-2">
          <div className="px-4 py-2 flex justify-between items-center">
            <h3 className="text-sm text-font-subtle">Recent Searches</h3>
            {recentSearches.length > 0 && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  clearRecentSearches();
                }}
                className="p-1.5 rounded-full hover:bg-elevation transition-colors group"
                title="Clear recent searches"
              >
                <HiOutlineTrash className="w-4 h-4 text-icon-subtle group-hover:text-icon-error" />
              </button>
            )}
          </div>
          {recentSearches.length === 0 ? (
            <p className="px-4 py-2 text-font-subtle">No recent searches</p>
          ) : (
            recentSearches.map((user) => (
              <UserListItem
                key={user.id}
                user={{
                  id: user.id,
                  name: user.username,
                  avatarUrl: user.avatarUrl,
                  description: `Last searched ${new Date(
                    user.lastSearched
                  ).toLocaleDateString()}`,
                }}
                onClick={() =>
                  onUserSelect(user.id, user.username, user.avatarUrl)
                }
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
}: {
  user: ChatPreview;
  isActive?: boolean;
  onClick: () => void;
}) => (
  <div
    className={`px-4 py-2 flex items-center space-x-3 hover:bg-elevation cursor-pointer ${
      isActive ? 'bg-primary text-font-primary-contrast' : 'text-font'
    }`}
    onMouseDown={onClick}
  >
    <Avatar username={user.name} src={user.avatarUrl} />
    <div>
      <h4 className="text-font">{user.name}</h4>
      {user.description && (
        <p className="text-sm text-font-subtle">{user.description}</p>
      )}
    </div>
  </div>
);
