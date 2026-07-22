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
import ProfilePage from "./components/ProfilePage";
import FriendRequestDemo from "./pages/FriendRequestDemo";
import FriendsPage from "./pages/FriendsPage";
import StoriesPage from "./pages/StoriesPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPage from "./pages/AdminPage";
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
      <Route
        path="/register"
        element={isAuthed ? <Navigate to={admin ? "/admin" : "/"} replace /> : <Register />}
      />

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
        <Route path="saved" element={<SavedPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
