import { instance } from "./api";

// Tầng gọi API kết bạn / theo dõi (FollowershipController, prefix /friendship).
// Interceptor trong api.js đã trả thẳng response.data (envelope).
//
// Envelope BE (lưu ý): getResponseSearchMess LUÔN để isOk=true; phân biệt thành/bại
// bằng HTTP status (2xx = OK, 4xx/5xx = axios throw) và Errors.message.
// Vì vậy các hàm dưới đây throw Error(message) khi thất bại để component bắt gọn.

/** Bóc thông báo lỗi từ envelope BE: { Errors: { code, message } } hoặc validate { errors:[...] }. */
function extractError(err, fallback) {
  const d = err?.response?.data;
  if (!d) return err?.message || fallback;
  if (d.Errors && d.Errors.message) return d.Errors.message;
  if (typeof d.Errors === "string" && d.Errors.trim()) return d.Errors;
  if (Array.isArray(d.errors)) {
    return d.errors.map((e) => e.message || e.defaultMessage || e).join(", ");
  }
  if (typeof d.errors === "string") return d.errors;
  return fallback;
}

/**
 * Gửi lời mời kết bạn / theo dõi tới targetUserId (id người nhận).
 * Người gửi KHÔNG gửi lên — BE lấy từ token. Trả message thành công; throw Error khi thất bại.
 */
export async function sendFriendRequest(targetUserId) {
  try {
    const env = await instance.post("/friendship/sendfriendrequest", { targetUserId });
    return env?.Errors?.message || "SEND FRIEND REQUEST SUCCESS";
  } catch (err) {
    throw new Error(extractError(err, "Gửi lời mời thất bại"));
  }
}

/**
 * Chấp nhận lời mời từ requesterId (người đã gửi lời mời tới mình).
 * Người chấp nhận lấy từ token. FOLLOWING/PENDING -> ACCEPTED.
 */
export async function acceptFriendRequest(requesterId) {
  try {
    const env = await instance.post("/friendship/accepfriendrequest", { requesterId });
    return env?.Errors?.message || "ACCEPT FRIEND REQUEST SUCCESS";
  } catch (err) {
    throw new Error(extractError(err, "Chấp nhận lời mời thất bại"));
  }
}

/**
 * Hủy kết bạn / hủy theo dõi với targetUserId. Xóa quan hệ 2 chiều A<->B trong DB.
 * Người thực hiện lấy từ token.
 */
export async function unfriend(targetUserId) {
  try {
    const env = await instance.post("/friendship/unfriend", { targetUserId });
    return env?.Errors?.message || "UNFRIEND SUCCESS";
  } catch (err) {
    throw new Error(extractError(err, "Hủy kết bạn thất bại"));
  }
}

/** Từ chối lời mời từ requesterId (xóa bản ghi). Người từ chối lấy từ token. */
export async function rejectFriendRequest(requesterId) {
  try {
    const env = await instance.post("/friendship/rejectfriendrequest", { requesterId });
    return env?.Errors?.message || "REJECT FRIEND REQUEST SUCCESS";
  } catch (err) {
    throw new Error(extractError(err, "Từ chối lời mời thất bại"));
  }
}

/* ============ Các API danh sách (trả mảng UserSummaryDto trong env.Object) ============ */

/** Danh sách bạn bè (ACCEPTED) của người đang đăng nhập. */
export async function getFriends() {
  const env = await instance.get("/friendship/friends");
  return Array.isArray(env?.Object) ? env.Object : [];
}

/** Danh sách lời mời kết bạn ĐẾN người đang đăng nhập. */
export async function getFriendRequests() {
  const env = await instance.get("/friendship/requests");
  return Array.isArray(env?.Object) ? env.Object : [];
}

/** Gợi ý kết bạn (những user chưa có quan hệ với mình). */
export async function getSuggestions() {
  const env = await instance.get("/friendship/suggestions");
  return Array.isArray(env?.Object) ? env.Object : [];
}

/** Chặn user targetUserId (xóa mọi quan hệ cũ + tạo BLOCKED). Người chặn lấy từ token. */
export async function blockUser(targetUserId) {
  try {
    const env = await instance.post("/friendship/blockuser", { targetUserId });
    return env?.Errors?.message || "BLOCK USER SUCCESS";
  } catch (err) {
    throw new Error(extractError(err, "Chặn người dùng thất bại"));
  }
}

/** Bỏ chặn user targetUserId. */
export async function unblockUser(targetUserId) {
  try {
    const env = await instance.post("/friendship/unblock", { targetUserId });
    return env?.Errors?.message || "UNBLOCK USER SUCCESS";
  } catch (err) {
    throw new Error(extractError(err, "Bỏ chặn người dùng thất bại"));
  }
}

/** Danh sách user mình đã chặn (mảng UserSummaryDto). */
export async function getBlockedUsers() {
  const env = await instance.get("/friendship/blocked");
  return Array.isArray(env?.Object) ? env.Object : [];
}
