import { useEffect, useRef, useCallback, useState } from 'react';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineViewColumns,
  HiOutlineChevronLeft,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
} from 'react-icons/hi2';
import cx from 'classix';
import { IoSendSharp } from 'react-icons/io5';
import { BiCheck, BiCheckDouble } from 'react-icons/bi';
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

export const Chat = ({
  toggleChatInfo,
  onBackClick,
  showBackButton,
}: ChatHeaderProps) => {
  const activeChat = useChatStore((state) => state.activeChat);

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#dfe8d4] relative overflow-hidden">
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
        </div>

        <div className="flex-1 flex items-center justify-center relative">
          <div className="text-center">
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

            <div className="relative inset-2 backdrop-blur-sm bg-background-primary/30 px-4 py-2 rounded-lg">
              <h2 className="text-2xl font-medium text-font space-x-3">
                <span className="inline-block animate-bounce">Let's</span>
                <span className="inline-block text-primary relative">
                  chat
                  <span className="absolute -top-1 -right-2 text-lg animate-pulse">
                    ✨
                  </span>
                </span>
                <span className="inline-block">together!</span>
              </h2>
              <p className="text-sm text-font-subtle opacity-75">
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
        className="absolute inset-0 bg-red-200"
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
      <div className="flex-1 overflow-hidden relative z-10 bg-[#dfe8d4]">
        <div
          className="absolute w-full h-full top-0 left-0 pointer-events-none"
          style={{
            backgroundImage: `
            radial-gradient(circle at 0 0, rgba(226, 232, 104, 0.8) 10%, transparent 45%),
              radial-gradient(circle at 100% 100%, rgba(238, 240, 189, 0.8) 10%, transparent 45%)
            `,
            backgroundColor: '#87b489',
          }}
        />
        <canvas
          className="absolute w-full h-full top-0 opacity-20 left-0 pointer-events-none"
          style={{
            backgroundImage: `url('/pattern.svg')`,
          }}
        />
        <MessageList />
      </div>
      <div className="flex-shrink-0 relative z-10">
        <MessageInput />
      </div>
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

interface ChatHeaderProps {
  toggleChatInfo: () => void;
  onBackClick?: () => void;
  showBackButton?: boolean;
}

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

  const getMessageSender = (message: Message) => {
    return activeChat.members.find((member) => member.id === message.senderId);
  };

  const getMessagePosition = (
    index: number,
    message: Message
  ): 'single' | 'first' | 'middle' | 'last' => {
    const prevMessage = index > 0 ? activeChat.messages[index - 1] : null;
    const nextMessage =
      index < activeChat.messages.length - 1
        ? activeChat.messages[index + 1]
        : null;

    const isPrevSameSender = prevMessage?.senderId === message.senderId;
    const isNextSameSender = nextMessage?.senderId === message.senderId;

    if (!isPrevSameSender && !isNextSameSender) return 'single';
    if (!isPrevSameSender && isNextSameSender) return 'first';
    if (isPrevSameSender && isNextSameSender) return 'middle';
    return 'last';
  };

  return (
    <div ref={listRef} className="h-full overflow-y-auto p-4 z-10">
      <div>
        {activeChat.messages.map((message, index) => {
          const isOwn = message.senderId === userId;
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

          const sender = getMessageSender(message);
          const position = getMessagePosition(index, message);

          return (
            <div>
              {/* Date divider */}
              <div
                className={cx(
                  'flex justify-center my-3 z-30',
                  index === 0 ||
                    new Date(
                      activeChat.messages[index - 1].createdAt
                    ).getDate() !== new Date(message.createdAt).getDate()
                    ? 'block'
                    : 'hidden'
                )}
              >
                <div className="bg-[#00000015] text-[#4e774e] text-xs px-3 py-1 rounded-lg">
                  {new Date(message.createdAt).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <Message
                key={message.id}
                message={message}
                isOwn={isOwn}
                highlight={matches}
                searchQuery={searchQuery}
                isCurrentMatch={matchIndex === currentMatchIndex}
                user={sender}
                position={position}
              />
            </div>
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

const Message = ({
  message,
  isOwn,
  highlight = false,
  searchQuery = '',
  isCurrentMatch = false,
  user,
  position,
}: {
  message: Message;
  isOwn: boolean;
  highlight?: boolean;
  searchQuery?: string;
  isCurrentMatch?: boolean;
  user?: { username: string; avatarUrl?: string };
  position: 'single' | 'first' | 'middle' | 'last';
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
      className={cx(
        'flex items-end gap-2 mt-1',
        isOwn ? 'justify-end lg:justify-start' : 'justify-start',
        position === 'last' || position === 'single' ? 'mb-4' : ''
      )}
    >
      {/* Avatar - only visible on lg screens */}
      {(position === 'last' || position === 'single') && user ? (
        <div className="hidden lg:block flex-shrink-0">
          <Avatar username={user.username} src={user.avatarUrl} size={32} />
        </div>
      ) : null}

      {/* Message content */}
      <div
        className={cx(
          'max-w-[500px] group relative px-3 py-1 shadow-[0px_1px_2px_rgba(0,0,0,0.13)]',
          // Base styles
          isOwn ? 'bg-background-secondary' : 'bg-elevation',
          // Border radius based on position and ownership
          isOwn &&
            position === 'single' &&
            'rounded-2xl rounded-br-none lg:rounded-[20px] lg:rounded-bl-none',
          isOwn &&
            position === 'first' &&
            'rounded-2xl rounded-br-md lg:rounded-[20px] lg:rounded-bl-md',
          isOwn &&
            position === 'middle' &&
            'rounded-2xl rounded-r-md lg:rounded-[20px] lg:rounded-l-md',
          isOwn &&
            position === 'last' &&
            'rounded-2xl rounded-tr-md rounded-br-none lg:rounded-[20px] lg:rounded-bl-none lg:rounded-tl-md',
          !isOwn && position === 'single' && 'rounded-2xl rounded-bl-none',
          !isOwn && position === 'first' && 'rounded-2xl rounded-bl-md',
          !isOwn && position === 'middle' && 'rounded-r-2xl rounded-l-md',
          !isOwn &&
            position === 'last' &&
            'rounded-2xl rounded-tl-md rounded-bl-none',
          // Spacing
          position === 'last' || position === 'single' ? '' : 'lg:ml-10',
          // Highlight
          isCurrentMatch && 'ring-2 ring-primary'
        )}
      >
        {/* Sender name for non-own first messages */}
        {/* {!isOwn && (position === 'first' || position === 'single') && user && (
          <div className="text-[#4fae4e] text-sm font-medium mb-1">
            {user.username}
          </div>
        )} */}

        <p className="text-font">
          {highlight && searchQuery
            ? highlightText(message.content, searchQuery)
            : message.content}
        </p>

        {/* Timestamp and status with Telegram styling */}
        <div className="flex items-center justify-end gap-1 mt-0.5 ml-4 float-right">
          <span
            className={cx(
              'text-[11px]',
              isOwn ? 'text-[#71ab92]' : 'text-[#8d8d8d]'
              // isOwn ? 'text-font-secondary' : 'text-font-subtle'
            )}
          >
            {new Date(message.createdAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </span>
          {isOwn && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
};

const MessageStatus = ({ status }: { status: MessageStatus }) => {
  switch (status) {
    case 'SENT':
      return <BiCheck className="w-5 h-5 text-[#71ab92]" />;
    case 'DELIVERED':
      return (
        <div className="flex">
          <BiCheckDouble className="w-5 h-5 text-[#71ab92]" />
        </div>
      );
    case 'READ':
      return (
        <div className="flex">
          <BiCheckDouble className="w-5 h-5 text-icon-info" />
        </div>
      );
    default:
      return null;
  }
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
          className="flex-1 bg-input-background hover:bg-input-background-hover text-font py-3 px-4 rounded-lg focus:outline-input-border"
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
          <IoSendSharp className="w-5 h-5 text-font-primary-contrast" />
        </button>
      </form>
    </div>
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
