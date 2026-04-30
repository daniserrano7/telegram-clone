import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import cx from 'classix';
import { useAuthStore } from '../stores/auth.store';
import { useChatStore } from '../stores/chat.store';
import { Sidebar } from 'src/components/sidebar';
import { Chat } from 'src/components/chat';
import { ChatInfo } from 'src/components/chat-info';
import { NotificationPermissionRequest } from '../components/notification-permission-request';

export const ChatsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams<{ chatId?: string }>();
  const user = useAuthStore((state) => state.user);
  const getActiveChatFromUrl = useChatStore(
    (state) => state.getActiveChatFromUrl
  );
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const fetchChat = useChatStore((state) => state.fetchChat);
  const activeChat = useChatStore((state) => state.activeChat);
  const chats = useChatStore((state) => state.chats);

  const [isChatInfo, setIsChatInfo] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // On mobile, brand-new direct chats may exist only in client state until the
  // first message creates a persisted chat id. Those still need to open.
  const showChat = Boolean(chatId) || Boolean(activeChat);

  // Sync active chat with URL params
  useEffect(() => {
    const chatFromUrl = getActiveChatFromUrl(chatId);
    const currentActiveChat = useChatStore.getState().activeChat;

    if (chatId && !chatFromUrl) {
      // Chat ID in URL but not found in store - try to fetch it
      const chatIdNum = parseInt(chatId, 10);
      if (!isNaN(chatIdNum)) {
        fetchChat(chatIdNum);
      }
    } else if (chatFromUrl) {
      // Update active chat from URL
      if (!currentActiveChat || currentActiveChat.id !== chatFromUrl.id) {
        setActiveChat(chatFromUrl);
      }
    } else if (!chatId && currentActiveChat && currentActiveChat.id) {
      // No chat ID in URL but we have active chat with ID
      // On mobile, clear it to show chat list. On desktop, keep it.
      if (isMobileView) {
        setActiveChat(null);
      }
    }
  }, [chatId, chats, getActiveChatFromUrl, fetchChat, setActiveChat, isMobileView]);

  // Navigate when active chat gets an ID (new chat created)
  // But only if we're not navigating back from a chat (check location state)
  useEffect(() => {
    // Don't auto-navigate if we just navigated back to chat list
    const isNavigatingBack = location.state?.fromChatBack === true;
    
    if (activeChat?.id && !chatId && activeChat.id > 0 && !isNavigatingBack) {
      // Only auto-navigate if we're on the base /chats route with a newly created chat
      navigate(`/chats/${activeChat.id}`, { replace: true });
    }
  }, [activeChat?.id, chatId, navigate, location.state]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    console.error('User not logged in');
    navigate('/login');
    return null;
  }

  return (
    <main className="w-full h-dvh bg-background-primary flex overflow-hidden">
      <div
        className={cx(
          'md:w-[260px] w-full flex-shrink-0 h-dvh',
          isMobileView && showChat ? 'hidden' : 'block'
        )}
      >
        <Sidebar
          onChatSelect={(chatId?: number) => {
            if (chatId) {
              navigate(`/chats/${chatId}`);
            } else {
              // For new chats, navigate to base chats route
              navigate('/chats');
            }
          }}
        />
      </div>
      <div
        className={cx(
          'flex-1 h-full',
          isMobileView && !showChat ? 'hidden' : 'block'
        )}
      >
        <Chat
          toggleChatInfo={() => setIsChatInfo((prev) => !prev)}
          onBackClick={() => {
            setActiveChat(null);
            // Navigate to chat list with state indicating we're going back
            navigate('/chats', { 
              state: { fromChatBack: true },
              replace: true
            });
          }}
          showBackButton={isMobileView}
        />
      </div>
      <div
        className={cx(
          'bg-background-primary border-l border-border overflow-hidden',
          'transition-[width] duration-200 ease-in-out',
          'hidden lg:block h-full',
          isChatInfo ? 'w-[360px]' : 'w-0'
        )}
      >
        <div className="w-[360px]">
          <ChatInfo />
        </div>
      </div>

      {/* Notification Permission Request */}
      <NotificationPermissionRequest />
    </main>
  );
};
