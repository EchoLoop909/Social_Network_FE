import { useState } from "react";
import {
  Users,
  FileText,
  ShieldAlert,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import LogoutButton from "../../components/LogoutButton";

const NAV = [
  { key: "users", label: "Người dùng", icon: Users },
  { key: "posts", label: "Bài viết", icon: FileText },
  { key: "reports", label: "Báo cáo", icon: ShieldAlert },
];

export default function AdminSidebar({ active, onSelect }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-60"
      } shrink-0 bg-vela-panel text-white flex flex-col sticky top-0 h-screen overflow-y-auto transition-[width] duration-200`}
    >
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
        {!collapsed && <span className="font-display font-semibold text-[15px] tracking-wide">ADMIN</span>}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Mở rộng" : "Thu gọn"}
          className={`p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white ${collapsed ? "mx-auto" : "ml-auto"}`}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              title={item.label}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                isActive
                  ? "bg-white/10 font-semibold border-l-4 border-vela-brand text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <Icon size={18} />
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className={`px-4 py-3 border-t border-white/10 ${collapsed ? "px-2" : ""}`}>
        {collapsed ? (
          <div className="[&_button]:px-0 [&_button]:text-xs">
            <LogoutButton />
          </div>
        ) : (
          <LogoutButton />
        )}
      </div>
    </aside>
  );
}
