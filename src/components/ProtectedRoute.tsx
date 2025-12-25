import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('user' | 'seller' | 'admin')[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, profile, isLoading, initialize } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await initialize();
      } catch (e) {
        console.error("Init failed", e);
      } finally {
        if (mounted) setInitialized(true);
      }
    };

    init();

    // Safety timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (mounted && !initialized) {
        console.warn("Auth initialization timed out, forcing render");
        setInitialized(true);
      }
    }, 4000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [initialize]);

  // Show loading while initializing
  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirect to appropriate dashboard based on user role
    const rolePaths = {
      admin: '/admin',
      seller: '/seller',
      user: '/user',
    };
    return <Navigate to={rolePaths[profile.role]} replace />;
  }

  return <>{children}</>;
};
