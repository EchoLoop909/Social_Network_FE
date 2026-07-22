import { getFriends, getSentRequests } from "./followershipApi";

// Cache quan hệ của user đang đăng nhập (bạn bè + đang theo dõi) — nạp 1 lần, dùng lại
// cho mọi PostCard trong feed để không gọi API lặp lại từng card.
let cache = null;

export function loadRelationship(force = false) {
  if (!cache || force) {
    cache = Promise.all([
      getFriends().catch(() => []),        // ACCEPTED = bạn bè
      getSentRequests().catch(() => []),   // lời mời đã gửi = đang theo dõi (1 chiều)
    ]).then(([friends, sent]) => ({
      friendIds: new Set((friends || []).map((u) => u.id)),
      followingIds: new Set((sent || []).map((u) => u.id)),
    })).catch(() => ({ friendIds: new Set(), followingIds: new Set() }));
  }
  return cache;
}

// Gọi khi quan hệ thay đổi (vd vừa gửi lời mời) để lần sau nạp lại.
export function invalidateRelationship() {
  cache = null;
}
