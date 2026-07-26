import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft, ShieldAlert } from "lucide-react";
import AdminSidebar from "../features/admin/AdminSidebar";
import AdminStatCards from "../features/admin/AdminStatCards";
import AdminUserTable from "../features/admin/AdminUserTable";
import AdminReportQueue from "../features/admin/AdminReportQueue";
import { getAdminStats } from "../services/adminApi";

// ============================================================================
// TRANG QUẢN TRỊ (/admin)
//
// Route nằm SAU RequireAuth (đã đăng nhập) nhưng CHƯA gắn kiểm tra vai trò admin
// vì entity User trong DB không có trường role. => TODO: khi BE mô hình hóa
// role (Keycloak realm role hoặc cột trên users) thì bổ sung gate ở đây.
//
// Mọi chức năng bám đúng DB: User (khóa/mở khóa theo docs/note.md phần D),
// Report/ReportReason (duyệt/từ chối). Các thành phần không có DB được giữ
// layout nhưng đánh dấu "Chưa hỗ trợ" / "N/A".
// ============================================================================
export default function AdminPage() {
  const navigate = useNavigate();
  const [section, setSection] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = useCallback(() => {
    setLoadingStats(true);
    getAdminStats()
      .then(setStats)
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-black">
      <AdminSidebar active={section} onSelect={setSection} />

      <div className="flex-1 min-w-0">
        {/* Header */}
      
        {/* Nội dung */}
        <main className="p-6 space-y-6">
          {section === "moderation" ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Kiểm duyệt nội dung
              </h1>
              <AdminReportQueue onChanged={loadStats} />
            </>
          ) : (
            <>
       

              <AdminStatCards stats={stats} loading={loadingStats} />

              {/* Lưới chính: bảng user (trái) + moderation overview (phải) — như ảnh mẫu */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
                <AdminUserTable onChanged={loadStats} />
                <div className="space-y-6">
                  <AdminReportQueue compact onChanged={loadStats} />

          
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
