import { instance } from "./api";

// Tầng gọi API Story thật (StoryController, prefix /story).
// Interceptor trong api.js đã trả thẳng response.data (envelope { Status, Errors, isOk, Object }).

/** Bóc thông báo lỗi từ envelope BE. */
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
 * Upload 1 file ảnh/video lên Cloudinary (dùng chung endpoint /post-media/upload).
 * Trả { url, type, ... } — type là IMAGE/VIDEO do BE suy ra.
 */
export async function uploadStoryMedia(file) {
  const fd = new FormData();
  fd.append("files", file);
  const env = await instance.post("/post-media/upload", fd, {
    headers: { "Content-Type": undefined },
  });
  const list = Array.isArray(env?.Object) ? env.Object : [];
  return list[0] || null;
}

/**
 * Upload 1 file nhạc (audio) — tái dùng endpoint /post-media/upload (Cloudinary resource_type=auto).
 * Trả URL audio (dùng cho metadata.music.url).
 */
export async function uploadStoryAudio(file) {
  const fd = new FormData();
  fd.append("files", file);
  const env = await instance.post("/post-media/upload", fd, {
    headers: { "Content-Type": undefined },
    timeout: 120000,
  });
  const list = Array.isArray(env?.Object) ? env.Object : [];
  return list[0]?.url || null;
}

/**
 * Đăng story mới bằng cách CHỌN FILE trực tiếp (multipart) — BE tự upload Cloudinary + suy ra mediaType.
 * userId KHÔNG gửi — BE lấy từ token.
 * @param file        File ảnh/video từ máy (bắt buộc)
 * @param expiresInHours số giờ hết hạn (mặc định BE = 24 nếu bỏ trống)
 * @param metadata    chuỗi JSON overlay (nhạc/caption/sticker) hoặc null
 */
export async function createStory({ file, caption, isArchived = false, expiresInHours, metadata }) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    if (caption != null) fd.append("caption", caption);
    if (isArchived != null) fd.append("isArchived", isArchived);
    if (expiresInHours != null) fd.append("expiresInHours", expiresInHours);
    if (metadata != null) fd.append("metadata", metadata);
    const env = await instance.post("/story/insert", fd, {
      headers: { "Content-Type": undefined },
      timeout: 120000,
    });
    return env?.Errors?.message || "CREATE STORY SUCCESS";
  } catch (err) {
    throw new Error(extractError(err, "Đăng story thất bại"));
  }
}

/**
 * Danh sách story đang hiển thị (chưa hết hạn hoặc Highlight) của 1 user.
 * Không truyền userId -> BE lấy story của chính người đang đăng nhập.
 */
export async function getStories(userId) {
  const params = { pageIdx: 1, pageSize: 50 };
  if (userId && userId.trim()) params.userId = userId.trim();
  const env = await instance.get("/story/list", { params });
  return Array.isArray(env?.Object) ? env.Object : [];
}

/** Ghi nhận lượt xem story (viewer lấy từ token). Idempotent. Bỏ qua lỗi (không chặn việc xem). */
export async function recordStoryView(storyId) {
  try {
    await instance.post("/story-view/insert", { storyId });
  } catch {
    /* ignore - ghi view lỗi không được cản trở trải nghiệm xem */
  }
}

/** Danh sách người đã xem 1 story (mảng user). */
export async function getStoryViewers(storyId) {
  const env = await instance.get("/story-view/list", { params: { storyId } });
  return Array.isArray(env?.Object) ? env.Object : [];
}

/** Xóa story theo id (chỉ chủ tin — BE kiểm tra bằng token). */
export async function deleteStory(id) {
  try {
    const env = await instance.delete("/story/delete", { data: { id } });
    return env?.Errors?.message || "DELETE STORY SUCCESS";
  } catch (err) {
    throw new Error(extractError(err, "Xóa story thất bại"));
  }
}
