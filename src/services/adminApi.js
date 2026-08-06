// ============================================================================
// ADMIN API — theo pattern services/apiMock.js hiện có của repo.
//
// ⚠️ ĐÃ NỐI BE THẬT:
//   - getAdminStats()                             -> GET /auth/admin-stats + GET /report/list
//   - getAdminUsers()                              -> GET /auth/getuser (danh sách user thật)
//   - getAdminReports/rejectReport/resolvePostReport -> ReportController (prefix /report)
// Khóa/mở khóa tài khoản (suspendUser/activateUser) đã nối /auth/toggle-status thật.
// resolveUserReport ("xử lý tài khoản" khi report nhắm vào USER) VẪN MOCK vì chưa có
// luồng nào tạo report kiểu USER cả (chỉ mới có report POST) — dùng fixture adminSeed.js.
// Khi BE bổ sung endpoint, chỉ cần thay thân hàm bằng gọi `instance` (services/api.js)
// giữ nguyên chữ ký -> UI không phải sửa.
// ============================================================================

import { instance } from "./api";
import { mockApiCall } from "./apiMock";
import {
  adminUsers,
  adminReports,
  USER_STATUS,
  REPORT_STATUS,
  REPORT_TARGET_TYPE,
} from "./data/adminSeed";

// Bản sao in-memory để mô phỏng ghi dữ liệu — CHỈ dùng cho resolveUserReport (mock, chưa
// có endpoint BE thật cho "xử lý tài khoản"), tách biệt hoàn toàn với danh sách user thật
// ở bảng "Quản lý người dùng" bên dưới. getAdminReports/rejectReport/resolvePostReport
// đã nối BE thật (ReportController) nên không cần fixture report/post nữa.
let usersDb = adminUsers.map((u) => ({ ...u }));
let reportsDb = adminReports.map((r) => ({ ...r }));

const findUser = (id) => usersDb.find((u) => u.id === id) || null;

// ─── Cache danh sách user THẬT (bảng "Quản lý người dùng") ──────────────────
// Nạp 1 lần từ GET /auth/getuser (pageSize=100), giữ trong RAM để lọc/sắp xếp/
// phân trang phía FE (API hiện không hỗ trợ filter theo status). Khóa/mở khóa
// chỉ sửa TRẠNG THÁI TRONG CACHE NÀY (chưa có API thật để ghi xuống DB).
let realUsersCache = null;
let realUsersLoading = null;

function loadRealUsers() {
  if (realUsersCache) return Promise.resolve(realUsersCache);
  if (!realUsersLoading) {
    realUsersLoading = instance
      .get("/auth/getuser", { params: { pageIdx: 1, pageSize: 100 } })
      .then((res) => {
        realUsersCache = Array.isArray(res?.Object) ? res.Object : [];
        return realUsersCache;
      })
      .finally(() => {
        realUsersLoading = null;
      });
  }
  return realUsersLoading;
}

const findRealUser = (id) =>
  (realUsersCache || []).find((u) => u.id === id) || null;

// ─── THỐNG KÊ (chỉ các số ĐẾM ĐƯỢC TỪ DB) ──────────────────────────────────
// Không trả DAU / Recent Bans 24h vì DB không lưu hoạt động đăng nhập hay
// mốc thời gian đổi trạng thái. UI sẽ tự đánh dấu các ô đó là "Chưa có trong DB".
// Tổng user / user ACTIVE / user SUSPENDED / tổng bài viết: gọi thẳng BE thật
// GET /auth/admin-stats — đếm chính xác trong DB (countByStatus + count()), không
// bị giới hạn bởi pageSize như khi tự đếm từ 1 trang danh sách.
// pendingReports: ĐÃ NỐI BE THẬT (GET /report/list?status=PENDING, chỉ lấy totalElements).
export function getAdminStats() {
  return Promise.all([
    instance.get("/auth/admin-stats"),
    instance.get("/report/list", { params: { status: "PENDING", pageIdx: 1, pageSize: 1 } }),
  ]).then(([statsRes, reportsRes]) => {
    const s = statsRes?.Object || {};
    const pendingReports = reportsRes?.totalElements ?? 0;
    return {
      totalUsers: s.totalUsers ?? 0,
      activeUsers: s.activeUsers ?? 0,
      suspendedUsers: s.suspendedUsers ?? 0,
      totalPosts: s.totalPosts ?? 0,
      pendingReports,
    };
  });
}

// ─── DANH SÁCH USER THẬT — GET /auth/getuser (lọc + tìm + phân trang ở FE) ──
// params: { status, search, sort, pageIdx (1-based), pageSize }
//   status: "" | ACTIVE | SUSPENDED | PENDING_ACTIVATION
//   search: khớp username / name / email / id (UID)
//   sort:   "newest" | "oldest" (theo creationDate)
// ⚠️ API /auth/getuser không hỗ trợ filter theo status ở server, nên phải nạp
// tối đa 100 user (pageSize) rồi lọc/sắp xếp/phân trang thủ công ở đây.
export function getAdminUsers({
  status = "",
  search = "",
  sort = "newest",
  pageIdx = 1,
  pageSize = 10,
} = {}) {
  return loadRealUsers().then((users) => {
    let list = users.slice();

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

// ─── CHI TIẾT 1 USER — GET /auth/getuser?userId=... (trang "Chi tiết người dùng") ─
export function getAdminUserById(userId) {
  return instance
    .get("/auth/getuser", { params: { userId, pageIdx: 1, pageSize: 1 } })
    .then((res) => {
      const list = Array.isArray(res?.Object) ? res.Object : [];
      return list.find((u) => u.id === userId) || list[0] || null;
    });
}

// ─── SỐ BÀI VIẾT của 1 user (cột "Bài viết" ở bảng quản lý người dùng) — gọi
// lại đúng GET /post/GetlistPost, chỉ xin pageSize=1 để lấy totalElements cho nhẹ.
export function getUserPostCount(userId) {
  return instance
    .get("/post/GetlistPost", { params: { userId, pageIdx: 1, pageSize: 1 } })
    .then((res) => res?.totalElements ?? 0);
}

// ─── BÀI VIẾT CỦA 1 USER — GET /post/GetlistPost?userId=...&pageSize=100 ────
export function getAdminUserPosts(userId) {
  return instance
    .get("/post/GetlistPost", { params: { userId, pageIdx: 1, pageSize: 100 } })
    .then((res) => ({
      items: Array.isArray(res?.Object) ? res.Object : [],
      totalElements: res?.totalElements ?? 0,
    }));
}

// ─── KHÓA / MỞ KHÓA TÀI KHOẢN: PUT /auth/toggle-status (chỉ ADMIN, BE tự đảo
// ACTIVE <-> SUSPENDED). Sau khi BE xác nhận, cập nhật lại đúng user trong cache
// để bảng hiển thị ngay mà không cần gọi lại /auth/getuser.
function toggleStatus(userId, expectedNewStatus) {
  return instance.put("/auth/toggle-status", null, { params: { userId } }).then(() => {
    const u = findRealUser(userId);
    if (u) u.status = expectedNewStatus;
    return { id: userId, status: expectedNewStatus };
  });
}

// Bám docs/note.md phần D: chuyển trạng thái do Admin thực hiện.
export function suspendUser(userId) {
  return toggleStatus(userId, USER_STATUS.SUSPENDED);
}

export function activateUser(userId) {
  return toggleStatus(userId, USER_STATUS.ACTIVE);
}

// ─── DANH SÁCH BÀI VIẾT (tab "Bài viết") — GET /post/GetlistPost (feed thật,
// không truyền userId) — CÙNG API nuôi trang chủ. Giới hạn thật: chỉ trả bài mà
// tài khoản admin đang đăng nhập ĐƯỢC PHÉP THẤY (public + của mình + bạn bè đã
// chấp nhận), KHÔNG PHẢI toàn bộ bài viết trong DB — chưa có endpoint "admin xem
// hết mọi bài" nên đây là xấp xỉ tốt nhất bằng API thật hiện có.
export function getAdminPosts({ pageIdx = 1, pageSize = 100 } = {}) {
  return instance.get("/post/GetlistPost", { params: { pageIdx, pageSize } }).then((res) => {
    // BE trả HTTP 200 kèm envelope { Object: null, Errors: {message} } khi lỗi xử lý dữ
    // liệu ở server (không phải lỗi HTTP nên axios không tự reject) — coi đây là lỗi thật.
    if (!Array.isArray(res?.Object) && res?.Errors?.message) {
      throw new Error(res.Errors.message);
    }
    return {
      content: Array.isArray(res?.Object) ? res.Object : [],
      totalElements: res?.totalElements ?? 0,
    };
  });
}

// ─── XOÁ BÀI VIẾT (tab "Bài viết") ── dùng lại đúng deletePost() thật đã có ở
// services/postApi.js (DELETE /post/delete). Re-export để trang admin chỉ cần
// import từ 1 chỗ (services/adminApi) như các hàm khác trong file này.
export { deletePost } from "./postApi";

// ─── HÀNG ĐỢI BÁO CÁO (Report) — ĐÃ NỐI BE THẬT (ReportController, prefix /report) ──
// params: { status } — "" | PENDING | RESOLVED | REJECTED
export function getAdminReports({ status = "" } = {}) {
  return instance
    .get("/report/list", { params: { status: status || undefined, pageIdx: 1, pageSize: 100 } })
    .then((res) => ({
      content: Array.isArray(res?.Object) ? res.Object : [],
      totalElements: res?.totalElements ?? 0,
    }));
}

// ─── TỪ CHỐI BÁO CÁO ("Bác bỏ"): PENDING -> REJECTED ─────────────────────────
// Không đụng gì tới bài viết/tài khoản — chỉ đóng report vì xét thấy không vi phạm.
export function rejectReport(reportId) {
  return instance.put("/report/reject", { id: reportId });
}

// ─── "Xử lý nội dung": GẮN CỜ bài viết vi phạm (ẩn khỏi mọi nơi) + PENDING -> RESOLVED ──
// Chỉ áp dụng khi report nhắm vào POST (đúng luồng UseCase kiểm duyệt trong tài liệu).
export function resolvePostReport(reportId) {
  return instance.put("/report/resolve-post", { id: reportId });
}

// ─── Khôi phục bài viết đã bị gắn cờ (FLAGGED -> PUBLISHED) ─────────────────
export function restorePost(postId) {
  return instance.put("/post/restore", { id: postId });
}

// ─── "Xử lý tài khoản": khóa tài khoản vi phạm (status -> SUSPENDED) + đóng report ─
// Chỉ áp dụng khi report nhắm vào USER.
export function resolveUserReport(reportId) {
  return mockApiCall(() => {
    const r = reportsDb.find((x) => x.id === reportId);
    if (!r) throw new Error("Không tìm thấy báo cáo");
    if (r.targetType !== REPORT_TARGET_TYPE.USER) {
      throw new Error("Báo cáo này không nhắm vào tài khoản");
    }
    const u = findUser(r.targetId);
    if (u) u.status = USER_STATUS.SUSPENDED;
    r.status = REPORT_STATUS.RESOLVED;
    return { id: r.id, status: r.status, user: u ? { id: u.id, status: u.status } : null };
  });
}
