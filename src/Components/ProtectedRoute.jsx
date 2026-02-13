import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const role = (user.role || "").trim().toLowerCase();

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.map(r => r.toLowerCase()).includes(role)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
