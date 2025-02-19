import { useChatStore } from './stores/chat.store';
import { useThemeStore } from './stores/theme.store';
import { useEffect } from 'react';
export const App = ({ children }: Props) => {
  const { theme } = useThemeStore();

  useEffect(() => {
    useChatStore.getState().cleanUp();
  }, []);

  return (
    <div
      className={`w-full ${theme === 'dark' ? 'dark' : ''} h-screen text-font-primary bg-background-primary`}
    >
      {children}
    </div>
  );
};

interface Props {
  children: React.ReactNode;
}
