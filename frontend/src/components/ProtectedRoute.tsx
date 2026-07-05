import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../lib/roles";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allow?: (role: Role) => boolean;
}

export function ProtectedRoute({ children, allow }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow(user.role)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
