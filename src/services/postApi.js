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
  });
  return Array.isArray(env?.Object) ? env.Object : [];
}

/**
 * Tạo bài viết. dto = { text, visibility, media:[{url,type,width,height,durationSec,order}] }.
 * userId KHÔNG gửi — BE lấy từ token.
 */
export async function createPost({ text, visibility = "PUBLIC", media = [] }) {
  return instance.post("/post/insert", { text, visibility, media });
}

/** Sửa bài viết: { id, text, photo, isPinned, visibility }. visibility rỗng = giữ nguyên. */
export async function updatePost({ id, text, photo, isPinned, visibility }) {
  return instance.post("/post/update", { id, text, photo, isPinned, visibility });
}

/** Xoá bài viết theo id. */
export async function deletePost(id) {
  return instance.post("/post/delete", { id });
}
