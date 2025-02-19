import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cx from 'classix';
import { useAuthStore } from '../stores/auth.store';
import { Sidebar } from 'src/components/sidebar';
import { Chat } from 'src/components/chat';
import { ChatInfo } from 'src/components/chat-info';

export const ChatsPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isChatInfo, setIsChatInfo] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showChat, setShowChat] = useState(false);

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
        <Sidebar onChatSelect={() => setShowChat(true)} />
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
