import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export const ProtectedRoute = ({ children }: Props) => {
  const authStore = useAuthStore();

  if (!authStore.isLogged) {
    return <Navigate to="/login" />;
  }

  return children;
};

interface Props {
  children: React.ReactNode;
}
