import { markPostsSeen } from "../services/feedApi";

// Gom các postId THỰC SỰ lướt thấy (từ IntersectionObserver ở PostCard) vào 1 hàng đợi
// chung, debounce lại rồi gửi 1 lượt duy nhất lên BE — tránh mỗi bài gọi API riêng khi
// cuộn nhanh qua nhiều bài liên tiếp.
const DEBOUNCE_MS = 1500;
let queue = new Set();
let timer = null;

function flush() {
  timer = null;
  if (queue.size === 0) return;
  const ids = Array.from(queue);
  queue = new Set();
  markPostsSeen(ids);
}

/** Đánh dấu 1 bài vừa lướt thấy (gọi từ PostCard khi lọt vào khung nhìn LẦN ĐẦU). */
export function markSeen(postId) {
  if (!postId) return;
  queue.add(postId);
  if (timer == null) {
    timer = setTimeout(flush, DEBOUNCE_MS);
  }
}
