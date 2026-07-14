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
import Login from "./pages/Login";
import Register from "./pages/Register";

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

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthed ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthed ? <Navigate to="/" replace /> : <Register />}
      />

      {/* Protected */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="reels" element={<ReelsPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="create" element={<CreatePage />} />
        <Route path="u/:username" element={<ProfilePage />} />
        <Route path="friend" element={<FriendRequestDemo />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="post/:id" element={<PostDetailPage />} />
        <Route path="saved" element={<SavedPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
