import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Search, Bell } from "lucide-react";
import AdminSidebar from "../features/admin/AdminSidebar";
import AdminStatCards from "../features/admin/AdminStatCards";
import AdminUserTable from "../features/admin/AdminUserTable";
import AdminReportQueue from "../features/admin/AdminReportQueue";
import AdminPostsTable from "../features/admin/AdminPostsTable";
import { getAdminStats } from "../services/adminApi";
import { decodeToken } from "../utils/auth";
import { useNotificationSocket } from "../hooks/useNotificationSocket";
import Drawer from "../components/Drawer";
import NotificationPanel from "../features/notifications/NotificationPanel";

// ============================================================================
// TRANG QUẢN TRỊ (/admin) — giao diện "Vela"
//
// Route nằm SAU RequireAuth (đã đăng nhập, role ADMIN) — xem App.js.
// Mọi API vẫn là API thật đã nối trước đó (adminApi.js) — file này CHỈ đổi
// giao diện + thêm tab mới "Bài viết" dựa trên API thật sẵn có.
// ============================================================================
export default function AdminPage() {
  const tokens = useSelector((s) => s.auth.tokens);
  const [tab, setTab] = useState("users");
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [headerSearch, setHeaderSearch] = useState("");
  const [usersSearch, setUsersSearch] = useState("");
  const [openNotif, setOpenNotif] = useState(false);

  // Kết nối WebSocket kênh thông báo riêng của admin (dùng chung engine với user).
  useNotificationSocket();
  const unreadNotif = useSelector((s) => s.notifications.unread);

  const loadStats = useCallback(() => {
    setLoadingStats(true);
    getAdminStats()
      .then(setStats)
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const admin = useMemo(() => decodeToken(tokens?.access_token), [tokens]);
  const adminName = admin?.name || admin?.preferred_username || "Admin";

  const submitHeaderSearch = (e) => {
    e.preventDefault();
    setUsersSearch(headerSearch);
    setTab("users");
  };

  return (
    <div className="flex min-h-screen bg-vela-bg">
      <AdminSidebar active={tab} onSelect={setTab} />

      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-vela-border flex items-center gap-4 px-6">
          <form onSubmit={submitHeaderSearch} className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Tìm nhanh người dùng…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-vela-border bg-vela-bg/60 focus:outline-none focus:ring-2 focus:ring-vela-brand/40 focus:border-vela-brand"
            />
          </form>

          <div className="flex-1" />

          <button
            onClick={() => setOpenNotif(true)}
            title="Thông báo"
            className="relative p-2 rounded-md hover:bg-vela-bg text-neutral-500 hover:text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-vela-brand/40"
          >
            <Bell size={18} />
            {unreadNotif > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-vela-danger border-2 border-white" />
            )}
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-vela-border">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-vela-brand text-white font-display font-semibold text-sm">
              {adminName.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-sm font-medium text-neutral-800 hidden sm:inline">{adminName}</span>
          </div>
        </header>

        {/* Nội dung */}
        <main className="p-6 space-y-6">
          {tab === "users" && (
            <>
              <AdminStatCards stats={stats} loading={loadingStats} />
              <AdminUserTable onChanged={loadStats} initialSearch={usersSearch} />
            </>
          )}
          {tab === "posts" && <AdminPostsTable />}
          {tab === "reports" && <AdminReportQueue onChanged={loadStats} />}
        </main>
      </div>

      <Drawer open={openNotif} onClose={() => setOpenNotif(false)} width={400} leftPx={0}>
        <NotificationPanel
          onClose={() => setOpenNotif(false)}
          onReportClick={() => { setTab("reports"); setOpenNotif(false); }}
        />
      </Drawer>
    </div>
  );
}
