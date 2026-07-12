import { instance } from "./api";

// Tầng gọi API bình luận (CommentController, prefix /comment).

/** Chuẩn hoá 1 Comment entity của BE sang shape UI. */
export function normalizeComment(raw, replyCount = 0) {
  if (!raw) return null;
  const user = raw.user || {};
  return {
    id: raw.id,
    text: raw.text || "",
    ts: raw.createTime ? new Date(raw.createTime).getTime() : Date.now(),
    reactionCount: raw.reactionCount || 0,
    parentId: raw.parentComment ? raw.parentComment.id : null,
    author: {
      id: user.id || "unknown",
      username: user.username || "Người dùng",
      name: `${user.lastname || ""} ${user.firstname || ""}`.trim(),
      avatar: user.photo || `https://ui-avatars.com/api/?name=${user.username || "User"}`,
    },
    replyCount,
  };
}

/** Tạo comment gốc (parentCommentId rỗng) hoặc reply. */
export async function addComment({ postId, text, parentCommentId }) {
  return instance.post("/comment/insert", { postId, text, parentCommentId: parentCommentId || null });
}

/** Danh sách comment GỐC theo bài viết + replyCount. Trả { items, totalPage, totalElements }. */
export async function getRootComments(postId, pageIdx = 1, pageSize = 10) {
  const env = await instance.get("/comment/list", { params: { postId, pageIdx, pageSize } });
  const list = Array.isArray(env?.Object) ? env.Object : [];
  return {
    items: list.map((row) => normalizeComment(row.comment, row.replyCount)).filter(Boolean),
    totalPage: env?.totalPage ?? 1,
    totalElements: env?.totalElements ?? list.length,
  };
}

/** Danh sách reply theo 1 comment gốc. Trả { items, totalPage, totalElements }. */
export async function getReplies(parentCommentId, pageIdx = 1, pageSize = 10) {
  const env = await instance.get("/comment/replies", { params: { parentCommentId, pageIdx, pageSize } });
  const list = Array.isArray(env?.Object) ? env.Object : [];
  return {
    items: list.map((c) => normalizeComment(c)).filter(Boolean),
    totalPage: env?.totalPage ?? 1,
    totalElements: env?.totalElements ?? list.length,
  };
}

/** Sửa comment (chỉ chủ sở hữu — BE kiểm tra theo token). */
export async function updateComment({ commentId, text }) {
  return instance.put("/comment/update", { commentId, text });
}

/** Xoá comment (chỉ chủ sở hữu; xoá gốc sẽ cascade toàn bộ reply). */
export async function deleteComment(commentId) {
  return instance.delete("/comment/delete", { data: { id: commentId } });
}
