import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";
import { getStoredTokens, clearTokens, logoutApi } from "../services/authApi";

const LogoutButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const tokens = getStoredTokens();
    // Thu hồi phiên tại Keycloak (không chặn nếu lỗi)
    if (tokens?.refresh_token) {
      await logoutApi(tokens.refresh_token);
    }
    clearTokens();
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded w-full"
    >
      Đăng xuất
    </button>
  );
};

export default LogoutButton;
