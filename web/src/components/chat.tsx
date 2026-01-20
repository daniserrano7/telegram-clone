import {
  useEffect,
  useRef,
  useCallback,
  useState,
  Fragment,
  lazy,
  Suspense,
} from 'react';
import { parseMarkdown, parseMarkdownWithHighlights } from '../utils/markdown';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineViewColumns,
  HiOutlineChevronLeft,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
} from 'react-icons/hi2';
import cx from 'classix';
import { IoSendSharp, IoHappyOutline } from 'react-icons/io5';
import type { EmojiClickData } from 'emoji-picker-react';

// Dynamically import EmojiPicker to avoid SSR issues and hook conflicts
const EmojiPicker = lazy(() => import('emoji-picker-react'));
import { BiCheck, BiCheckDouble, BiTime, BiError, BiX } from 'react-icons/bi';
import { useContactsStore } from 'src/stores/contacts.store';
import { useAuthStore } from 'src/stores/auth.store';
import { useChatStore } from 'src/stores/chat.store';
import { useThemeStore } from 'src/stores/theme.store';
import { useBlockStore } from 'src/stores/block.store';
import { Events } from '@shared/gateway.dto';
import { type LocalMessage, type LocalMessageStatus } from '../types/local-message';
import { ProfileDialog } from './profile-dialog';
import { Avatar } from './avatar';
import { useSearchStore } from 'src/stores/search.store';
import { formatLastActive } from 'src/utils/date';
import { socketService } from '../services/socket.service';

export const Chat = ({
  toggleChatInfo,
  onBackClick,
  showBackButton,
}: ChatHeaderProps) => {
  const activeChat = useChatStore((state) => state.activeChat);
  const themeStoreValue = useThemeStore((state) => state.theme);

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
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
              <div
                className="absolute inset-0 rounded-full blur-3xl animate-pulse"
                style={{
                  backgroundColor:
                    themeStoreValue === 'dark'
                      ? 'rgba(36, 129, 204, 0.2)' // Primary color with 20% opacity
                      : 'rgba(36, 129, 204, 0.05)', // Primary color with 5% opacity
                }}
              />
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
                      <div
                        className="w-24 h-24 backdrop-blur-sm rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-md flex items-center justify-center shadow-lg"
                        style={{
                          backgroundColor:
                            themeStoreValue === 'dark'
                              ? 'rgba(45, 58, 74, 0.9)' // elevation-hover with 90% opacity
                              : 'rgba(244, 244, 245, 0.8)', // elevation with 80% opacity
                          borderWidth:
                            themeStoreValue === 'dark' ? '1px' : '0px',
                          borderColor:
                            themeStoreValue === 'dark'
                              ? 'rgba(36, 129, 204, 0.2)' // primary with 20% opacity
                              : 'transparent',
                        }}
                      >
                        <span className="text-4xl transform -rotate-12 hover:scale-110 transition-transform cursor-default">
                          {['💬', '✨', '👋'][i]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="relative inset-2 backdrop-blur-sm rounded-lg shadow-lg"
              style={{
                backgroundColor:
                  themeStoreValue === 'dark'
                    ? 'rgba(23, 33, 43, 0.5)' // background-primary with 50% opacity
                    : 'rgba(255, 255, 255, 0.3)', // background-primary with 30% opacity
                borderWidth: themeStoreValue === 'dark' ? '1px' : '0px',
                borderColor:
                  themeStoreValue === 'dark'
                    ? 'rgba(36, 129, 204, 0.2)' // primary with 20% opacity
                    : 'transparent',
                padding: '0.5rem 1rem',
              }}
            >
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
              <p
                className="text-sm"
                style={{
                  color: 'var(--color-font-subtle)',
                  opacity: themeStoreValue === 'dark' ? 1 : 0.75,
                }}
              >
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

      <div className="flex-shrink-0 relative">
        <ChatHeader
          toggleChatInfo={toggleChatInfo}
          onBackClick={onBackClick}
          showBackButton={showBackButton}
        />
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute w-full h-full top-0 left-0 bg-background-chat pointer-events-none" />
        {themeStoreValue === 'light' ? (
          <>
            <div className="absolute w-full h-full top-0 left-0 bg-chat-gradient pointer-events-none" />
            <canvas
              className="absolute w-full bg-chat-gradient h-full top-0 opacity-30 left-0 pointer-events-none"
              style={{
                backgroundImage: `url('/pattern.svg')`,
                willChange: 'transform',
              }}
            />
          </>
        ) : themeStoreValue === 'dark' ? (
          <canvas
            className="w-full h-full absolute top-0 left-0 pointer-events-none opacity-30 bg-chat-gradient"
            style={{
              maskImage: 'url("/pattern.svg")',
              WebkitMaskImage: 'url("/pattern.svg")',
              maskRepeat: 'repeat',
              WebkitMaskRepeat: 'repeat',
              willChange: 'transform',
            }}
          />
        ) : null}

        <MessageList />
      </div>
      <div className="flex-shrink-0 relative">
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
  const getChatName = useChatStore((state) => state.getChatName);
  const getChatAvatar = useChatStore((state) => state.getChatAvatar);
  const isNetworkOnline = useChatStore((state) => state.isOnline);
  const partner = activeChat ? getChatPartner(activeChat) : null;
  const contacts = useContactsStore((state) => state.contacts);
  const isOnline = partner
    ? contacts[partner.id]?.onlineStatus === 'ONLINE'
    : false;
  const lastConnection = partner ? contacts[partner.id]?.lastConnection : null;
  const contactsStatuses = useContactsStore((state) => state.contactsStatuses);
  const typingStatus = contactsStatuses.get(partner?.id || 0)?.typing;
  const isTyping = typingStatus
    ? typingStatus.isTyping && typingStatus.chatId === activeChat?.id
    : false;
  const isBlocked = useBlockStore((state) => state.isBlocked(partner?.id || 0));

  const isGroup = activeChat?.type === 'GROUP';
  const chatName = activeChat ? getChatName(activeChat) : '';
  const chatAvatar = activeChat ? getChatAvatar(activeChat) : { username: '', src: null };

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

  if (!activeChat) return null;
  // For direct chats, we need a partner
  if (!isGroup && !partner) return null;

  const getStatusText = () => {
    if (isGroup) {
      return `${activeChat.members.length} members`;
    }
    if (isBlocked) return 'Blocked';
    if (isTyping) return 'Typing...';
    if (isOnline) return 'Online';
    if (lastConnection) {
      return `Last seen ${formatLastActive(lastConnection)}`;
    }
    return 'Offline';
  };

  const handleHeaderClick = () => {
    if (isGroup) {
      // For groups, toggle chat info panel which will show group info
      toggleChatInfo();
    } else {
      // For direct chats, open profile dialog
      setIsProfileOpen(true);
    }
  };

  return (
    <>
      {/* Offline banner */}
      {!isNetworkOnline && (
        <div className="bg-yellow-500/90 text-white text-sm py-1.5 px-4 flex items-center justify-center gap-2">
          <BiError className="w-4 h-4" />
          <span>You're offline. Messages will be sent when you reconnect.</span>
        </div>
      )}
      <div className="h-[64px] px-4 flex items-center justify-between bg-background-primary border-b border-border">
        {isSearching ? (
          <div className="flex-1 flex items-center gap-3">
            <button
              onClick={() => {
                setIsSearching(false);
                clearSearch();
              }}
              className="p-2 hover:bg-elevation-hover rounded-full transition-colors"
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
                    className="p-1 hover:bg-elevation-hover rounded-sm transition-colors"
                  >
                    <HiOutlineChevronUp className="w-4 h-4 text-icon-subtle" />
                  </button>
                  <button
                    onClick={nextMatch}
                    className="p-1 hover:bg-elevation-hover rounded-sm transition-colors"
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
                onClick={handleHeaderClick}
                className="flex items-center space-x-3 hover:bg-elevation-hover -ml-1 px-2 py-1 rounded-lg transition-colors"
              >
                <div className="relative">
                  <Avatar
                    username={chatAvatar.username || chatName}
                    size={40}
                    src={chatAvatar.src ?? null}
                  />
                  {!isGroup && (
                    <div
                      className={cx(
                        'absolute bottom-0 right-0 w-3 h-3 border-2 border-background-primary rounded-full',
                        isOnline ? 'bg-green-500' : 'bg-gray-500'
                      )}
                    />
                  )}
                </div>
                <div className="text-start">
                  <h2 className="text-font font-medium">{chatName}</h2>
                  <span
                    className={cx(
                      'text-sm',
                      !isGroup && isBlocked ? 'text-red-500' : 'text-font-subtle'
                    )}
                  >
                    {getStatusText()}
                  </span>
                </div>
              </button>
            </div>
            <div className="flex items-center space-x-2 text-icon-subtle">
              <button
                onClick={() => setIsSearching(true)}
                className="p-2 hover:bg-elevation-hover rounded-full transition-colors"
              >
                <HiOutlineMagnifyingGlass className="w-5 h-5" />
              </button>
              <button
                onClick={toggleChatInfo}
                className="hidden p-2 hover:bg-elevation-hover rounded-full lg:block"
              >
                <HiOutlineViewColumns className="w-5 h-5 cursor-pointer" />
              </button>
            </div>
          </>
        )}
      </div>
      {partner && (
        <ProfileDialog
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          viewUser={partner}
        />
      )}
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

  const isGroup = activeChat?.type === 'GROUP';

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

  const getMessageSender = (message: LocalMessage) => {
    return activeChat.members.find((member) => member.id === message.senderId);
  };

  const getMessagePosition = (
    index: number,
    message: LocalMessage
  ): 'single' | 'first' | 'middle' | 'last' => {
    // System messages are always 'single'
    if (message.type === 'SYSTEM') return 'single';

    const prevMessage = index > 0 ? activeChat.messages[index - 1] : null;
    const nextMessage =
      index < activeChat.messages.length - 1
        ? activeChat.messages[index + 1]
        : null;

    // Skip system messages when determining position
    const isPrevSameSender = prevMessage?.type !== 'SYSTEM' && prevMessage?.senderId === message.senderId;
    const isNextSameSender = nextMessage?.type !== 'SYSTEM' && nextMessage?.senderId === message.senderId;

    if (!isPrevSameSender && !isNextSameSender) return 'single';
    if (!isPrevSameSender && isNextSameSender) return 'first';
    if (isPrevSameSender && isNextSameSender) return 'middle';
    return 'last';
  };

  // Check if we should show sender name (first message in a group from this sender)
  const shouldShowSenderName = (index: number, message: LocalMessage): boolean => {
    if (!isGroup) return false;
    if (message.type === 'SYSTEM') return false;
    if (message.senderId === userId) return false; // Don't show name for own messages

    const prevMessage = index > 0 ? activeChat.messages[index - 1] : null;
    if (!prevMessage) return true;
    if (prevMessage.type === 'SYSTEM') return true;
    return prevMessage.senderId !== message.senderId;
  };

  return (
    <div ref={listRef} className="h-full overflow-y-auto p-4">
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
          const showSenderName = shouldShowSenderName(index, message);

          return (
            <div key={message.id}>
              {/* Date divider */}
              <div
                className={cx(
                  'justify-center relative my-3',
                  index === 0 ||
                    new Date(
                      activeChat.messages[index - 1].createdAt
                    ).getDate() !== new Date(message.createdAt).getDate()
                    ? 'flex'
                    : 'hidden'
                )}
              >
                <div className="bg-[rgba(74,102,72,0.6)] dark:bg-[rgba(24,37,51,0.8)] text-white text-xs px-3 py-1 rounded-full">
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
                showSenderName={showSenderName}
                isGroup={isGroup}
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
  showSenderName = false,
  isGroup = false,
}: {
  message: LocalMessage;
  isOwn: boolean;
  highlight?: boolean;
  searchQuery?: string;
  isCurrentMatch?: boolean;
  user?: { username: string; avatarUrl: string | null };
  position: 'single' | 'first' | 'middle' | 'last';
  showSenderName?: boolean;
  isGroup?: boolean;
}) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const wasReadRef = useRef(false);
  const retryMessage = useChatStore((state) => state.retryMessage);
  const cancelMessage = useChatStore((state) => state.cancelMessage);

  const isSystemMessage = message.type === 'SYSTEM';

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
      const isEntryIntersecting = entry.isIntersecting;
      const isMessageNotRead = message.status !== 'READ';
      const isMessageNotOwn = !isOwn;
      const isSocketConnected = socketService.isConnected();
      const isMessageNotAlreadyRead = !wasReadRef.current;

      if (
        isEntryIntersecting &&
        isMessageNotRead &&
        isMessageNotOwn &&
        isMessageNotAlreadyRead &&
        isSocketConnected &&
        !isSystemMessage
      ) {
        wasReadRef.current = true;
        socketService.emit(Events.MESSAGE_READ, { messageId: message.id });
      }
    },
    [message.id, isOwn, message.status, isSystemMessage]
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

  const renderMessageContent = (
    text: string,
    query?: string
  ): React.ReactNode => {
    // First split by lines to handle multiline
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => (
      <Fragment key={lineIndex}>
        {query ? parseMarkdownWithHighlights(line, query) : parseMarkdown(line)}
        {lineIndex < lines.length - 1 && <br />}
      </Fragment>
    ));
  };

  // Render system message differently
  if (isSystemMessage) {
    return (
      <div
        ref={messageRef}
        className="flex justify-center my-2"
      >
        <div className="bg-[rgba(74,102,72,0.6)] dark:bg-[rgba(24,37,51,0.8)] text-white text-xs px-3 py-1 rounded-full max-w-[80%] text-center">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messageRef}
      className={cx(
        'flex items-end gap-2 mt-1',
        isOwn ? 'justify-end lg:justify-start' : 'justify-start',
        position === 'last' || position === 'single' ? 'mb-4' : ''
      )}
    >
      {/* Avatar - only visible on lg screens for direct chats, always for groups */}
      {(position === 'last' || position === 'single') && user ? (
        <div className={cx('flex-shrink-0', !isGroup && 'hidden lg:block')}>
          <Avatar username={user.username} src={user.avatarUrl} size={32} />
        </div>
      ) : isGroup && !isOwn ? (
        <div className="w-8 flex-shrink-0" /> // Spacer for alignment
      ) : null}

      {/* Message content */}
      <div
        className={cx(
          'max-w-[500px] group relative px-3 py-1 shadow-[0px_1px_2px_rgba(0,0,0,0.13)]',
          // Base styles
          isOwn
            ? 'bg-background-chat-bubble'
            : 'bg-background-chat-bubble-partner',
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
          (position === 'last' || position === 'single') ? '' : (isGroup && !isOwn ? 'ml-0' : 'lg:ml-10'),
          isCurrentMatch && 'ring-2 ring-primary'
        )}
      >
        {/* Sender name for group chats */}
        {showSenderName && user && (
          <div className="text-xs font-medium text-primary mb-0.5">
            {user.username}
          </div>
        )}

        <div className="text-font message-content">
          {renderMessageContent(
            message.content,
            highlight ? searchQuery : undefined
          )}
        </div>

        {/* Timestamp and status with Telegram styling */}
        <div className="flex items-center justify-end gap-1 mt-0.5 ml-4 float-right">
          <span
            className={cx(
              'text-[11px]',
              isOwn ? 'text-font-secondary' : 'text-font-subtle'
            )}
          >
            {new Date(message.createdAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </span>
          {isOwn && (
            <MessageStatus
              status={message.status}
              onRetry={
                message.status === 'FAILED'
                  ? () => retryMessage(message.clientMessageId)
                  : undefined
              }
              onCancel={
                message.status === 'FAILED'
                  ? () => cancelMessage(message.clientMessageId)
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

const MessageStatus = ({
  status,
  onRetry,
  onCancel,
}: {
  status: LocalMessageStatus;
  onRetry?: () => void;
  onCancel?: () => void;
}) => {
  switch (status) {
    case 'PENDING':
      return (
        <div className="flex items-center">
          <BiTime className="w-4 h-4 text-font-secondary animate-pulse" />
        </div>
      );
    case 'FAILED':
      return (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRetry}
            className="p-0.5 rounded hover:bg-elevation-hover"
            aria-label="Retry sending message"
            title="Retry"
          >
            <BiError className="w-4 h-4 text-red-500" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-0.5 rounded hover:bg-elevation-hover"
            aria-label="Cancel message"
            title="Cancel"
          >
            <BiX className="w-4 h-4 text-font-secondary" />
          </button>
        </div>
      );
    case 'SENT':
      return <BiCheck className="w-5 h-5 text-font-secondary" />;
    case 'DELIVERED':
      return (
        <div className="flex">
          <BiCheckDouble className="w-5 h-5 text-font-secondary" />
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
  const getChatPartner = useChatStore((state) => state.getChatPartner);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const createChat = useChatStore((state) => state.createChat);
  const emitTypingStatus = useContactsStore((state) => state.emitTypingStatus);
  const theme = useThemeStore((state) => state.theme);
  const isEitherBlocked = useBlockStore((state) => state.isEitherBlocked);
  const currentUser = useAuthStore((state) => state.user);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerDimensions, setPickerDimensions] = useState({
    width: 350,
    height: 400,
  });

  const isGroup = activeChat?.type === 'GROUP';
  const partner = activeChat ? getChatPartner(activeChat) : null;
  // Only check blocking for direct chats, not groups
  const blocked = !isGroup && partner ? isEitherBlocked(partner.id) : false;

  // Check if user is still a member of the group
  const isNotMember = isGroup && currentUser
    ? !activeChat.members.some((member) => member.id === currentUser.id)
    : false;

  // Set picker dimensions based on screen size
  useEffect(() => {
    const updateDimensions = () => {
      const isMobile = window.innerWidth < 768;
      setPickerDimensions({
        width: isMobile ? 280 : 350,
        height: isMobile ? 350 : 400,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      // Only auto-focus on desktop to avoid mobile keyboard popup
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        textareaRef.current.focus();
      }
    }
  }, [activeChat?.id]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height (min 20px for single line, max 200px for ~8 lines)
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 200);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        emojiButtonRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  if (!activeChat) return null;

  if (blocked) {
    return (
      <div className="p-4 bg-background-primary border-t border-border text-center">
        <p className="text-font-subtle text-sm">
          You cannot send messages to this user
        </p>
      </div>
    );
  }

  if (isNotMember) {
    return (
      <div className="p-4 bg-background-primary border-t border-border text-center">
        <p className="text-font-subtle text-sm">
          You are no longer a member of this group
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const textarea = e.currentTarget.querySelector('textarea');
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content) return;

    const chatId = activeChat.id;
    if (!chatId) {
      createChat({
        userIds: activeChat.members.map((member) => member.id),
        content,
      });
      textarea.value = '';
      adjustTextareaHeight();
      return;
    }

    try {
      sendMessage(chatId, content);
    } catch (error) {
      console.error('Failed to send message', error);
    }

    textarea.value = '';
    adjustTextareaHeight();
    emitTypingStatus(chatId, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (but allow Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    adjustTextareaHeight();

    const chatId = activeChat.id;
    if (!chatId) return;

    const isTyping = textarea.value.trim().length > 0;
    emitTypingStatus(chatId, isTyping);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end);

    textarea.value = before + emojiData.emoji + after;

    // Move cursor after emoji
    const newPosition = start + emojiData.emoji.length;
    textarea.setSelectionRange(newPosition, newPosition);

    // Focus back to textarea
    textarea.focus();

    // Adjust height and trigger input event
    adjustTextareaHeight();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    // Keep emoji picker open for multiple selections
    // setShowEmojiPicker(false); // Commented out to keep picker open
  };

  return (
    <div className="relative p-4 bg-background-primary border-t border-border">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full mb-2 z-50 md:right-4 right-0"
        >
          <Suspense
            fallback={
              <div className="w-[280px] md:w-[350px] h-[350px] md:h-[400px] bg-input-background rounded-lg flex items-center justify-center text-font">
                Loading...
              </div>
            }
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={theme === 'dark' ? 'dark' : ('light' as any)}
              lazyLoadEmojis={true}
              searchDisabled={false}
              skinTonesDisabled={true}
              previewConfig={{
                showPreview: false,
              }}
              width={pickerDimensions.width}
              height={pickerDimensions.height}
            />
          </Suspense>
        </div>
      )}

      <form className="flex items-center space-x-2" onSubmit={handleSubmit}>
        <div className="flex space-x-2 items-center flex-1">
          <textarea
            ref={textareaRef}
            placeholder="Write a message..."
            rows={1}
            className="flex-1 bg-input-background hover:bg-input-background-hover text-font py-2 px-3 rounded-lg focus:outline focus:outline-2 focus:ring-primary-light resize-none overflow-y-auto min-h-[44px] max-h-[200px] message-input-textarea"
            style={{ scrollbarWidth: 'thin' }}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
          />
          <button
            ref={emojiButtonRef}
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={cx(
              'rounded-full flex items-center justify-center transition-all duration-200 w-[44px] h-[44px] group',
              showEmojiPicker
                ? 'bg-primary text-font-primary-contrast shadow-lg shadow-primary/20'
                : 'text-font-subtle hover:text-primary hover:bg-primary/10'
            )}
            aria-label="Insert emoji"
          >
            <IoHappyOutline
              className={cx(
                'w-7 h-7 transition-transform duration-200',
                'group-hover:rotate-12',
                showEmojiPicker && 'rotate-12'
              )}
            />
          </button>
        </div>
        <button
          type="submit"
          className="p-3 h-[44px] w-[44px] bg-primary hover:bg-primary/80 rounded-full transition-colors flex-shrink-0"
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
