import { instance } from "./api";

// Tầng gọi API hashtag thật (HashtagController, prefix /hashtag).

/** Tìm hashtag khớp từ khóa (không cần dấu #), sắp xếp theo số bài viết giảm dần (xu hướng). */
export async function searchHashtags(keyword, pageIdx = 1, pageSize = 10) {
  const data = await instance.get("/hashtag/list", {
    params: { keyword, pageIdx, pageSize },
  });
  return data && Array.isArray(data.Object) ? data.Object : [];
}
