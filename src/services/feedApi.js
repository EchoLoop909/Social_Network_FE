import { api } from "./api";

// --- HÀM CHUẨN HÓA DỮ LIỆU ---
function normalizePost(raw) {
  if (!raw) return null;
  const user = raw.user || {};

  return {
    id: raw.id,
    authorId: user.id || "unknown",

    // Map thông tin User
    author: {
      id: user.id || "unknown",
      username: user.username || "Người dùng",
      name: (user.lastname || "") + " " + (user.firstname || ""),
      avatar: user.photo || `https://ui-avatars.com/api/?name=${user.username || "User"}`,
    },

    // Map nội dung bài viết
    caption: raw.text || "",
    images: raw.photo ? [raw.photo] : [],
    ts: raw.createTime ? new Date(raw.createTime).getTime() : Date.now(),

    // Các trường fake để UI không lỗi
    likes: 0,
    likedByMe: false,
    savedByMe: false,
    comments: [],
  };
}

// --- HÀM GỌI API ---
export async function getFeed({ cursor = 0, limit = 20 } = {}) {
  // SỬA LỖI PHÂN TRANG:
  // Nếu cursor <= 0 -> gửi 1. Backend sẽ trừ 1 thành 0.
  const pageIdx = (!cursor || cursor <= 0) ? 1 : cursor;

  try {
    const data = await api.getPosts(pageIdx, limit);

    let list = [];
    // Tìm mảng trong .Object
    if (data && Array.isArray(data.Object)) {
      list = data.Object;
    }

    const normalizedPosts = list.map(normalizePost).filter(Boolean);

    // Tính trang tiếp theo
    const nextCursor = list.length > 0 ? pageIdx + 1 : null;

    return { posts: normalizedPosts, nextCursor };

  } catch (err) {
    console.error("Lỗi:", err);
    throw err;
  }
}