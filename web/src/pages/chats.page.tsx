import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import cx from 'classix';
import { useAuthStore } from '../stores/auth.store';
import { useChatStore } from '../stores/chat.store';
import { Sidebar } from 'src/components/sidebar';
import { Chat } from 'src/components/chat';
import { ChatInfo } from 'src/components/chat-info';

export const ChatsPage = () => {
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId?: string }>();
  const user = useAuthStore((state) => state.user);
  const getActiveChatFromUrl = useChatStore((state) => state.getActiveChatFromUrl);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const fetchChat = useChatStore((state) => state.fetchChat);
  const activeChat = useChatStore((state) => state.activeChat);
  
  const [isChatInfo, setIsChatInfo] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showChat, setShowChat] = useState(false);

  // Sync active chat with URL params
  useEffect(() => {
    const chatFromUrl = getActiveChatFromUrl(chatId);
    
    if (chatId && !chatFromUrl) {
      // Chat ID in URL but not found in store - try to fetch it
      const chatIdNum = parseInt(chatId, 10);
      if (!isNaN(chatIdNum)) {
        fetchChat(chatIdNum);
      }
    } else if (chatFromUrl) {
      // Update active chat from URL
      if (!activeChat || activeChat.id !== chatFromUrl.id) {
        setActiveChat(chatFromUrl);
      }
      setShowChat(true);
    } else if (!chatId && activeChat) {
      // No chat ID in URL but we have active chat - clear it
      setActiveChat(null);
      setShowChat(false);
    }
  }, [chatId, getActiveChatFromUrl, fetchChat, setActiveChat, activeChat]);

  // Navigate when active chat gets an ID (new chat created)
  useEffect(() => {
    if (activeChat?.id && !chatId) {
      navigate(`/chats/${activeChat.id}`, { replace: true });
    }
  }, [activeChat?.id, chatId, navigate]);

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
              setShowChat(true);
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
          onBackClick={() => setShowChat(false)}
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
    </main>
  );
};
