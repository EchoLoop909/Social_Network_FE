import { Users, UserCheck, UserX, Flag, FileText } from "lucide-react";
import { StatCard } from "./adminUi";

export default function AdminStatCards({ stats, loading }) {
  const v = (n) => (loading || n == null ? "…" : n.toLocaleString("vi-VN"));
  return (
    <div className="flex flex-wrap gap-3">
      {/* Có trong DB: đếm trực tiếp từ bảng users / reports */}
      <StatCard icon={Users} tone="brand" label="Tổng người dùng" value={v(stats?.totalUsers)} />
      <StatCard icon={FileText} tone="brand" label="Tổng bài viết" value={v(stats?.totalPosts)} />
      <StatCard icon={UserCheck} tone="success" label="Đang hoạt động" value={v(stats?.activeUsers)} />
      <StatCard icon={UserX} tone="danger" label="Đã khoá" value={v(stats?.suspendedUsers)} />
      <StatCard icon={Flag} tone="warning" label="Báo cáo chờ xử lý" value={v(stats?.pendingReports)} />

      {/* KHÔNG có trong DB — giữ ô cho đúng layout ảnh mẫu, đánh dấu N/A.
          DAU cần tracking đăng nhập; Recent Bans (24h) cần mốc thời gian đổi
          trạng thái — cả hai đều không tồn tại trong CSDL hiện tại. */}
    </div>
  );
}
