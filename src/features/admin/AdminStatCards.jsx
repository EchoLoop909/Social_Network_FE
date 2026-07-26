import { Users, UserCheck, UserX, Flag, Ban, Activity, FileText } from "lucide-react";
import { NotInDbTag } from "./adminUi";

function Card({ icon: Icon, tint, label, value, sub, na }) {
  return (
    <div className="flex-1 min-w-[180px] rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400">
        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-md ${tint}`}>
          <Icon size={14} />
        </span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
        {na ? <span className="text-gray-400">N/A</span> : value}
      </div>
      <div className="mt-1">{na ? <NotInDbTag /> : sub ? <span className="text-xs text-gray-400">{sub}</span> : null}</div>
    </div>
  );
}

export default function AdminStatCards({ stats, loading }) {
  const v = (n) => (loading || n == null ? "…" : n.toLocaleString("vi-VN"));
  return (
    <div className="flex flex-wrap gap-3">
      {/* Có trong DB: đếm trực tiếp từ bảng users / reports */}
      <Card
        icon={Users}
        tint="bg-blue-100 text-blue-600"
        label="Tổng người dùng"
        value={v(stats?.totalUsers)}
      />
      <Card
        icon={FileText}
        tint="bg-indigo-100 text-indigo-600"
        label="Tổng bài viết"
        value={v(stats?.totalPosts)}
      />
      <Card
        icon={UserCheck}
        tint="bg-green-100 text-green-600"
        label="Đang hoạt động (ACTIVE)"
        value={v(stats?.activeUsers)}
      />
      <Card
        icon={UserX}
        tint="bg-red-100 text-red-600"
        label="Bị khóa (SUSPENDED)"
        value={v(stats?.suspendedUsers)}
      />
      <Card
        icon={Flag}
        tint="bg-orange-100 text-orange-600"
        label="Báo cáo chờ duyệt"
        value={v(stats?.pendingReports)}
      />

      {/* KHÔNG có trong DB — giữ ô cho đúng layout ảnh mẫu, đánh dấu N/A.
          DAU cần tracking đăng nhập; Recent Bans (24h) cần mốc thời gian đổi
          trạng thái — cả hai đều không tồn tại trong CSDL hiện tại. */}
    </div>
  );
}
