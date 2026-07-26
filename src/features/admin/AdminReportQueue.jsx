import { useCallback, useEffect, useState } from "react";
import { X, ShieldAlert, EyeOff, Lock, RotateCcw } from "lucide-react";
import {
  getAdminReports,
  resolvePostReport,
  resolveUserReport,
  rejectReport,
  restorePost,
} from "../../services/adminApi";
import { REPORT_STATUS } from "../../services/data/adminSeed";
import { StatusPill, REPORT_STATUS_META, fmtDateTime, shortId } from "./adminUi";

// compact = true  -> panel bên phải (Moderation Overview) gọn
// compact = false -> mục "Kiểm duyệt nội dung" đầy đủ (có bộ lọc trạng thái)
export default function AdminReportQueue({ compact = false, onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState(compact ? REPORT_STATUS.PENDING : "");

  const load = useCallback(() => {
    setLoading(true);
    getAdminReports({ status })
      .then((res) => setRows(res.content))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn, id) => {
    setBusyId(id);
    try {
      await fn(id);
      load();
      onChanged && onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const list = compact ? rows.slice(0, 5) : rows;

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
          : "rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
      }
    >
      <div
        className={`flex items-center justify-between ${
          compact ? "mb-3" : "p-4 border-b border-gray-100 dark:border-neutral-800"
        }`}
      >
        <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <ShieldAlert size={18} className="text-orange-500" />
          {compact ? "Hàng đợi báo cáo" : "Kiểm duyệt nội dung — Báo cáo vi phạm"}
        </div>
        {!compact && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="py-1.5 px-2.5 text-sm rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
          >
            <option value="">Tất cả trạng thái</option>
            <option value={REPORT_STATUS.PENDING}>Chờ duyệt</option>
            <option value={REPORT_STATUS.RESOLVED}>Đã xử lý</option>
            <option value={REPORT_STATUS.REJECTED}>Đã từ chối</option>
          </select>
        )}
      </div>

      <div className={compact ? "space-y-3" : "divide-y divide-gray-100 dark:divide-neutral-800"}>
        {loading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Đang tải…</div>
        ) : list.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">Không có báo cáo.</div>
        ) : (
          list.map((r) => {
            const isPending = r.status === REPORT_STATUS.PENDING;
            return (
              <div
                key={r.id}
                className={
                  compact
                    ? "rounded-lg border border-gray-100 dark:border-neutral-800 p-3"
                    : "p-4"
                }
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Mã báo cáo: <span className="font-mono text-gray-600 dark:text-neutral-300">#{r.id}</span>
                  </span>
                  <StatusPill meta={REPORT_STATUS_META} value={r.status} />
                </div>

                <div className="mt-1.5 text-sm text-gray-900 dark:text-white font-medium">
                  {r.reportReason?.reason || "—"}
                </div>

                <div className="mt-1 text-xs text-gray-500 dark:text-neutral-400 space-y-0.5">
                  <div>
                    Đối tượng:{" "}
                    <span className="font-medium">
                      {r.targetType === "USER" ? "Tài khoản" : "Bài viết"}
                    </span>{" "}
                    {r.targetType === "USER" && r.targetUser ? (
                      <span>· @{r.targetUser.username}</span>
                    ) : (
                      <span className="font-mono">· {shortId(r.targetId)}</span>
                    )}
                  </div>
                  <div>Người báo cáo: @{r.reporter?.username || "—"}</div>
                  {r.extraInformation && !compact && (
                    <div className="text-gray-400">Ghi chú: {r.extraInformation}</div>
                  )}
                  <div className="text-gray-400">{fmtDateTime(r.createTime)}</div>
                </div>

                {/* Xem chi tiết nội dung bị gắn cờ để đối chiếu — theo đúng yêu cầu tài liệu */}
                {r.targetType === "POST" && r.targetPost && !compact && (
                  <div className="mt-2 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 p-2.5 text-sm text-gray-700 dark:text-neutral-300">
                    "{r.targetPost.text}"
                  </div>
                )}

                {isPending && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      disabled={busyId === r.id}
                      onClick={() => act(rejectReport, r.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
                    >
                      <X size={14} /> Bác bỏ
                    </button>
                    {r.targetType === "POST" && (
                      <button
                        disabled={busyId === r.id}
                        onClick={() => act(resolvePostReport, r.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                      >
                        <EyeOff size={14} /> Xử lý nội dung (Ẩn bài)
                      </button>
                    )}
                    {r.targetType === "USER" && (
                      <button
                        disabled={busyId === r.id}
                        onClick={() => act(resolveUserReport, r.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <Lock size={14} /> Xử lý tài khoản (Khóa)
                      </button>
                    )}
                  </div>
                )}

                {/* Báo cáo đã xử lý (bài bị gắn cờ) -> cho phép khôi phục nếu xét lại thấy oan */}
                {r.status === REPORT_STATUS.RESOLVED && r.targetType === "POST" && (
                  <div className="mt-2.5">
                    <button
                      disabled={busyId === r.id}
                      onClick={() => act(() => restorePost(r.targetId), r.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                    >
                      <RotateCcw size={14} /> Khôi phục bài viết
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
