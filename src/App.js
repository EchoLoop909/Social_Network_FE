import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import ReelsPage from "./pages/ReelsPage";
import InboxPage from "./pages/InboxPage";
import CreatePage from "./pages/CreatePage";
import ProfilePage from "./pages/ProfilePage";
import SavedPage from "./pages/SavedPage";
import LoginPage from "./pages/Login";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchMe } from "./store/authSlice";
import RequireAuth from "./components/RequireAuth";
import OAuthGate from "./components/OAuthGate";

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <OAuthGate>
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          </OAuthGate>
        }
      >
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
