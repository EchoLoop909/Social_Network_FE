import { instance } from "./api";

// Tầng gọi API cảm xúc (LikeController, prefix /like). targetType: "POST" | "COMMENT".
// Envelope BE: interceptor trong api.js đã trả thẳng response.data, payload nằm ở .Object

/** Thả / đổi cảm xúc. reactionType: LIKE|HEART|HAHA|WOW|SAD|ANGRY */
export async function react(targetType, targetId, reactionType) {
  const env = await instance.post("/like/react", { targetType, targetId, reactionType });
  return env;
}

/** Gỡ cảm xúc của user hiện tại cho 1 đối tượng (axios DELETE cần body qua `data`). */
export async function unlike(targetType, targetId) {
  const env = await instance.delete("/like/unlike", { data: { targetType, targetId } });
  return env;
}

/** Cảm xúc hiện tại của user đăng nhập cho 1 đối tượng -> trả về chuỗi reactionType hoặc null. */
export async function getMyReaction(targetType, targetId) {
  const env = await instance.get("/like/my-reaction", { params: { targetType, targetId } });
  return env?.Object?.reactionType ?? null;
}

/** Danh sách người đã react + thống kê theo loại: { likes:[...], reactionSummary:{LIKE:12,...} } */
export async function getReactions(targetType, targetId, pageIdx = 1, pageSize = 20) {
  const env = await instance.get("/like/list", {
    params: { targetType, targetId, pageIdx, pageSize },
  });
  return env?.Object ?? { likes: [], reactionSummary: {} };
}
