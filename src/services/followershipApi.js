import { instance } from "./api";

// Tầng gọi API kết bạn / theo dõi (FollowershipController, prefix /friendship).
// Envelope BE: interceptor trong api.js đã trả thẳng response.data.

/**
 * Gửi lời mời kết bạn tới targetUserId (id người nhận).
 * Người gửi KHÔNG gửi lên — BE lấy từ token.
 */
export async function sendFriendRequest(targetUserId) {
  return instance.post("/friendship/sendfriendrequest", { targetUserId });
}
