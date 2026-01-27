import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Home, Search, Compass, Clapperboard, Send, Heart, PlusSquare, User, ChevronDown,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSearch, toggleTheme } from "../store/uiSlice";
import Badge from "../components/Badge";
import ThemeSwitch from "../components/ThemeSwitch";
import { useEffect, useState } from "react";
import { emit } from "../services/eventBus";
import SuggestList from "../features/suggest/SuggestList";
import CreatePostDialog from "../features/create/CreatePostDialog";
import Drawer from "../components/Drawer";
import SearchPanel from "../features/search/SearchPanel";
import NotificationPanel from "../features/notifications/NotificationPanel";
// Import nút Logout
import LogoutButton from "../components/LogoutButton"; 

function SideItem({ to, onClick, icon: Icon, label, end, badge, collapsed }) {
  const base = "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-800 dark:text-neutral-200 transition-all duration-200";
  
  if (to) {
    return (
      <NavLink to={to} end={end} className={({ isActive }) => `${base} ${isActive ? "font-bold" : ""}`} aria-label={label}>
        <div className="relative group-hover:scale-105 transition-transform">
            <Icon size={24} strokeWidth={2} />
            {badge ? <Badge className="absolute -top-1 -right-1" /> : null}
        </div>
        <span className={collapsed ? "hidden" : "hidden xl:inline"}>{label}</span>
      </NavLink>
    );
  }
  return (
    <button className={base} onClick={onClick} aria-label={label}>
      <div className="relative group-hover:scale-105 transition-transform">
        <Icon size={24} strokeWidth={2} />
        {badge ? <Badge className="absolute -top-1 -right-1" /> : null}
      </div>
      <span className={collapsed ? "hidden" : "hidden xl:inline"}>{label}</span>
    </button>
  );
}

export default function MainLayout({ keycloak }) {
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  // Logic xác định trang hiện tại
  const isDM = pathname.startsWith("/inbox");
  const isProfile = pathname.startsWith("/u/"); // Kiểm tra nếu là trang Profile

  const unreadDM = useSelector((s) => s.dm.unread);
  const unreadNotif = useSelector((s) => s.notifications.unread);
  
  const [openCreate, setOpenCreate] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);

  const isDrawerOpen = openSearch || openNotif;
  const collapsed = isDrawerOpen || isDM;

  // Giả lập realtime
  useEffect(() => {
    const t = setInterval(() => emit(Math.random() > 0.5 ? "notif:new" : "dm:new"), 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans">
      
      {/* --- 1. SIDEBAR --- */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col gap-2 p-3 border-r border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[72px] xl:w-[245px]"
        }`}
      >
        <div className={`px-3 py-5 mb-2 h-20 ${collapsed ? "flex justify-center" : ""}`}>
           {/* Logo logic */}
           {collapsed ? (
               <div className="p-2 hover:bg-gray-100 rounded-lg w-fit transition cursor-pointer">
                  {/* Icon Instagram nhỏ khi thu gọn */}
                  <svg aria-label="Instagram" className="" color="rgb(0, 0, 0)" fill="rgb(0, 0, 0)" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"></path></svg>
               </div>
           ) : (
               <h1 className="hidden xl:block text-2xl font-bold font-serif italic tracking-wider cursor-pointer mt-2">Instagram</h1>
           )}
        </div>

        <SideItem to="/" icon={Home} label="Trang chủ" end collapsed={collapsed} />
        <SideItem onClick={() => { setOpenSearch(!openSearch); setOpenNotif(false); }} icon={Search} label="Tìm kiếm" collapsed={collapsed} />
        <SideItem to="/explore" icon={Compass} label="Khám phá" collapsed={collapsed} />
        <SideItem to="/reels" icon={Clapperboard} label="Reels" collapsed={collapsed} />
        <SideItem to="/inbox" icon={Send} label="Tin nhắn" badge={unreadDM > 0} collapsed={collapsed} />
        <SideItem onClick={() => { setOpenNotif(!openNotif); setOpenSearch(false); }} icon={Heart} label="Thông báo" badge={unreadNotif > 0} collapsed={collapsed} />
        <SideItem onClick={() => setOpenCreate(true)} icon={PlusSquare} label="Tạo" collapsed={collapsed} />
        <SideItem to="/u/me" icon={User} label="Trang cá nhân" collapsed={collapsed} />

        {/* Phần Footer Sidebar */}
        <div className="mt-auto flex flex-col gap-1">
          <ThemeSwitch onToggle={() => dispatch(toggleTheme())} />
          
          <div className={collapsed ? "hidden" : "block px-2"}>
             <LogoutButton keycloak={keycloak} />
          </div>

          <div className={`flex items-center gap-3 px-3 py-3 mt-1 rounded-lg hover:bg-gray-100 cursor-pointer ${collapsed ? "justify-center" : ""}`}>
            <ChevronDown size={24} />
            <span className={collapsed ? "hidden" : "hidden xl:inline"}>Xem thêm</span>
          </div>
        </div>
      </aside>

      {/* --- 2. CONTENT AREA (Đã fix lỗi bị đè) --- */}
      <div 
        className={`transition-all duration-300 ${
            collapsed ? "ml-[72px]" : "ml-[72px] xl:ml-[245px]"
        }`}
      >
        {/* Trường hợp 1: Layout đặc biệt (Full width hoặc tự quản lý width) */}
        {/* Áp dụng cho: Tin nhắn (isDM) HOẶC Trang cá nhân (isProfile) */}
        {isDM || isProfile ? (
          <main className="w-full min-h-screen">
             <Outlet />
          </main>
        ) : (
          /* Trường hợp 2: Layout Trang chủ (Có Sidebar bên phải) */
          <div className="flex justify-center w-full">
            <main className="w-full max-w-[630px] pt-8 px-4">
               <Outlet />
            </main>
            
            {/* Chỉ hiện SuggestList ở màn hình lớn VÀ không phải profile/DM */}
            <aside className="hidden lg:block w-[320px] pl-16 pt-8">
              <div className="sticky top-8">
                <SuggestList />
                <div className="text-[12px] text-gray-400 mt-8 space-y-2">
                  <p>Giới thiệu • Trợ giúp • Báo chí • API • Việc làm</p>
                  <p>Quyền riêng tư • Điều khoản • Vị trí • Ngôn ngữ</p>
                  <p className="mt-4">© 2026 INSTAGRAM FROM META</p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* --- 3. BOTTOM BAR (Mobile) --- */}
      {pathname === "/" && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 z-50">
           <div className="grid grid-cols-5 py-3 text-center items-center">
             <NavLink to="/" className="flex justify-center"><Home size={24} /></NavLink>
             <button onClick={() => dispatch(toggleSearch(true))} className="flex justify-center"><Search size={24} /></button>
             <NavLink to="/reels" className="flex justify-center"><Clapperboard size={24} /></NavLink>
             <NavLink to="/inbox" className="flex justify-center"><Send size={24} /></NavLink>
             <NavLink to="/u/me" className="flex justify-center"><User size={24} /></NavLink>
           </div>
        </div>
      )}

      {/* --- 4. MODALS / DRAWERS --- */}
      <CreatePostDialog open={openCreate} onClose={() => setOpenCreate(false)} />
      <Drawer open={openSearch} onClose={() => setOpenSearch(false)} width={400} leftPx={75}><SearchPanel /></Drawer>
      <Drawer open={openNotif} onClose={() => setOpenNotif(false)} width={400} leftPx={75}><NotificationPanel /></Drawer>
    </div>
  );
}