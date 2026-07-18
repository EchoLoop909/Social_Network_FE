import { instance } from "./api";

// Tầng gọi API bài viết (PostController /post, PostMediaController /post-media).

/**
 * Upload nhiều ảnh/video lên Cloudinary (CHƯA lưu DB) -> trả list media item:
 * [{ url, type, width, height, durationSec, order }]. Thứ tự file = thứ tự hiển thị.
 * Đặt Content-Type undefined để trình duyệt tự set multipart + boundary.
 */
export async function uploadMedia(files) {
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append("files", f));
  const env = await instance.post("/post-media/upload", fd, {
    headers: { "Content-Type": undefined },
    timeout: 120000, // upload ảnh/video lên Cloudinary có thể lâu -> cho 120s riêng
  });
  return Array.isArray(env?.Object) ? env.Object : [];
}

/**
 * Tạo bài viết. dto = { text, visibility, media:[{url,type,width,height,durationSec,order}] }.
 * userId KHÔNG gửi — BE lấy từ token.
 */
export async function createPost({ text, visibility = "PUBLIC", media = [] }) {
  const env = await instance.post("/post/insert", { text, visibility, media });
  return env?.Object?.id || env?.Object?.postId || null; // id bài vừa tạo (để gắn thẻ)
}

/** Danh sách user đã chia sẻ (repost) 1 bài viết. */
export async function getSharers(postId) {
  const env = await instance.get("/post/sharers", { params: { postId } });
  return Array.isArray(env?.Object) ? env.Object : [];
}

/** Sửa bài viết: { id, text, photo, isPinned, visibility }. visibility rỗng = giữ nguyên. */
export async function updatePost({ id, text, photo, isPinned, visibility }) {
  return instance.post("/post/update", { id, text, photo, isPinned, visibility });
}

/** Xoá bài viết theo id. */
export async function deletePost(id) {
  return instance.post("/post/delete", { id });
}

/**
 * Share (repost nội bộ) 1 bài viết. originalPostId = id bài đang bấm share;
 * text = caption riêng của người share (optional). userId KHÔNG gửi — BE lấy từ token.
 */
export async function sharePost({ originalPostId, text }) {
  return instance.post("/post/share", { originalPostId, text });
}
