import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "@/App";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user } = useContext(UserContext);

  // Jika tidak ada user, redirect ke login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Jika requireAdmin true, cek apakah user adalah admin
  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
