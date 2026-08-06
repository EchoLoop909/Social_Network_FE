import { useCallback, useEffect, useState } from "react";
import { Search, Lock, Unlock, Eye, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getAdminUsers,
  suspendUser,
  activateUser,
  getUserPostCount,
} from "../../services/adminApi";
import { getFriends } from "../../services/followershipApi";
import { USER_STATUS } from "../../services/data/adminSeed";
import { VelaStatusPill, VELA_USER_STATUS_META, TableShell, Avatar, fmtDate } from "./adminUi";

const PAGE_SIZE = 8;

export default function AdminUserTable({ onChanged, initialSearch = "" }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // filters (bám DB): status enum + search + sort theo creationDate
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState("newest");
  const [pageIdx, setPageIdx] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Số bài viết / bạn bè hiển thị theo dòng — không có sẵn trong /auth/getuser nên
  // nạp riêng cho từng user đang hiển thị (8 dòng/trang): bài viết qua
  // GET /post/GetlistPost?pageSize=1 (chỉ lấy totalElements), bạn bè qua
  // GET /friendship/friends (đếm số quan hệ ACCEPTED, không phải "follower" bất
  // đối xứng vì DB chỉ có mô hình bạn bè 2 chiều).
  const [counts, setCounts] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    setCounts({});
    getAdminUsers({ status, search, sort, pageIdx, pageSize: PAGE_SIZE })
      .then((res) => {
        setRows(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      })
      .finally(() => setLoading(false));
  }, [status, search, sort, pageIdx]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (rows.length === 0) return;
    let cancelled = false;
    rows.forEach((u) => {
      Promise.all([getUserPostCount(u.id), getFriends(u.id)]).then(([posts, friends]) => {
        if (!cancelled) {
          setCounts((c) => ({ ...c, [u.id]: { posts, friends: friends.length } }));
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [rows]);

  // reset về trang 1 khi đổi bộ lọc
  useEffect(() => {
    setPageIdx(1);
  }, [status, search, sort]);

  const doSuspend = async (u) => {
    setBusyId(u.id);
    try {
      await suspendUser(u.id);
      load();
      onChanged && onChanged();
    } finally {
      setBusyId(null);
    }
  };
  const doActivate = async (u) => {
    setBusyId(u.id);
    try {
      await activateUser(u.id);
      load();
      onChanged && onChanged();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <TableShell>
      {/* Thanh công cụ: tìm kiếm + lọc */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-vela-border">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, username, email"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-vela-border bg-vela-bg/60 focus:outline-none focus:ring-2 focus:ring-vela-brand/40 focus:border-vela-brand"
          />
        </div>

        {/* Lọc theo Status — đúng 3 giá trị UserStatus */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="py-2 px-3 text-sm rounded-md border border-vela-border bg-white focus:outline-none focus:ring-2 focus:ring-vela-brand/40"
        >
          <option value="">Tất cả trạng thái</option>
          <option value={USER_STATUS.ACTIVE}>Hoạt động</option>
          <option value={USER_STATUS.SUSPENDED}>Đã khoá</option>
          <option value={USER_STATUS.PENDING_ACTIVATION}>Tạm khoá</option>
        </select>

        {/* Sắp xếp theo ngày đăng ký (creationDate) */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="py-2 px-3 text-sm rounded-md border border-vela-border bg-white focus:outline-none focus:ring-2 focus:ring-vela-brand/40"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
        </select>
      </div>

      {/* Bảng */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-vela-border bg-vela-bg/40">
              <th className="py-3 px-4 font-medium">Người dùng</th>
              <th className="py-3 px-4 font-medium">Ngày tham gia</th>
              <th className="py-3 px-4 font-medium">Trạng thái</th>
              <th className="py-3 px-4 font-medium">Bài viết</th>
              <th className="py-3 px-4 font-medium">Bạn bè</th>
              <th className="py-3 px-4 font-medium">Riêng tư</th>
              <th className="py-3 px-4 font-medium text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-neutral-400">
                  Đang tải…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-neutral-400">
                  Không có người dùng nào khớp bộ lọc.
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const isSuspended = u.status === USER_STATUS.SUSPENDED;
                return (
                  <tr key={u.id} className="border-b border-vela-border/60 hover:bg-vela-bg/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.photo} name={u.name || u.username} size={36} />
                        <div className="min-w-0">
                          <div className="font-medium text-neutral-900 flex items-center gap-1">
                            <span className="truncate">{u.name}</span>
                            {u.isChecked && (
                              <BadgeCheck size={14} className="text-vela-brand shrink-0" titleAccess="Đã xác minh" />
                            )}
                          </div>
                          <div className="text-xs text-neutral-400 font-mono truncate">{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-mono text-xs">{fmtDate(u.creationDate)}</td>
                    <td className="py-3 px-4">
                      <VelaStatusPill meta={VELA_USER_STATUS_META} value={u.status} />
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-mono">
                      {counts[u.id] ? counts[u.id].posts.toLocaleString("vi-VN") : "…"}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-mono">
                      {counts[u.id] ? counts[u.id].friends.toLocaleString("vi-VN") : "…"}
                    </td>
                    <td className="py-3 px-4 text-neutral-600">{u.isPrivate ? "Riêng tư" : "Công khai"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          title="Xem hồ sơ"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border border-vela-border hover:bg-vela-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-vela-brand/40"
                        >
                          <Eye size={14} /> Xem
                        </button>
                        {isSuspended ? (
                          <button
                            disabled={busyId === u.id}
                            onClick={() => doActivate(u)}
                            title="Mở khoá tài khoản"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-vela-brand text-white hover:bg-vela-brand/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-vela-brand/40"
                          >
                            <Unlock size={14} /> Mở khoá
                          </button>
                        ) : (
                          <button
                            disabled={busyId === u.id}
                            onClick={() => doSuspend(u)}
                            title="Khoá tài khoản"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-vela-danger text-white hover:bg-vela-danger/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-vela-danger/40"
                          >
                            <Lock size={14} /> Khoá
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="flex items-center justify-between p-4 text-sm text-neutral-500 border-t border-vela-border">
        <span>{totalElements} người dùng</span>
        <div className="flex items-center gap-2">
          <button
            disabled={pageIdx <= 1}
            onClick={() => setPageIdx((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-md border border-vela-border disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-mono">
            {pageIdx} / {totalPages}
          </span>
          <button
            disabled={pageIdx >= totalPages}
            onClick={() => setPageIdx((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-md border border-vela-border disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </TableShell>
  );
}
