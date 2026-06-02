import { Navigate } from "react-router-dom";
import useContextPro from "../hooks/useContextPro";
import type { UserRole } from "../types/types";
import { getDefaultRouteForRole, hasAnyRole } from "../utils/roles";

interface Props {
  role: UserRole | UserRole[];
  children: React.ReactNode;
}

function ProtectedRoute({ role, children }: Props) {
  const {
    state: { user, isLoading },
  } = useContextPro();

  const allowedRoles = Array.isArray(role) ? role : [role];

  if (isLoading) {
    return null;
  }

  if (!user?.role) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAnyRole(user, allowedRoles)) {
    return <Navigate to={getDefaultRouteForRole(user)} replace />;
  }

  return children;
}

export default ProtectedRoute;
