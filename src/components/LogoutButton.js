import React from "react";
import { useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { clearTokens } from "../services/authApi";
import keycloak from "../services/keycloak";

// Nút đăng xuất cho TRANG ADMIN — độc lập với nút ở HomePage.js (không dùng chung hàm).
//
// Đúng luồng Authorization Code Flow (RP-Initiated Logout, OIDC):
// 1. Xoá state phía app trước (localStorage + Redux) — để UI không còn coi là đã đăng nhập
//    ngay cả khi bước 2 bị gián đoạn giữa chừng.
// 2. keycloak.logout() điều hướng trình duyệt tới endpoint
//    /realms/<realm>/protocol/openid-connect/logout của Keycloak — nơi DUY NHẤT thực sự
//    huỷ phiên SSO (server-side). logoutMethod: "POST" để gửi id_token_hint qua form ẩn
//    thay vì nhét vào query string (an toàn hơn, tránh URL quá dài).
const LogoutButton = () => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    clearTokens();
    dispatch(logout());
    keycloak.logout({
      redirectUri: window.location.origin + "/login",
      logoutMethod: "POST",
    });
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
