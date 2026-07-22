import { instance } from "./api";

// Tầng gọi API thông báo (NotificationController, prefix /notification).
// Interceptor đã trả thẳng envelope (response.data) + tự gắn Bearer token.

/** Danh sách thông báo của mình (mới nhất trước). Trả mảng NotificationResponse. */
export async function fetchNotifList(pageIdx = 1, pageSize = 20) {
  const env = await instance.get("/notification/list", { params: { pageIdx, pageSize } });
  return Array.isArray(env?.Object) ? env.Object : [];
}

/** Số thông báo chưa đọc (badge chuông). Trả number. */
export async function fetchUnreadCount() {
  const env = await instance.get("/notification/unread-count");
  return typeof env?.Object === "number" ? env.Object : 0;
}

/** Đánh dấu 1 thông báo đã đọc. */
export async function markRead(id) {
  await instance.post("/notification/read", null, { params: { id } });
}

/** Đánh dấu tất cả thông báo đã đọc. */
export async function markAllRead() {
  await instance.post("/notification/read-all");
}

/** Xóa 1 thông báo. */
export async function deleteNotif(id) {
  await instance.post("/notification/delete", null, { params: { id } });
}
