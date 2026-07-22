// Helper hiển thị dùng chung cho khu vực Admin.
// Nhãn/màu bám đúng enum trong DB (UserStatus, ReportStatus).
import dayjs from "dayjs";

// UserStatus (models/Enum/UserStatus.java)
export const USER_STATUS_META = {
  ACTIVE: {
    label: "Đang hoạt động",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  SUSPENDED: {
    label: "Bị khóa",
    cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  PENDING_ACTIVATION: {
    label: "Chờ kích hoạt",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
};

// ReportStatus (models/Enum/ReportStatus.java)
export const REPORT_STATUS_META = {
  PENDING: {
    label: "Chờ duyệt",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  RESOLVED: {
    label: "Đã xử lý",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  REJECTED: {
    label: "Đã từ chối",
    cls: "bg-gray-200 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300",
  },
};

export function StatusPill({ meta, value }) {
  const m = meta[value] || { label: value, cls: "bg-gray-100 text-gray-600" };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

// Nhãn cho các ô/cột KHÔNG có dữ liệu trong DB (giữ layout theo yêu cầu).
export function NotInDbTag({ text = "Chưa có trong DB" }) {
  return (
    <span
      title="Trường này không tồn tại trong CSDL / tài liệu thiết kế hiện tại"
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border border-dashed border-gray-300 text-gray-400 dark:border-neutral-600 dark:text-neutral-500"
    >
      {text}
    </span>
  );
}

export const fmtDate = (iso) => (iso ? dayjs(iso).format("DD/MM/YYYY") : "—");
export const fmtDateTime = (iso) =>
  iso ? dayjs(iso).format("DD/MM/YYYY HH:mm") : "—";

// Rút gọn UID dài (UUID 36 ký tự) cho gọn bảng
export const shortId = (id) =>
  !id ? "—" : id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
