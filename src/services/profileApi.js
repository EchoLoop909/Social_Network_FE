import { instance } from "./api";

// Tầng gọi API phục vụ xem hồ sơ user khác: thông tin user + bài viết của user đó.

/**
 * Lấy 1 user theo id: GET /auth/getuser?userId=...
 * Trả về entity user (kèm isPrivate) hoặc null nếu không thấy.
 */
export async function getUserById(userId) {
  const env = await instance.get("/auth/getuser", {
    params: { userId, pageIdx: 1, pageSize: 20 },
  });
  const list = Array.isArray(env?.Object) ? env.Object : [];
  return list.find((u) => u.id === userId) || list[0] || null;
}

/**
 * Lấy bài viết của 1 user: GET /post/GetlistPost?userId=...
 * LƯU Ý: nếu user đó để riêng tư (isPrivate=true) và người xem CHƯA được chấp nhận,
 * BE trả 200 kèm Object = [] (rỗng) — không phải lỗi. Component tự suy ra thông báo "riêng tư".
 * Trả { items, totalElements }.
 */
export async function getUserPosts(userId, pageIdx = 1, pageSize = 50) {
  const env = await instance.get("/post/GetlistPost", {
    params: { userId, pageIdx, pageSize },
  });
  const list = Array.isArray(env?.Object) ? env.Object : [];
  return { items: list, totalElements: env?.totalElements ?? list.length };
}

/** Cập nhật hồ sơ của CHÍNH MÌNH (PUT /auth/updateuser, userId lấy từ token). payload: {name, description, photo, isPrivate...}. */
export async function updateMyProfile(payload) {
  return instance.put("/auth/updateuser", payload);
}
