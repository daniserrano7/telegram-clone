import { useEffect, useRef, useCallback, useState } from 'react';
import {
  HiOutlineCheck,
  HiOutlinePaperAirplane,
  HiOutlineMagnifyingGlass,
  HiOutlineViewColumns,
  HiOutlineChevronLeft,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
} from 'react-icons/hi2';
import { useUserStore } from 'src/stores/user.store';
import { useAuthStore } from 'src/stores/auth.store';
import { useChatStore } from 'src/stores/chat.store';
import { type MessageStatus } from '@shared/gateway.dto';
import { Events } from '@shared/gateway.dto';
import { type Message } from '@shared/chat.dto';
import { ProfileDialog } from './profile-dialog';
import { Avatar } from './avatar';
import { useSearchStore } from 'src/stores/search.store';
import { formatLastActive } from 'src/utils/date';
import cx from 'classix';

export const Chat = ({
  toggleChatInfo,
  onBackClick,
  showBackButton,
}: ChatHeaderProps) => {
  const activeChat = useChatStore((state) => state.activeChat);

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background-primary relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.2]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-font) 1px, transparent 0)`,
              backgroundSize: '20px 20px',
            }}
          />

          {/* Animated gradient orbs */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-blob" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-blob animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-[120px] animate-blob animation-delay-4000" />
          </div>

          {/* Decorative lines */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(45deg, var(--color-font) 1px, transparent 1px),
                linear-gradient(-45deg, var(--color-font) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center relative">
          <div className="text-center space-y-6">
            {/* Animated illustration */}
            <div className="relative w-48 h-48 mx-auto">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-pulse" />
              <div className="relative flex items-center justify-center h-full">
                <div className="bubble-container">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="speech-bubble"
                      style={
                        {
                          '--delay': `${i * 0.2}s`,
                          '--scale': `${1 - i * 0.1}`,
                        } as React.CSSProperties
                      }
                    >
                      <div className="w-24 h-24 bg-elevation/80 backdrop-blur-sm rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-md flex items-center justify-center shadow-lg">
                        <span className="text-4xl transform -rotate-12 hover:scale-110 transition-transform cursor-default">
                          {['💬', '✨', '👋'][i]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              <h2 className="text-xl font-medium text-font">
                <span className="opacity-50">Ready to</span>{' '}
                <span className="text-primary">connect</span>
                <span className="opacity-50">?</span>
              </h2>
              <p className="text-sm text-font-subtle mt-2 animate-pulse">
                Pick a chat or start a new one
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background-primary relative">
      {/* Background patterns */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, var(--color-font) 0.5px, transparent 0),
            linear-gradient(to bottom, var(--color-primary) 0%, transparent 100%)
          `,
          backgroundSize: '24px 24px, 100% 100%',
          opacity: 0.03,
          pointerEvents: 'none',
        }}
      />

      <div className="flex-shrink-0 relative z-10">
        <ChatHeader
          toggleChatInfo={toggleChatInfo}
          onBackClick={onBackClick}
          showBackButton={showBackButton}
        />
      </div>
      <div className="flex-1 overflow-hidden relative z-10">
        <MessageList />
      </div>
      <div className="flex-shrink-0 relative z-10">
        <MessageInput />
      </div>
    </div>
  );
};

interface ChatHeaderProps {
  toggleChatInfo: () => void;
  onBackClick?: () => void;
  showBackButton?: boolean;
}

const MessageStatus = ({ status }: { status: MessageStatus }) => {
  switch (status) {
    case 'SENT':
      return <HiOutlineCheck className="w-4 h-4 text-icon-subtle" />;
    case 'DELIVERED':
      return (
        <div className="flex">
          <HiOutlineCheck className="w-4 h-4 text-icon-subtle" />
          <HiOutlineCheck className="w-4 h-4 text-icon-subtle -ml-2" />
        </div>
      );
    case 'READ':
      return (
        <div className="flex">
          <HiOutlineCheck className="w-4 h-4 text-icon-success" />
          <HiOutlineCheck className="w-4 h-4 text-icon-success -ml-2" />
        </div>
      );
    default:
      return null;
  }
};

const Message = ({
  message,
  isOwn,
  highlight = false,
  searchQuery = '',
  isCurrentMatch = false,
}: {
  message: Message;
  isOwn: boolean;
  highlight?: boolean;
  searchQuery?: string;
  isCurrentMatch?: boolean;
}) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const socket = useChatStore((state) => state.socket);
  const wasReadRef = useRef(false);

  useEffect(() => {
    if (isCurrentMatch && messageRef.current) {
      messageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isCurrentMatch]);

  const handleMessageVisible = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        !isOwn &&
        message.status !== 'READ' &&
        !wasReadRef.current &&
        socket
      ) {
        wasReadRef.current = true;
        socket.emit(Events.MESSAGE_READ, { messageId: message.id });
      }
    },
    [message.id, isOwn, message.status, socket]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleMessageVisible, {
      threshold: 0.5,
      rootMargin: '0px',
    });

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [handleMessageVisible]);

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 text-black rounded px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div
      ref={messageRef}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[500px] group relative ${
          isOwn ? 'bg-primary' : 'bg-elevation'
        } rounded-lg px-4 py-2 ${isCurrentMatch ? 'ring-2 ring-primary' : ''}`}
      >
        <p className={isOwn ? 'text-font-primary-contrast' : 'text-font'}>
          {highlight && searchQuery
            ? highlightText(message.content, searchQuery)
            : message.content}
        </p>
        <div className="flex items-center justify-end space-x-1 mt-1">
          <span
            className={`text-xs ${
              isOwn ? 'text-font-primary-contrast' : 'text-font-subtle'
            }`}
          >
            {new Date(message.createdAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {isOwn && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
};

const MessageList = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const activeChat = useChatStore((state) => state.activeChat);
  const listRef = useRef<HTMLDivElement>(null);
  const { searchQuery, currentMatchIndex, totalMatches, setTotalMatches } =
    useSearchStore();

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [activeChat?.messages]);

  useEffect(() => {
    if (!searchQuery.trim() || !activeChat?.messages) {
      setTotalMatches(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches = activeChat.messages.filter((message) =>
      message.content.toLowerCase().includes(query)
    ).length;

    setTotalMatches(matches);
  }, [searchQuery, activeChat?.messages, setTotalMatches]);

  if (!activeChat) return null;

  return (
    <div
      ref={listRef}
      className="h-full overflow-y-auto p-4 bg-background-primary"
    >
      <div className="space-y-2">
        {activeChat.messages.map((message, index) => {
          const matches = Boolean(
            searchQuery &&
              message.content.toLowerCase().includes(searchQuery.toLowerCase())
          );
          const matchIndex = matches
            ? activeChat.messages
                .slice(0, index)
                .filter((m) =>
                  m.content.toLowerCase().includes(searchQuery.toLowerCase())
                ).length
            : -1;

          return (
            <Message
              key={message.id}
              message={message}
              isOwn={message.senderId === userId}
              highlight={matches}
              searchQuery={searchQuery}
              isCurrentMatch={matchIndex === currentMatchIndex}
            />
          );
        })}
      </div>
      {searchQuery && totalMatches === 0 && (
        <div className="flex justify-center items-center h-20">
          <p className="text-font-subtle">No messages found</p>
        </div>
      )}
    </div>
  );
};

const MessageInput = () => {
  const activeChat = useChatStore((state) => state.activeChat);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const createChat = useChatStore((state) => state.createChat);
  const emitTypingStatus = useUserStore((state) => state.emitTypingStatus);

  if (!activeChat) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input');
    if (!input) return;

    const content = input.value;
    if (!content) return;

    const chatId = activeChat.id;
    if (!chatId) {
      await createChat({
        userIds: activeChat.members.map((member) => member.id),
        content,
      });
      input.value = '';
      return;
    }

    try {
      sendMessage(chatId, content);
    } catch (error) {
      console.error('Failed to send message', error);
    }

    input.value = '';
    emitTypingStatus(chatId, false);
  };

  return (
    <div className="p-4 bg-background-primary border-t border-border">
      <form className="flex items-center space-x-4" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Write a message..."
          className="flex-1 bg-elevation text-font py-3 px-4 rounded-lg focus:outline-none"
          onChange={(e) => {
            const chatId = activeChat.id;

            if (!chatId) return;

            const isTyping = e.currentTarget.value.trim().length > 0;
            emitTypingStatus(chatId, isTyping);
          }}
        />
        <button
          type="submit"
          className="p-3 bg-primary hover:bg-primary/80 rounded-full transition-colors"
        >
          <HiOutlinePaperAirplane className="w-5 h-5 text-font" />
        </button>
      </form>
    </div>
  );
};

const ChatHeader = ({
  toggleChatInfo,
  onBackClick,
  showBackButton,
}: ChatHeaderProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeChat = useChatStore((state) => state.activeChat);
  const getChatPartner = useChatStore((state) => state.getChatPartner);
  const partner = activeChat ? getChatPartner(activeChat) : null;
  const contacts = useUserStore((state) => state.contacts);
  const isOnline = partner
    ? contacts[partner.id]?.onlineStatus === 'ONLINE'
    : false;
  const lastConnection = partner ? contacts[partner.id]?.lastConnection : null;
  const userStatuses = useUserStore((state) => state.userStatuses);
  const typingStatus = userStatuses.get(partner?.id || 0)?.typing;
  const isTyping = typingStatus
    ? typingStatus.isTyping && typingStatus.chatId === activeChat?.id
    : false;

  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    currentMatchIndex,
    totalMatches,
    nextMatch,
    previousMatch,
  } = useSearchStore();

  useEffect(() => {
    if (isSearching && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearching]);

  if (!activeChat || !partner) return null;

  const getStatusText = () => {
    if (isTyping) return 'typing...';
    if (isOnline) return 'Online';
    if (lastConnection) {
      return `Last seen ${formatLastActive(lastConnection)}`;
    }
    return 'Offline';
  };

  return (
    <>
      <div className="h-[64px] px-4 flex items-center justify-between bg-background-primary border-b border-border">
        {isSearching ? (
          <div className="flex-1 flex items-center gap-3">
            <button
              onClick={() => {
                setIsSearching(false);
                clearSearch();
              }}
              className="p-2 hover:bg-elevation rounded-full transition-colors"
            >
              <HiOutlineChevronLeft className="w-5 h-5 text-icon-subtle" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-elevation text-font py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && totalMatches > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-font-subtle">
                  {currentMatchIndex + 1}/{totalMatches}
                </span>
                <div className="flex flex-col">
                  <button
                    onClick={previousMatch}
                    className="p-1 hover:bg-elevation rounded-sm transition-colors"
                  >
                    <HiOutlineChevronUp className="w-4 h-4 text-icon-subtle" />
                  </button>
                  <button
                    onClick={nextMatch}
                    className="p-1 hover:bg-elevation rounded-sm transition-colors"
                  >
                    <HiOutlineChevronDown className="w-4 h-4 text-icon-subtle" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3">
              {showBackButton && (
                <button onClick={onBackClick} className="md:hidden">
                  <HiOutlineChevronLeft className="w-6 h-6 text-icon-subtle" />
                </button>
              )}
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center space-x-3 hover:bg-elevation -ml-1 px-2 py-1 rounded-lg transition-colors"
              >
                <div className="relative">
                  <Avatar
                    username={partner.username}
                    size={40}
                    src={partner.avatarUrl}
                  />
                  <div
                    className={cx(
                      'absolute bottom-0 right-0 w-3 h-3 border-2 border-background-primary rounded-full',
                      isOnline ? 'bg-green-500' : 'bg-gray-500'
                    )}
                  />
                </div>
                <div className="text-start">
                  <h2 className="text-font font-medium">{partner.username}</h2>
                  <span className="text-sm text-font-subtle">
                    {getStatusText()}
                  </span>
                </div>
              </button>
            </div>
            <div className="flex items-center space-x-4 text-icon-subtle">
              <button
                onClick={() => setIsSearching(true)}
                className="p-2 hover:bg-elevation rounded-full transition-colors"
              >
                <HiOutlineMagnifyingGlass className="w-5 h-5" />
              </button>
              <button onClick={toggleChatInfo} className="hidden lg:block">
                <HiOutlineViewColumns className="w-5 h-5 cursor-pointer hover:text-icon" />
              </button>
            </div>
          </>
        )}
      </div>
      <ProfileDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        viewUser={partner}
      />
    </>
  );
};

// Add animations at the end of the file
const style = document.createElement('style');
style.textContent = `
  .bubble-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .speech-bubble {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(var(--scale, 1));
    animation: bubble-float 2s ease-in-out infinite;
    animation-delay: var(--delay, 0s);
  }

  @keyframes bubble-float {
    0%, 100% {
      transform: translate(-50%, -50%) scale(var(--scale, 1));
    }
    50% {
      transform: translate(-50%, calc(-50% - 12px)) scale(var(--scale, 1));
    }
  }

  .pattern-grid {
    background-image: linear-gradient(var(--color-font) 1px, transparent 1px),
      linear-gradient(to right, var(--color-font) 1px, transparent 1px);
    background-size: 64px 64px;
    opacity: 0.2;
  }

  .pattern-dots {
    background-image: radial-gradient(circle at 1px 1px, var(--color-font) 1px, transparent 0);
    background-size: 24px 24px;
    opacity: 0.3;
  }

  @keyframes blob {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    25% {
      transform: translate(20px, -20px) scale(1.05);
    }
    50% {
      transform: translate(-20px, 20px) scale(0.95);
    }
    75% {
      transform: translate(-20px, -20px) scale(1.05);
    }
  }

  .animate-blob {
    animation: blob 10s infinite;
  }

  .animation-delay-2000 {
    animation-delay: 2s;
  }

  .animation-delay-4000 {
    animation-delay: 4s;
  }
`;
document.head.appendChild(style);
