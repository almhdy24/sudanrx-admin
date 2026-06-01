import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) return <div className="section">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}
