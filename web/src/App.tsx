import { useEffect } from 'react';
import { useAppStore } from './stores/app.store';
import { useFontSizeStore } from './stores/font-size.store';

export const App = ({ children }: Props) => {
  const { init, status, cleanUp } = useAppStore();
  // Initialize font size store (this triggers CSS variable setup)
  useFontSizeStore();

  useEffect(() => {
    init();

    return () => {
      cleanUp();
    };
  }, []);

  // TODO: Add a loading screen
  if (status === 'not-init' || status === 'initializing') {
    return;
  }

  // TODO: Add an error screen
  if (status === 'error') {
    return <div>Error</div>;
  }

  return (
    <div className="w-full h-dvh text-font-primary bg-background-primary">
      {children}
    </div>
  );
};

interface Props {
  children: React.ReactNode;
}
