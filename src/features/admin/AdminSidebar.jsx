import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  ShieldCheck,
  Settings,
  BarChart3,
  ScrollText,
  Lock,
} from "lucide-react";
import LogoutButton from "../../components/LogoutButton";

// Nav bám DB: chỉ 2 mục CÓ dữ liệu thật (User + Report) là bật.
// Các mục còn lại giữ lại cho đúng layout ảnh mẫu nhưng DISABLE + gắn nhãn
// "Chưa hỗ trợ" vì DB/tài liệu chưa mô hình hóa (Safety, Global Settings,
// Analytics, Audit Logs).
const NAV = [
  { key: "dashboard", label: "Bảng điều khiển", icon: LayoutDashboard, enabled: true },
  { key: "users", label: "Quản lý người dùng", icon: Users, enabled: true },
  { key: "moderation", label: "Kiểm duyệt nội dung", icon: ShieldAlert, enabled: true },
  { key: "safety", label: "An toàn & Bảo mật", icon: ShieldCheck, enabled: false },
  { key: "settings", label: "Cài đặt hệ thống", icon: Settings, enabled: false },
  { key: "analytics", label: "Phân tích & Báo cáo", icon: BarChart3, enabled: false },
  { key: "audit", label: "Nhật ký quản trị", icon: ScrollText, enabled: false },
];

export default function AdminSidebar({ active, onSelect }) {
  return (
    <aside className="w-60 shrink-0 bg-[#1877f2] text-white flex flex-col min-h-screen">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/15">
        <div className="w-8 h-8 rounded-full bg-white text-[#1877f2] font-bold flex items-center justify-center">
          f
        </div>
        <span className="font-semibold text-[15px]">Trang Quản Trị</span>
      </div>

      <nav className="flex-1 py-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          const base =
            "w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors";
          if (!item.enabled) {
            return (
              <div
                key={item.key}
                title="Chưa hỗ trợ — chưa có trong DB/tài liệu"
                className={`${base} text-white/45 cursor-not-allowed`}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                <Lock size={13} className="opacity-70" />
              </div>
            );
          }
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`${base} ${
                isActive
                  ? "bg-white/15 font-semibold border-l-4 border-white"
                  : "hover:bg-white/10 border-l-4 border-transparent"
              }`}
            >
              <Icon size={18} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-white/15">
        <LogoutButton />
      </div>
      <div className="px-5 pb-4 text-[11px] text-white/60">
        Dữ liệu mô phỏng (mock). BE chưa có admin API.
      </div>
    </aside>
  );
}
