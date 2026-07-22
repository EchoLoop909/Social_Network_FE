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
        <header className="h-16 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center gap-4 px-6">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white"
          >
            <ArrowLeft size={16} /> Về ứng dụng
          </button>
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              disabled
              placeholder="Tìm kiếm toàn cục (chưa hỗ trợ)"
              title="Chưa hỗ trợ — dùng ô tìm trong bảng người dùng"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-dashed border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-400 cursor-not-allowed"
            />
          </div>
          <div className="text-sm text-gray-500 dark:text-neutral-400">Quản trị viên</div>
        </header>

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
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Trung tâm quản lý người dùng
                </h1>
                <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">
                  Dữ liệu từ bảng <code>users</code> và <code>reports</code>. Số liệu chỉ
                  gồm các chỉ số đếm được từ CSDL.
                </p>
              </div>

              <AdminStatCards stats={stats} loading={loadingStats} />

              {/* Lưới chính: bảng user (trái) + moderation overview (phải) — như ảnh mẫu */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
                <AdminUserTable onChanged={loadStats} />
                <div className="space-y-6">
                  <AdminReportQueue compact onChanged={loadStats} />

                  {/* Khối "Nhật ký hoạt động / Audit Logs" trong ảnh — không có DB */}
                  <div className="rounded-xl border border-dashed border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
                    <div className="flex items-center gap-2 font-semibold text-gray-400">
                      <ShieldAlert size={16} /> Nhật ký quản trị
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Chưa hỗ trợ — CSDL/tài liệu hiện chưa có bảng lưu nhật ký hành động
                      quản trị (audit log).
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
