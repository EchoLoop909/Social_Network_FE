import React from "react";
import { logoutFromKeycloak } from "../services/authApi";

// Nút đăng xuất cho TRANG ADMIN — độc lập với nút ở HomePage.js (không dùng chung hàm).
//
// Đúng luồng Authorization Code Flow (RP-Initiated Logout, OIDC): chỉ gọi
// keycloak.logout() để điều hướng trình duyệt tới endpoint
// /realms/<realm>/protocol/openid-connect/logout của Keycloak — nơi DUY NHẤT thực sự
// huỷ phiên SSO (server-side). KHÔNG dispatch(logout())/clearTokens() ở đây: làm vậy
// đổi state Redux ngay lập tức khiến route guard (App.js) chuyển sang <Login/> trong
// lúc trang vẫn chưa kịp điều hướng thật sự, và Login.js lại tự gọi keycloak.login()
// — 2 lệnh điều hướng trình duyệt chạy gần như cùng lúc khiến cái sau huỷ cái trước
// (logout() bị abort giữa chừng, tài khoản coi như CHƯA đăng xuất thật ở Keycloak).
// Khi trình duyệt thực sự rời trang (hoặc quay lại /login sau khi Keycloak logout xong),
// index.js sẽ tự chạy lại keycloak.init({onLoad:"check-sso"}) và đồng bộ lại state đúng.
const LogoutButton = () => {
  const handleLogout = () => {
    logoutFromKeycloak();
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-neutral-800 hover:bg-black text-white font-bold py-2 px-4 rounded w-full"
    >
      Đăng xuất
    </button>
  );
};

export default LogoutButton;
