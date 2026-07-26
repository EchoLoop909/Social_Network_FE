import { useCallback, useEffect, useState } from "react";
import { Search, Lock, Unlock, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getAdminUsers,
  suspendUser,
  activateUser,
} from "../../services/adminApi";
import { USER_STATUS } from "../../services/data/adminSeed";
import { StatusPill, NotInDbTag, USER_STATUS_META, fmtDate, shortId } from "./adminUi";

const PAGE_SIZE = 8;

export default function AdminUserTable({ onChanged }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // filters (bám DB): status enum + search + sort theo creationDate
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [pageIdx, setPageIdx] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
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
    <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      {/* Thanh công cụ: tìm kiếm + lọc */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100 dark:border-neutral-800">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, username, email hoặc UID"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#1877f2]/40"
          />
        </div>

        {/* Lọc theo Status — đúng 3 giá trị UserStatus */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
        >
          <option value="">Trạng thái: Tất cả</option>
          <option value={USER_STATUS.ACTIVE}>Đang hoạt động</option>
          <option value={USER_STATUS.SUSPENDED}>Bị khóa</option>
          <option value={USER_STATUS.PENDING_ACTIVATION}>Chờ kích hoạt</option>
        </select>

        {/* Sắp xếp theo ngày đăng ký (creationDate) */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
        >
          <option value="newest">Ngày ĐK: Mới nhất</option>
          <option value="oldest">Ngày ĐK: Cũ nhất</option>
        </select>


      </div>

      {/* Bảng */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-neutral-400 border-b border-gray-100 dark:border-neutral-800">
              <th className="py-3 px-4 font-medium">Ảnh đại diện</th>
              <th className="py-3 px-4 font-medium">Người dùng</th>
              <th className="py-3 px-4 font-medium">UID</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Trạng thái</th>
              <th className="py-3 px-4 font-medium">Ngày đăng ký</th>
              <th className="py-3 px-4 font-medium">Riêng tư</th>
              <th className="py-3 px-4 font-medium text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-400">
                  Đang tải…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-400">
                  Không có người dùng nào khớp bộ lọc.
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const isSuspended = u.status === USER_STATUS.SUSPENDED;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-gray-50 dark:border-neutral-800/60 hover:bg-gray-50/70 dark:hover:bg-neutral-800/40"
                  >
                    <td className="py-3 px-4">
                      <img
                        src={u.photo || "https://via.placeholder.com/40"}
                        alt={u.username}
                        className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-neutral-700"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">{u.name}</div>
                      <div className="text-xs text-gray-400">@{u.username}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500" title={u.id}>
                      {shortId(u.id)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-neutral-300">{u.email}</td>
                    <td className="py-3 px-4">
                      <StatusPill meta={USER_STATUS_META} value={u.status} />
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-neutral-300">
                      {fmtDate(u.creationDate)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-neutral-300">
                      {u.isPrivate ? "Riêng tư" : "Công khai"}
                    </td>
                  
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          title="Xem chi tiết người dùng"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
                        >
                          <Eye size={14} /> Xem
                        </button>
                        {isSuspended ? (
                          <button
                            disabled={busyId === u.id}
                            onClick={() => doActivate(u)}
                            title="Mở khóa (SUSPENDED → ACTIVE)"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            <Unlock size={14} /> Mở khóa
                          </button>
                        ) : (
                          <button
                            disabled={busyId === u.id}
                            onClick={() => doSuspend(u)}
                            title="Khóa tài khoản (→ SUSPENDED)"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <Lock size={14} /> Khóa
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
      <div className="flex items-center justify-between p-4 text-sm text-gray-500">
        <span>{totalElements} người dùng</span>
        <div className="flex items-center gap-2">
          <button
            disabled={pageIdx <= 1}
            onClick={() => setPageIdx((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-md border border-gray-200 dark:border-neutral-700 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {pageIdx} / {totalPages}
          </span>
          <button
            disabled={pageIdx >= totalPages}
            onClick={() => setPageIdx((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-md border border-gray-200 dark:border-neutral-700 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
