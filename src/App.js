import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Các Page
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import ReelsPage from "./pages/ReelsPage";
import InboxPage from "./pages/InboxPage";
import CreatePage from "./pages/CreatePage";
import SavedPage from "./pages/SavedPage";
import PostDetailPage from "./pages/PostDetailPage";
import HashtagPage from "./pages/HashtagPage";
import ProfilePage from "./components/ProfilePage";
import FriendRequestDemo from "./pages/FriendRequestDemo";
import FriendsPage from "./pages/FriendsPage";
import StoriesPage from "./pages/StoriesPage";
import Login from "./pages/Login";
import AdminPage from "./pages/AdminPage";
import AdminUserDetailPage from "./pages/AdminUserDetailPage";
import { isAdminToken } from "./utils/auth";

// Chặn route khi chưa đăng nhập
function RequireAuth({ children }) {
  const tokens = useSelector((s) => s.auth.tokens);
  if (!tokens?.access_token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const tokens = useSelector((s) => s.auth.tokens);
  const isAuthed = !!tokens?.access_token;
  const admin = isAuthed && isAdminToken(tokens.access_token); // RBAC: có role ADMIN?

  return (
    <Routes>
      {/* Public — đã đăng nhập thì: ADMIN -> /admin, user thường -> / */}
      <Route
        path="/login"
        element={isAuthed ? <Navigate to={admin ? "/admin" : "/"} replace /> : <Login />}
      />
      {/* Đăng ký dùng trang của Keycloak — không còn route /register ở FE. */}

      {/* Trang quản trị — CHỈ cho role ADMIN. Chưa đăng nhập -> /login; không phải admin -> / */}
      <Route
        path="/admin"
        element={
          !isAuthed ? (
            <Navigate to="/login" replace />
          ) : admin ? (
            <AdminPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      {/* Chi tiết 1 người dùng (mở từ nút "Xem" ở bảng quản lý người dùng) — cùng RBAC như /admin */}
      <Route
        path="/admin/users/:userId"
        element={
          !isAuthed ? (
            <Navigate to="/login" replace />
          ) : admin ? (
            <AdminUserDetailPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Protected (user UI). ADMIN không dùng giao diện user -> đá sang /admin */}
      <Route
        path="/"
        element={
          <RequireAuth>
            {admin ? <Navigate to="/admin" replace /> : <MainLayout />}
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="reels" element={<ReelsPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="create" element={<CreatePage />} />
        <Route path="u/:userId" element={<ProfilePage />} />
        <Route path="friend" element={<FriendRequestDemo />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="stories" element={<StoriesPage />} />
        <Route path="post/:id" element={<PostDetailPage />} />
        <Route path="hashtag/:name" element={<HashtagPage />} />
        <Route path="saved" element={<SavedPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
