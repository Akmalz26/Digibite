import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const Index = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard based on role
    const paths = {
      admin: '/admin',
      seller: '/seller',
      user: '/user',
    };
    return <Navigate to={paths[user.role]} replace />;
  }

  return <Navigate to="/login" replace />;
};

export default Index;
