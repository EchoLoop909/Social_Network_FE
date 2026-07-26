import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Home, Clapperboard, Send, Heart, PlusSquare, ChevronDown, Users,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme } from "../store/uiSlice";
import Badge from "../components/Badge";
import ThemeSwitch from "../components/ThemeSwitch";
import { useEffect, useState, useRef, useMemo } from "react";
import axios from 'axios';
import { emit } from "../services/eventBus";
import { connectChat } from "../services/chatSocket";
import { fetchUnread, pushNew } from "../store/notifSlice";
import CreatePostDialog from "../features/create/CreatePostDialog";
import Drawer from "../components/Drawer";
import SearchPanel from "../features/search/SearchPanel";
import NotificationPanel from "../features/notifications/NotificationPanel";
import { BE_URL } from "../config";
import { getStoredTokens, clearTokens, setAccountLockedMessage } from "../services/authApi";
import { logout } from "../store/authSlice";
import keycloak from "../services/keycloak";

function SideItem({ to, onClick, icon: Icon, label, end, badge, collapsed, customIcon }) {
  const base = "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-800 dark:text-neutral-200 transition-all duration-200";
  
  const content = (
    <>
      <div className="relative group-hover:scale-105 transition-transform">
          {customIcon ? customIcon : <Icon size={24} strokeWidth={2} />}
          {badge ? <Badge className="absolute -top-1 -right-1" /> : null}
      </div>
      <span className={collapsed ? "hidden" : "hidden xl:inline"}>{label}</span>
    </>
  );

  if (to) {
    return (
      <NavLink to={to} end={end} className={({ isActive }) => `${base} ${isActive ? "font-bold" : ""}`} aria-label={label}>
        {content}
      </NavLink>
    );
  }
  return (
    <button className={base} onClick={onClick} aria-label={label}>
      {content}
    </button>
  );
}

export default function MainLayout({ keycloak }) {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const [myInfo, setMyInfo] = useState(null);

  // id của mình (lấy từ JWT) để subscribe kênh thông báo riêng
  const meId = useMemo(() => {
    try {
      const t = getStoredTokens();
      if (!t?.access_token) return null;
      const b64 = t.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(b64))?.sub || null;
    } catch { return null; }
  }, []);
  const notifClientRef = useRef(null);
  const [notifConnected, setNotifConnected] = useState(false);

  const isDM = pathname.startsWith("/inbox");
  const isProfile = pathname.startsWith("/u/");
  const unreadDM = useSelector((s) => s.dm.unread);
  const unreadNotif = useSelector((s) => s.notifications.unread);
  
  const [openCreate, setOpenCreate] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);

  const collapsed = openSearch || openNotif || isDM;

  // Lấy thông tin cá nhân để hiện ảnh lên Sidebar
  useEffect(() => {
    const fetchMyInfo = async () => {
      const token = getStoredTokens()?.access_token;
      if (!token) return;
      try {
        const payload = JSON.parse(window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        const res = await axios.get(`${BE_URL}/auth/getuser?pageIdx=1&pageSize=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const found = res.data.Object.find(u => u.id === payload.sub);
        if (found) setMyInfo(found);
      } catch (e) { console.error("Sidebar fetch error:", e); }
    };
    fetchMyInfo();
  }, [pathname]); // Tải lại khi chuyển trang để đồng bộ

  // Tải số thông báo chưa đọc + mở WebSocket nghe kênh riêng của mình (chạy toàn app)
  useEffect(() => {
    if (!meId) return;
    dispatch(fetchUnread());
    notifClientRef.current = connectChat(() => setNotifConnected(true));
    return () => { try { notifClientRef.current?.deactivate(); } catch { /* ignore */ } };
  }, [meId, dispatch]);

  // Khi đã kết nối: subscribe /topic/notifications/{meId}; có noti mới -> đẩy vào store (badge + panel)
  useEffect(() => {
    if (!notifConnected || !meId || !notifClientRef.current) return;
    const sub = notifClientRef.current.subscribe(`/topic/notifications/${meId}`, (frame) => {
      try {
        const n = JSON.parse(frame.body);
        // Tín hiệu đồng bộ im lặng (vd bị hủy kết bạn): chỉ refresh, KHÔNG thêm vào chuông.
        if (n?.type === "FRIENDSHIP_SYNC") { emit("friendship:changed", n); return; }
        // Admin vừa khóa tài khoản này -> đá ra ngay lập tức, kèm thông báo hiện ở /login.
        if (n?.type === "ACCOUNT_SUSPENDED") {
          setAccountLockedMessage(n.message);
          clearTokens();
          dispatch(logout());
          keycloak.logout({ redirectUri: window.location.origin + "/login", logoutMethod: "POST" });
          return;
        }
        dispatch(pushNew(n));
        // Noti liên quan kết bạn -> báo các màn hình (Profile, Friends) tự nạp lại, khỏi F5.
        if (n?.type === "FOLLOW" || n?.type === "FOLLOW_REQUEST") emit("friendship:changed", n);
      } catch { /* ignore */ }
    });
    return () => { try { sub.unsubscribe(); } catch { /* ignore */ } };
  }, [notifConnected, meId, dispatch]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans">
      <aside className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col gap-2 p-3 border-r border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[72px] xl:w-[245px]"}`}>
        <div className={`px-3 py-5 mb-2 h-20 ${collapsed ? "flex justify-center" : ""}`}>
           {collapsed ? (
               <div className="p-2 hover:bg-gray-100 rounded-lg w-fit cursor-pointer" onClick={() => window.location.href='/'}>
                  <svg aria-label="Instagram" fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"></path></svg>
               </div>
           ) : (
               <h1 className="hidden xl:block text-1.75xl font-bold font-serif italic tracking-wider cursor-pointer mt-2" onClick={() => window.location.href='/'}>Social Network</h1>
           )}
        </div>

        <SideItem to="/" icon={Home} label="Trang chủ" end collapsed={collapsed} />
        <SideItem to="/reels" icon={Clapperboard} label="Reels" collapsed={collapsed} />
        <SideItem to="/inbox" icon={Send} label="Tin nhắn" badge={unreadDM > 0} collapsed={collapsed} />
        <SideItem to="/friends" icon={Users} label="Bạn bè" collapsed={collapsed} />
        <SideItem onClick={() => { setOpenNotif(!openNotif); setOpenSearch(false); }} icon={Heart} label="Thông báo" badge={unreadNotif > 0} collapsed={collapsed} />
        <SideItem onClick={() => setOpenCreate(true)} icon={PlusSquare} label="Tạo" collapsed={collapsed} />

        {/* TRANG CÁ NHÂN VỚI ẢNH THẬT */}
        <SideItem 
          to="/u/me" 
          label="Trang cá nhân" 
          collapsed={collapsed} 
          customIcon={
            (() => {
              // Avatar của chính user: có ảnh -> dùng ảnh; chưa có -> avatar chữ viết tắt theo tên/username
              const myName = (myInfo?.name && myInfo.name.trim()) || myInfo?.username || "U";
              const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(myName)}`;
              return (
                <div className="w-6 h-6 rounded-full border border-black dark:border-white overflow-hidden">
                  <img
                    src={myInfo?.photo || fallback}
                    className="w-full h-full object-cover"
                    alt="avatar"
                    onError={(e) => { e.target.src = fallback; }}
                  />
                </div>
              );
            })()
          }
        />

       
      </aside>

      <div className={`transition-all duration-300 ${collapsed ? "ml-[72px]" : "ml-[72px] xl:ml-[245px]"}`}>
        <main className="w-full min-h-screen">
            {/* Truyền hàm setMyInfo qua context để trang Profile có thể update Sidebar ngay lập tức */}
            <Outlet context={{ setMyInfo }} />
        </main>
      </div>

      <CreatePostDialog open={openCreate} onClose={() => setOpenCreate(false)} />
      <Drawer open={openSearch} onClose={() => setOpenSearch(false)} width={400} leftPx={75}><SearchPanel /></Drawer>
      <Drawer open={openNotif} onClose={() => setOpenNotif(false)} width={400} leftPx={75}><NotificationPanel onClose={() => setOpenNotif(false)} /></Drawer>
    </div>
  );
}