import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-base">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
