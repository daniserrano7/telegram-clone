import { useAuthStore } from './stores/auth.store';
import { useChatStore } from './stores/chat.store';
import { useThemeStore } from './stores/theme.store';

export const App = ({ children }: Props) => {
  const { theme } = useThemeStore();
  useAuthStore((state) => state.init());

  () => {
    useChatStore.getState().cleanUp();
  };

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
