import { instance } from "./api";

// Gắn thẻ (nhắc đến) người dùng vào bài (PostUserTagController, prefix /post-user-tag).

/** Gắn 1 user vào bài. Người được gắn nhận thông báo TAG. */
export async function addUserTag(postId, userId) {
  return instance.post("/post-user-tag/insert", { postId, userId });
}

/** Danh sách user được gắn thẻ trong 1 bài. */
export async function getUserTags(postId) {
  const env = await instance.get("/post-user-tag/list", { params: { postId } });
  return Array.isArray(env?.Object) ? env.Object : [];
}

/** Gỡ thẻ 1 user khỏi bài. */
export async function removeUserTag(postId, userId) {
  return instance.delete("/post-user-tag/delete", { data: { postId, userId } });
}

/** Danh sách bài mà 1 user được gắn thẻ (tab "Được gắn thẻ"). */
export async function getTaggedPosts(userId) {
  const env = await instance.get("/post-user-tag/tagged", { params: userId ? { userId } : {} });
  return Array.isArray(env?.Object) ? env.Object : [];
}
