import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import ReelsPage from "./pages/ReelsPage";
import InboxPage from "./pages/InboxPage";
import CreatePage from "./pages/CreatePage";
import SavedPage from "./pages/SavedPage";
import ProfilePage from "./components/ProfilePage";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchMe } from "./store/authSlice";

// Không cần RequireAuth hay OAuthGate phức tạp nữa vì index.js đã chặn rồi
// Nhưng vẫn có thể giữ lại RequireAuth để đảm bảo Redux có data

export default function App({ keycloak }) {
  const dispatch = useDispatch();
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    if (keycloak && keycloak.token) {
      // Gọi API lấy thông tin user từ Backend của bạn
      dispatch(fetchMe())
        .finally(() => {
           // Dù lấy được hay không cũng cho hiện App
           // (Nếu API lỗi thì vào giao diện sẽ thấy lỗi sau)
           setIsDataReady(true);
        });
    }
  }, [dispatch, keycloak]);

  // Hiện Loading trong lúc đang gọi API fetchMe
  if (!isDataReady) {
    return (
       <div className="flex items-center justify-center h-screen">
         <div className="text-xl">Đang tải dữ liệu người dùng...</div>
       </div>
    );
  }

  return (
    <Routes>
       {/* KHÔNG CẦN ROUTE /login ở đây.
          Nếu user muốn logout, chỉ cần gọi keycloak.logout() 
       */}
       
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