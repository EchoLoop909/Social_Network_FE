import { instance } from "./api";

// Tầng gọi API lưu bài (BookmarkController, prefix /bookmark). Interceptor trả thẳng envelope.

/** Lưu / bỏ lưu 1 bài (toggle). Trả về trạng thái mới: true = đã lưu, false = đã bỏ. */
export async function toggleBookmark(postId) {
  const env = await instance.post("/bookmark/toggle", { postId });
  return !!env?.Object?.saved;
}

/** Danh sách bài đã lưu của mình (trả về mảng Post — cùng shape với /post/GetlistPost). */
export async function getSavedPosts(pageIdx = 1, pageSize = 30) {
  const env = await instance.get("/bookmark/list", { params: { pageIdx, pageSize } });
  return Array.isArray(env?.Object) ? env.Object : [];
}

/** Danh sách id bài đã lưu (để tô nút đã lưu ở feed). */
export async function getSavedIds() {
  try {
    const env = await instance.get("/bookmark/ids");
    return Array.isArray(env?.Object) ? env.Object : [];
  } catch {
    return [];
  }
}
