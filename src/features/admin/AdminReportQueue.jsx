import { useCallback, useEffect, useState } from "react";
import { X, EyeOff, Lock, RotateCcw, Check } from "lucide-react";
import {
  getAdminReports,
  resolvePostReport,
  resolveUserReport,
  rejectReport,
  restorePost,
  suspendUser,
} from "../../services/adminApi";
import { REPORT_STATUS, REPORT_TARGET_TYPE } from "../../services/data/adminSeed";
import {
  VelaStatusPill,
  VELA_REPORT_STATUS_META,
  PriorityStripe,
  priorityFromReason,
  TableShell,
  SectionHeader,
  fmtDateTime,
  shortId,
} from "./adminUi";

const STATUS_CHIPS = [
  { value: "", label: "Tất cả" },
  { value: REPORT_STATUS.PENDING, label: "Chờ xử lý" },
  { value: REPORT_STATUS.RESOLVED, label: "Đã xử lý" },
  { value: REPORT_STATUS.REJECTED, label: "Đã bỏ qua" },
];

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vela-brand/40 ${
        active
          ? "bg-vela-brand text-white border-vela-brand"
          : "bg-white text-neutral-600 border-vela-border hover:bg-vela-bg"
      }`}
    >
      {children}
    </button>
  );
}

// Suy ra id tài khoản để "Khoá tài khoản" trực tiếp từ báo cáo (không cần report
// đã đóng): USER -> targetId; POST -> id chủ bài viết bị báo cáo.
function resolveAccountTargetId(r) {
  if (r.targetType === REPORT_TARGET_TYPE.USER) return r.targetId;
  if (r.targetType === REPORT_TARGET_TYPE.POST) return r.targetPost?.user?.id || null;
  return null;
}

function ReportDetailModal({ report, busy, onClose, onAct }) {
  if (!report) return null;
  const isPending = report.status === REPORT_STATUS.PENDING;
  const accountTargetId = resolveAccountTargetId(report);
  const isFlaggedPost = report.targetType === REPORT_TARGET_TYPE.POST && report.targetPost?.status === "FLAGGED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-md border border-vela-border bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-neutral-400 font-mono">Mã báo cáo #{shortId(report.id)}</div>
            <h3 className="font-display font-semibold text-lg text-neutral-900 mt-0.5">
              {report.reportReason?.reason || "—"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-vela-bg text-neutral-400 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-vela-brand/40"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <VelaStatusPill meta={VELA_REPORT_STATUS_META} value={report.status} />
          <PriorityStripe level={priorityFromReason(report.reportReason?.reason)} />
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400">Đối tượng bị báo cáo</span>
            <span className="font-medium text-neutral-800">
              {report.targetType === REPORT_TARGET_TYPE.USER ? "Tài khoản" : "Bài viết"}
              {report.targetType === REPORT_TARGET_TYPE.USER && report.targetUser
                ? ` · @${report.targetUser.username}`
                : ""}
              {report.targetType === REPORT_TARGET_TYPE.POST && report.targetPost?.user
                ? ` · @${report.targetPost.user.username}`
                : ""}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400">Người báo cáo</span>
            <span className="font-medium text-neutral-800">@{report.reporter?.username || "—"}</span>
          </div>
          {report.extraInformation && (
            <div className="flex justify-between gap-3">
              <span className="text-neutral-400 shrink-0">Ghi chú</span>
              <span className="text-neutral-700 text-right">{report.extraInformation}</span>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400">Thời gian</span>
            <span className="font-mono text-neutral-600 text-xs">{fmtDateTime(report.createTime)}</span>
          </div>
        </div>

        {report.targetType === REPORT_TARGET_TYPE.POST && report.targetPost && (
          <div className="mt-3 rounded-md bg-vela-bg/60 border border-vela-border p-3 text-sm text-neutral-700">
            "{report.targetPost.text || "(không có nội dung chữ)"}"
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {isPending && (
            <>
              <button
                disabled={busy}
                onClick={() => onAct(report.targetType === REPORT_TARGET_TYPE.POST ? resolvePostReport : resolveUserReport, report.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-vela-brand text-white hover:bg-vela-brand/90 disabled:opacity-50"
              >
                <Check size={15} /> Xử lý & đóng báo cáo
              </button>
              <button
                disabled={busy}
                onClick={() => onAct(rejectReport, report.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-vela-border hover:bg-vela-bg disabled:opacity-50"
              >
                <EyeOff size={15} /> Bỏ qua
              </button>
              <button
                disabled={busy || !accountTargetId}
                title={accountTargetId ? undefined : "Không xác định được tài khoản để khoá"}
                onClick={() => accountTargetId && onAct(() => suspendUser(accountTargetId), report.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-vela-danger text-white hover:bg-vela-danger/90 disabled:opacity-50"
              >
                <Lock size={15} /> Khoá tài khoản
              </button>
            </>
          )}
          {isFlaggedPost && (
            <button
              disabled={busy}
              onClick={() => onAct(() => restorePost(report.targetId), report.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-vela-border hover:bg-vela-bg disabled:opacity-50"
            >
              <RotateCcw size={15} /> Khôi phục bài viết
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminReportQueue({ onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState(null);

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
      setSelectedId(null);
    } catch (e) {
      const msg = e?.response?.data?.Errors?.message || e?.message || "Thao tác thất bại";
      alert(msg);
    } finally {
      setBusyId(null);
    }
  };

  const selected = rows.find((r) => r.id === selectedId) || null;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Báo cáo vi phạm"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_CHIPS.map((c) => (
              <Chip key={c.value} active={status === c.value} onClick={() => setStatus(c.value)}>
                {c.label}
              </Chip>
            ))}
          </div>
        }
      />

      <TableShell>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-vela-border bg-vela-bg/40">
              <th className="py-3 px-4 font-medium">Mã báo cáo</th>
              <th className="py-3 px-4 font-medium">Loại vi phạm</th>
              <th className="py-3 px-4 font-medium">Đối tượng</th>
              <th className="py-3 px-4 font-medium">Người báo cáo</th>
              <th className="py-3 px-4 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-neutral-400">
                  Đang tải…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-neutral-400">
                  Không có báo cáo nào.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="border-b border-vela-border/60 hover:bg-vela-bg/40 cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono text-xs text-neutral-500">#{shortId(r.id)}</td>
                  <td className="py-3 px-4 text-neutral-800">{r.reportReason?.reason || "—"}</td>
                  <td className="py-3 px-4 text-neutral-600">
                    {r.targetType === REPORT_TARGET_TYPE.USER
                      ? `Tài khoản @${r.targetUser?.username || "—"}`
                      : `Bài viết `}
                  </td>
                  <td className="py-3 px-4 text-neutral-600">{r.reporter?.username || "—"}</td>
                  <td className="py-3 px-4">
                    <VelaStatusPill meta={VELA_REPORT_STATUS_META} value={r.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      {selected && (
        <ReportDetailModal
          report={selected}
          busy={busyId === selected.id}
          onClose={() => setSelectedId(null)}
          onAct={act}
        />
      )}
    </div>
  );
}
