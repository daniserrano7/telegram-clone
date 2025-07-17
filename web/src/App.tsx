import { useEffect } from 'react';
import { useAppStore } from './stores/app.store';

export const App = ({ children }: Props) => {
  const { init, status, cleanUp } = useAppStore();

  useEffect(() => {
    init();

    return () => {
      cleanUp();
    };
  }, []);

  // TODO: Add a loading screen
  if (status === 'not-init' || status === 'initializing') {
    return <div>Loading...</div>;
  }

  // TODO: Add an error screen
  if (status === 'error') {
    return <div>Error</div>;
  }

  return (
    <div className="w-full h-screen text-font-primary bg-background-primary">
      {children}
    </div>
  );
};

interface Props {
  children: React.ReactNode;
}
