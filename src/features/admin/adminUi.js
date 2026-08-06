// Helper hiển thị dùng chung cho khu vực Admin.
// Nhãn/màu bám đúng enum trong DB (UserStatus, ReportStatus).
import { useState } from "react";
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

// ============================================================================
// VELA DESIGN SYSTEM — component dùng chung cho giao diện admin "Vela".
// Token màu khai báo ở tailwind.config.js (vela-bg/panel/border/brand/success/
// warning/danger/neutral). Các component cũ ở trên (StatusPill cũ, NotInDbTag…)
// GIỮ NGUYÊN vì AdminUserDetailPage.jsx đang import — không sửa để tránh vỡ.
// ============================================================================

const VELA_TONE_CLS = {
  success: "bg-vela-success/10 text-vela-success",
  warning: "bg-vela-warning/10 text-vela-warning",
  danger: "bg-vela-danger/10 text-vela-danger",
  neutral: "bg-vela-neutral/10 text-vela-neutral",
  brand: "bg-vela-brand/10 text-vela-brand",
};

// Badge chữ hoa nhỏ, font mono, nền nhạt + chữ đậm — theo đúng token thiết kế.
export function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase tracking-wide whitespace-nowrap ${
        VELA_TONE_CLS[tone] || VELA_TONE_CLS.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}

// Pill trạng thái kiểu Vela: meta = { [value]: { label, tone } }
export function VelaStatusPill({ meta, value }) {
  const m = meta[value] || { label: value || "—", tone: "neutral" };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

export const VELA_USER_STATUS_META = {
  ACTIVE: { label: "Hoạt động", tone: "success" },
  SUSPENDED: { label: "Đã khoá", tone: "danger" },
  PENDING_ACTIVATION: { label: "Tạm khoá", tone: "warning" },
};

export const VELA_REPORT_STATUS_META = {
  PENDING: { label: "Chờ xử lý", tone: "warning" },
  RESOLVED: { label: "Đã xử lý", tone: "success" },
  REJECTED: { label: "Đã bỏ qua", tone: "neutral" },
  REVIEWING: { label: "Đang xem xét", tone: "brand" },
};

export const VELA_POST_STATUS_META = {
  PUBLISHED: { label: "Hiển thị", tone: "success" },
  PENDING_REVIEW: { label: "Chờ duyệt", tone: "warning" },
  FLAGGED: { label: "Đã ẩn", tone: "danger" },
  DELETED: { label: "Đã xoá", tone: "neutral" },
};

// ─── Mức độ ưu tiên báo cáo ─────────────────────────────────────────────────
// Report entity KHÔNG có cột priority trong DB — đây là quy tắc hiển thị suy ra
// từ nội dung ReportReason (chỉ để nhóm/nhấn mạnh trên UI), không phải số liệu
// đọc thẳng từ CSDL.
export const PRIORITY_META = {
  THAP: { label: "Thấp", tone: "neutral", order: 1 },
  TRUNG_BINH: { label: "Trung bình", tone: "warning", order: 2 },
  CAO: { label: "Cao", tone: "danger", order: 3 },
  KHAN_CAP: { label: "Khẩn cấp", tone: "danger", order: 4 },
};

export function priorityFromReason(reasonText = "") {
  const t = reasonText.toLowerCase();
  if (t.includes("khiêu dâm") || t.includes("bạo lực")) return "KHAN_CAP";
  if (t.includes("thù ghét") || t.includes("quấy rối") || t.includes("bắt nạt")) return "CAO";
  if (t.includes("sai lệch") || t.includes("mạo danh") || t.includes("giả")) return "TRUNG_BINH";
  if (t.includes("spam") || t.includes("lừa đảo")) return "THAP";
  return "TRUNG_BINH";
}

// Thanh 4 đoạn thể hiện mức độ ưu tiên — đoạn tô đậm dần theo `level`.
export function PriorityStripe({ level, className = "" }) {
  const meta = PRIORITY_META[level] || PRIORITY_META.TRUNG_BINH;
  const toneBg = {
    neutral: "bg-vela-neutral",
    warning: "bg-vela-warning",
    danger: "bg-vela-danger",
  }[meta.tone];
  return (
    <div className={`flex items-center gap-2 ${className}`} title={`Mức độ ưu tiên: ${meta.label}`}>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((seg) => (
          <span
            key={seg}
            className={`w-2 h-4 rounded-sm ${seg <= meta.order ? toneBg : "bg-vela-border"}`}
          />
        ))}
      </div>
      <span className="text-xs font-mono text-neutral-600">{meta.label}</span>
    </div>
  );
}

// Khung bảng dùng chung — nền trắng, viền nhạt, bo góc nhỏ, không đổ bóng nặng.
export function TableShell({ children, className = "" }) {
  return (
    <div className={`rounded-md border border-vela-border bg-white overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// Tiêu đề khu vực — font Space Grotesk cho tiêu đề, mô tả phụ + actions bên phải.
export function SectionHeader({ title, description, actions }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h2 className="font-display font-semibold text-lg text-neutral-900">{title}</h2>
        {description && <p className="text-sm text-neutral-500 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// Ảnh đại diện dùng chung — nếu không có photo (hoặc load lỗi), hiện vòng tròn
// chữ cái đầu tên thay vì fallback qua dịch vụ ảnh ngoài (via.placeholder.com
// đã ngừng hoạt động, gây lỗi ERR_CONNECTION_CLOSED).
export function Avatar({ src, name, size = 36, className = "" }) {
  const initial = (name || "?").trim().slice(0, 1).toUpperCase() || "?";
  const [broken, setBroken] = useState(false);

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name || ""}
        onError={() => setBroken(true)}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover border border-vela-border shrink-0 ${className}`}
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.42)) }}
      className={`inline-flex items-center justify-center rounded-full bg-vela-brand text-white font-display font-semibold shrink-0 ${className}`}
    >
      {initial}
    </span>
  );
}

// Thẻ thống kê dùng chung cho tab Người dùng / Bài viết / Tương tác.
export function StatCard({ icon: Icon, tone = "brand", label, value, sub, na }) {
  return (
    <div className="flex-1 min-w-[180px] rounded-md border border-vela-border bg-white p-4">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        {Icon && (
          <span className={`inline-flex w-6 h-6 items-center justify-center rounded ${VELA_TONE_CLS[tone] || VELA_TONE_CLS.brand}`}>
            <Icon size={14} />
          </span>
        )}
        {label}
      </div>
      <div className="mt-2 text-2xl font-mono font-semibold text-neutral-900">
        {na ? <span className="text-neutral-400">N/A</span> : value}
      </div>
      {sub && !na && <div className="mt-1 text-xs text-neutral-400">{sub}</div>}
      {na && <div className="mt-1"><NotInDbTag /></div>}
    </div>
  );
}
