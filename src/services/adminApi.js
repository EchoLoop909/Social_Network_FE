// ============================================================================
// ADMIN API (MOCK) — theo pattern services/apiMock.js hiện có của repo.
//
// ⚠️ BE HIỆN CHƯA CÓ ADMIN ENDPOINT:
//   - Không có AuthController/AdminController cho việc khóa/mở khóa tài khoản
//     (docs/note.md ghi rõ "ACTIVE -> SUSPENDED: Admin (luồng riêng, CHƯA code)").
//   - Report/ReportReason chưa có controller.
// Vì vậy toàn bộ hàm dưới đây thao tác trên fixture in-memory (adminSeed.js).
// Khi BE bổ sung endpoint, chỉ cần thay thân hàm bằng gọi `instance` (services/api.js)
// giữ nguyên chữ ký -> UI không phải sửa.
//
// Mọi chức năng ở đây đều BÁM SÁT DB: chỉ dùng đúng các field/enum của
// User, Report, ReportReason. Không có Risk Level, DAU, Audit Log... (không tồn tại trong DB).
// ============================================================================

import { mockApiCall } from "./apiMock";
import {
  adminUsers,
  adminReports,
  adminReportReasons,
  USER_STATUS,
  REPORT_STATUS,
} from "./data/adminSeed";

// Bản sao in-memory để mô phỏng ghi dữ liệu (không đụng seed gốc khi import nơi khác)
let usersDb = adminUsers.map((u) => ({ ...u }));
let reportsDb = adminReports.map((r) => ({ ...r }));

const findUser = (id) => usersDb.find((u) => u.id === id) || null;
const findReason = (id) =>
  adminReportReasons.find((r) => r.id === id) || null;

// ─── THỐNG KÊ (chỉ các số ĐẾM ĐƯỢC TỪ DB) ──────────────────────────────────
// Không trả DAU / Recent Bans 24h vì DB không lưu hoạt động đăng nhập hay
// mốc thời gian đổi trạng thái. UI sẽ tự đánh dấu các ô đó là "Chưa có trong DB".
export function getAdminStats() {
  return mockApiCall(() => {
    const totalUsers = usersDb.length;
    const activeUsers = usersDb.filter(
      (u) => u.status === USER_STATUS.ACTIVE
    ).length;
    const suspendedUsers = usersDb.filter(
      (u) => u.status === USER_STATUS.SUSPENDED
    ).length;
    const pendingUsers = usersDb.filter(
      (u) => u.status === USER_STATUS.PENDING_ACTIVATION
    ).length;
    const pendingReports = reportsDb.filter(
      (r) => r.status === REPORT_STATUS.PENDING
    ).length;
    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingUsers,
      pendingReports,
    };
  });
}

// ─── DANH SÁCH USER (lọc + tìm + phân trang) ────────────────────────────────
// params: { status, search, sort, pageIdx (1-based), pageSize }
//   status: "" | ACTIVE | SUSPENDED | PENDING_ACTIVATION
//   search: khớp username / name / email / id (UID)
//   sort:   "newest" | "oldest" (theo creationDate)
export function getAdminUsers({
  status = "",
  search = "",
  sort = "newest",
  pageIdx = 1,
  pageSize = 10,
} = {}) {
  return mockApiCall(() => {
    let list = usersDb.slice();

    if (status) list = list.filter((u) => u.status === status);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          (u.username || "").toLowerCase().includes(q) ||
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.id || "").toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const da = new Date(a.creationDate).getTime();
      const db = new Date(b.creationDate).getTime();
      return sort === "oldest" ? da - db : db - da;
    });

    const totalElements = list.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
    const start = (pageIdx - 1) * pageSize;
    const content = list.slice(start, start + pageSize);

    return { content, totalElements, totalPages, pageIdx, pageSize };
  });
}

// ─── KHÓA TÀI KHOẢN: ACTIVE -> SUSPENDED ────────────────────────────────────
// Bám docs/note.md phần D: chuyển trạng thái do Admin thực hiện.
export function suspendUser(userId) {
  return mockApiCall(() => {
    const u = findUser(userId);
    if (!u) throw new Error("Không tìm thấy user");
    u.status = USER_STATUS.SUSPENDED;
    return { id: u.id, status: u.status };
  });
}

// ─── MỞ KHÓA: SUSPENDED -> ACTIVE ───────────────────────────────────────────
export function activateUser(userId) {
  return mockApiCall(() => {
    const u = findUser(userId);
    if (!u) throw new Error("Không tìm thấy user");
    u.status = USER_STATUS.ACTIVE;
    return { id: u.id, status: u.status };
  });
}

// ─── HÀNG ĐỢI BÁO CÁO (Report) ──────────────────────────────────────────────
// params: { status } — "" | PENDING | RESOLVED | REJECTED
// Trả kèm reporter (User) + reason (ReportReason) đã resolve để UI hiển thị.
export function getAdminReports({ status = "" } = {}) {
  return mockApiCall(() => {
    let list = reportsDb.slice();
    if (status) list = list.filter((r) => r.status === status);
    list.sort(
      (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    );
    const enriched = list.map((r) => ({
      ...r,
      reporter: findUser(r.reporterId),
      reportReason: findReason(r.reportReasonId),
      // Nếu báo cáo nhắm vào USER thì kèm thông tin user bị báo cáo
      targetUser:
        r.targetType === "USER" ? findUser(r.targetId) : null,
    }));
    return { content: enriched, totalElements: enriched.length };
  });
}

// ─── DUYỆT BÁO CÁO: PENDING -> RESOLVED ─────────────────────────────────────
export function resolveReport(reportId) {
  return mockApiCall(() => {
    const r = reportsDb.find((x) => x.id === reportId);
    if (!r) throw new Error("Không tìm thấy báo cáo");
    r.status = REPORT_STATUS.RESOLVED;
    return { id: r.id, status: r.status };
  });
}

// ─── TỪ CHỐI BÁO CÁO: PENDING -> REJECTED ───────────────────────────────────
export function rejectReport(reportId) {
  return mockApiCall(() => {
    const r = reportsDb.find((x) => x.id === reportId);
    if (!r) throw new Error("Không tìm thấy báo cáo");
    r.status = REPORT_STATUS.REJECTED;
    return { id: r.id, status: r.status };
  });
}
