import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";

// 1. Import Action của Redux
import { setCredentials } from "./store/authSlice";

// 2. Import các Page
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import ReelsPage from "./pages/ReelsPage";
import InboxPage from "./pages/InboxPage";
import CreatePage from "./pages/CreatePage";
import SavedPage from "./pages/SavedPage";
import ProfilePage from "./components/ProfilePage";

export default function App({ keycloak }) {
  const dispatch = useDispatch();

  const [isDataReady, setIsDataReady] = useState(false);
  const isRun = useRef(false);

  // URL API Backend
  const BACKEND_API_URL = "http://localhost:1234/auth/public/api/register";

  useEffect(() => {
    if (isRun.current) return;
    isRun.current = true;

    if (keycloak && keycloak.token) {
      // --- [MỚI] LƯU TOKEN VÀO LOCAL STORAGE ---
      // Lưu access token để dùng gọi API
      localStorage.setItem("token", keycloak.token);
      
      // Lưu refresh token (nếu cần dùng để lấy token mới thủ công)
      if (keycloak.refreshToken) {
        localStorage.setItem("refresh_token", keycloak.refreshToken);
      }
      
      console.log("Đã lưu Token vào LocalStorage!");
      // ------------------------------------------

      handleSyncUser(keycloak.token);
    } else {
      setIsDataReady(true);
    }
  }, [keycloak]);

  const handleSyncUser = async (token) => {
    try {
      console.log("Đang gọi API Register (POST)...");

      // Payload mapping
      const payload = {
        username: keycloak.tokenParsed?.preferred_username || "",
        email: keycloak.tokenParsed?.email || "",
        firstname: keycloak.tokenParsed?.given_name || "",
        name: keycloak.tokenParsed?.given_name || "",
        lastname: keycloak.tokenParsed?.family_name || "",
        surname: keycloak.tokenParsed?.family_name || "",
        description: "New user from Keycloak",
        photo: "asdasd.jpg", 
        status: "1a2b3c4d-0001-0000-0000-000000000001"
      };

      // Gọi POST
      const response = await axios.post(BACKEND_API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Đăng ký/Sync thành công:", response.data);

      if (response.data) {
        // Lưu thông tin user vào Redux
        dispatch(setCredentials(response.data));
      }

    } catch (error) {
      console.warn("API Register trả về lỗi (có thể User đã tồn tại):", error.response?.status);
    } finally {
      setIsDataReady(true);
    }
  };

  if (!isDataReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold">Đang tải dữ liệu người dùng...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout keycloak={keycloak} />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="reels" element={<ReelsPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="create" element={<CreatePage />} />
        <Route path="u/:username" element={<ProfilePage />} />
        <Route path="saved" element={<SavedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}