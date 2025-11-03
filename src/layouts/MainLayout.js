import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Compass,
  Clapperboard,
  Send,
  Heart,
  PlusSquare,
  User,
  ChevronDown,
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

function SideItem({ to, onClick, icon: Icon, label, end, badge, collapsed }) {
  const base =
    "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-800 dark:text-neutral-200";
  if (to) {
    return (
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `${base} ${isActive ? "font-semibold" : ""}`
        }
        aria-label={label}
      >
        <div className="relative">
          <Icon size={24} />
          {badge ? <Badge className="absolute -top-1 -right-1" /> : null}
        </div>
        <span className={collapsed ? "hidden" : "hidden xl:inline"}>
          {label}
        </span>
      </NavLink>
    );
  }
  return (
    <button className={base} onClick={onClick} aria-label={label}>
      <div className="relative">
        <Icon size={24} />
        {badge ? <Badge className="absolute -top-1 -right-1" /> : null}
      </div>
      <span className={collapsed ? "hidden" : "hidden xl:inline"}>{label}</span>
    </button>
  );
}

export default function MainLayout() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  const isDM = pathname.startsWith("/inbox");
  const unreadDM = useSelector((s) => s.dm.unread);
  const unreadNotif = useSelector((s) => s.notifications.unread);
  const [openCreate, setOpenCreate] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);

  const isDrawerOpen = openSearch || openNotif;
  const collapsed = isDrawerOpen || isDM;
  // giả lập realtime
  useEffect(() => {
    const t = setInterval(
      () => emit(Math.random() > 0.5 ? "notif:new" : "dm:new"),
      15000
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Sidebar: cố định sát cạnh trái */}
      <aside
        className={`fixed left-0 top-0 bottom-0 ${
          collapsed ? "w-20" : "w-20 xl:w-72"
        } p-3 border-r border-gray-200 dark:border-neutral-800 flex flex-col gap-2 bg-white dark:bg-neutral-900 transition-all duration-200`}
      >
        <div
          className={`px-3 py-4 text-2xl font-semibold ${
            collapsed ? "hidden" : "hidden xl:block"
          }`}
        >
          Instagram
        </div>

        <SideItem
          to="/"
          icon={Home}
          label="Trang chủ"
          end
          collapsed={collapsed}
        />
        <SideItem
          onClick={() => {
            setOpenSearch(!openSearch);
            setOpenNotif(false);
          }}
          icon={Search}
          label="Tìm kiếm"
          collapsed={collapsed}
        />
        <SideItem
          to="/explore"
          icon={Compass}
          label="Khám phá"
          collapsed={collapsed}
        />
        <SideItem
          to="/reels"
          icon={Clapperboard}
          label="Reels"
          collapsed={collapsed}
        />
        <SideItem
          to="/inbox"
          icon={Send}
          label="Tin nhắn"
          badge={unreadDM > 0}
          collapsed={collapsed}
        />
        <SideItem
          onClick={() => {
            setOpenNotif(!openNotif);
            setOpenSearch(false);
          }}
          icon={Heart}
          label="Thông báo"
          badge={unreadNotif > 0}
          collapsed={collapsed}
        />
        <SideItem
          onClick={() => setOpenCreate(true)}
          icon={PlusSquare}
          label="Tạo"
          collapsed={collapsed}
        />
        <SideItem
          to="/u/me"
          icon={User}
          label="Trang cá nhân"
          collapsed={collapsed}
        />

        <div className="mt-auto">
          <ThemeSwitch onToggle={() => dispatch(toggleTheme())} />
          <div className="hidden xl:flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400 mt-3">
            <ChevronDown size={16} />
            <span>Xem thêm</span>
          </div>
          <div className="hidden xl:block text-xs text-gray-400 dark:text-neutral-500 mt-2">
            © 2025 INSTAGRAM FROM META
          </div>
        </div>
      </aside>

      {/* Content: đẩy sang phải đúng theo bề rộng sidebar */}
      <div className={collapsed ? "pl-20" : "pl-20 xl:pl-72"}>
        {isDM ? (
          <main className="min-w-0 px-4 py-4">
            <Outlet />
          </main>
        ) : (
          <div className="max-w-[1150px] mx-auto flex pr-6">
            <main className="flex-1 min-w-0">
              <div className="max-w-[630px] mx-auto">
                <Outlet />
              </div>
            </main>
            <aside className="hidden lg:block w-[320px] p-6">
              <div className="sticky top-0">
                <SuggestList />
                <div className="text-[12px] text-gray-400 mt-6 space-y-1">
                  <div>Giới thiệu • Trợ giúp • Báo chí • API • Việc làm</div>
                  <div>Quyền riêng tư • Điều khoản • Vị trí • Ngôn ngữ</div>
                  <div className="mt-2">Meta đã xác minh</div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* BOTTOM BAR (mobile) */}
      {pathname === "/" && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800">
          <div className="grid grid-cols-5 py-2 text-center">
            <NavLink to="/">
              <Home className="mx-auto" />
            </NavLink>
            <button onClick={() => dispatch(toggleSearch(true))}>
              <Search className="mx-auto" />
            </button>
            <NavLink to="/reels">
              <Clapperboard className="mx-auto" />
            </NavLink>
            <NavLink to="/inbox" className="relative">
              <Send className="mx-auto" />
              {unreadDM ? <Badge className="absolute top-0 right-4" /> : null}
            </NavLink>
            <NavLink to="/u/me">
              <User className="mx-auto" />
            </NavLink>
          </div>
        </div>
      )}

      {/* Modal tạo bài viết */}
      <CreatePostDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
      />

      {/* Drawer Tìm kiếm */}
      <Drawer
        open={openSearch}
        onClose={() => setOpenSearch(false)}
        width={400}
        leftPx={80}
      >
        <SearchPanel />
      </Drawer>

      {/* Drawer Thông báo */}
      <Drawer
        open={openNotif}
        onClose={() => setOpenNotif(false)}
        width={400}
        leftPx={80}
      >
        <NotificationPanel />
      </Drawer>
    </div>
  );
}
