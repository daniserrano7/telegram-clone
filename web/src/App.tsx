import { useEffect } from 'react';
import { useAuthStore } from './stores/auth.store';
import { useChatStore } from './stores/chat.store';
import { useThemeStore } from './stores/theme.store';

export const App = ({ children }: Props) => {
  const { theme, accent } = useThemeStore();
  useAuthStore((state) => state.init());

  useEffect(() => {
    document.body.classList.add(`${theme}`);
    document.body.classList.add(`accent-${accent}`);
  }, []);

  () => {
    useChatStore.getState().cleanUp();
  };

  return (
    <div className="w-full h-screen text-font-primary bg-background-primary">
      {children}
    </div>
  );
};

interface Props {
  children: React.ReactNode;
}
