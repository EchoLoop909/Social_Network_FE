import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getStoredTokens } from "../services/authApi";

export default function RequireAuth({ children }) {
  const user = useSelector((s) => s.auth.user);
  const tokens = useSelector((s) => s.auth.tokens) || getStoredTokens();
  const loc = useLocation();

  if (!tokens?.access_token) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }
  return children;
}
