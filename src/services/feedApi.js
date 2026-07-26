import { api, instance } from "./api";

// Chuẩn hoá bài GỐC lồng trong 1 lượt share về shape gọn để render "card bên trong".
// Chỉ lấy 1 tầng (không đệ quy tiếp originalPost) — FE giới hạn độ sâu hiển thị.
function normalizeOriginal(raw) {
  if (!raw) return null;
  const user = raw.user || {};
  const media = Array.isArray(raw.mediaList)
    ? raw.mediaList.map((m) => ({
        url: m.mediaUrl,
        type: (m.mediaType || "IMAGE").toUpperCase(),
        width: m.width,
        height: m.height,
      }))
    : [];
  return {
    id: raw.id,
    author: {
      id: user.id || "unknown",
      username: user.username || "Người dùng",
      avatar: user.photo || `https://ui-avatars.com/api/?name=${user.username || "User"}`,
    },
    caption: raw.text || "",
    media,
  };
}

// --- HÀM CHUẨN HÓA DỮ LIỆU ---
function normalizePost(raw) {
  if (!raw) return null;
  const user = raw.user || {};

  // Media BE trả trong mediaList (đã sort theo displayOrder). Chuẩn hoá về { url, type }.
  const media = Array.isArray(raw.mediaList)
    ? raw.mediaList.map((m) => ({
        url: m.mediaUrl,
        type: (m.mediaType || "IMAGE").toUpperCase(), // IMAGE | VIDEO
        width: m.width,
        height: m.height,
      }))
    : [];

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
    media, // list đầy đủ (ảnh/video) để render carousel
    images: media.map((m) => m.url), // tiện cho code cũ chỉ cần URL
    ts: raw.createTime ? new Date(raw.createTime).getTime() : Date.now(),

    // Metadata phục vụ sửa/ghim bài
    postType: raw.postType,
    visibility: raw.visibility,
    isPinned: !!raw.isPinned,

    // Số liệu thật từ BE (denormalized counter)
    likes: raw.reactionCount || 0,
    commentCount: raw.commentCount || 0,
    shareCount: raw.shareCount || 0,

    // Thông tin share (repost nội bộ)
    isShared: !!raw.isShared,
    // Bài gốc lồng bên trong (null nếu là bài thường HOẶC gốc đã bị xoá)
    original: raw.originalPost ? normalizeOriginal(raw.originalPost) : null,
    // true khi đây là 1 lượt share nhưng bài gốc đã bị xoá -> hiển thị "gốc không còn tồn tại"
    originalLost: !!raw.isShared && !raw.originalPost,

    // myReaction cập nhật sau khi gọi /like/my-reaction (null = chưa thả)
    myReaction: null,
    savedByMe: false,
    comments: [],
  };
}

// --- HÀM GỌI API ---
/**
 * Trang chủ dùng GỢI Ý AI (GET /post/recommend). BE tự nhớ (bảng post_impressions) những
 * bài đã gợi ý cho user trong 24h gần nhất và loại chúng khỏi lần gợi ý sau -> gọi lại API
 * này khi cuộn hết trang sẽ tự nhiên ra bài KHÁC, không lặp lại y hệt lô cũ.
 * Nếu recommend lỗi -> fallback về danh sách bài thường để trang chủ không trống.
 */
const RECOMMEND_LIMIT = 50;

export async function getFeed({ cursor = 0, limit = 20 } = {}) {
  const pageIdx = (!cursor || cursor <= 0) ? 1 : cursor;

  try {
    const data = await instance.get("/post/recommend", {
      params: { limit: RECOMMEND_LIMIT },
    });
    const list = data && Array.isArray(data.Object) ? data.Object : [];
    const posts = list.map(normalizePost).filter(Boolean);
    // Còn bài (BE loại bớt bài đã gợi ý gần đây rồi mà vẫn đủ limit) -> có thể còn trang sau.
    const nextCursor = posts.length >= RECOMMEND_LIMIT ? pageIdx + 1 : null;
    return { posts, nextCursor };
  } catch (err) {
    console.error("Lỗi getFeed (recommend), fallback danh sách thường:", err);
    // Fallback: dùng API bài viết thường (có phân trang thật) nếu recommend lỗi
    try {
      const data = await api.getPosts(pageIdx, RECOMMEND_LIMIT);
      const list = data && Array.isArray(data.Object) ? data.Object : [];
      const posts = list.map(normalizePost).filter(Boolean);
      const nextCursor = posts.length >= RECOMMEND_LIMIT ? pageIdx + 1 : null;
      return { posts, nextCursor };
    } catch (e) {
      throw e;
    }
  }
}

/**
 * REELS: lấy danh sách bài VIDEO (BE lọc post_type='VIDEO' + quyền xem).
 * Trả về { posts, nextCursor } giống getFeed để dễ phân trang vô hạn.
 */
export async function getReels({ cursor = 1, limit = 10 } = {}) {
  const pageIdx = (!cursor || cursor <= 0) ? 1 : cursor;
  try {
    const data = await instance.get("/post/reels", {
      params: { pageIdx, pageSize: limit },
    });
    const list = data && Array.isArray(data.Object) ? data.Object : [];
    const posts = list.map(normalizePost).filter(Boolean);
    const nextCursor = list.length >= limit ? pageIdx + 1 : null; // hết trang -> null
    return { posts, nextCursor };
  } catch (err) {
    console.error("Lỗi getReels:", err);
    throw err;
  }
}

/**
 * Báo cho BE các bài THỰC SỰ đã lướt thấy trên màn hình (gộp theo lô từ seenTracker) ->
 * BE ghi nhận, loại khỏi ứng viên /post/recommend trong 24h tới. Lỗi thì bỏ qua im lặng
 * (chỉ là tín hiệu phụ, không ảnh hưởng trải nghiệm chính nếu gọi thất bại).
 */
export async function markPostsSeen(postIds) {
  if (!Array.isArray(postIds) || postIds.length === 0) return;
  try {
    await instance.post("/post/mark-seen", { postIds });
  } catch (err) {
    console.error("Lỗi markPostsSeen:", err);
  }
}

/**
 * Danh sách bài viết theo hashtag (dùng cho trang /hashtag/:name). name không cần dấu #.
 */
export async function getPostsByHashtag(name, { cursor = 1, limit = 20 } = {}) {
  const pageIdx = (!cursor || cursor <= 0) ? 1 : cursor;
  const data = await instance.get("/post/by-hashtag", {
    params: { name, pageIdx, pageSize: limit },
  });
  const list = data && Array.isArray(data.Object) ? data.Object : [];
  const posts = list.map(normalizePost).filter(Boolean);
  const nextCursor = list.length >= limit ? pageIdx + 1 : null;
  return { posts, nextCursor };
}

/**
 * Lấy 1 bài viết theo id (dùng cho trang chi tiết /post/:id).
 * BE hỗ trợ lọc theo id qua GET /post/GetlistPost?id=... -> trả mảng trong .Object.
 * Trả về post đã chuẩn hoá, hoặc null nếu không tìm thấy.
 */
export async function getPostById(id) {
  const data = await instance.get("/post/GetlistPost", {
    params: { id, pageIdx: 1, pageSize: 1 },
  });
  const list = data && Array.isArray(data.Object) ? data.Object : [];
  return list.length ? normalizePost(list[0]) : null;
}