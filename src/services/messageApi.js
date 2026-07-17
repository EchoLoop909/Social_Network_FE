import { instance } from "./api";

// Tầng gọi API chat (MessageController, prefix /message). Interceptor đã trả thẳng envelope (response.data).

function extractError(err, fallback) {
  const d = err?.response?.data;
  if (!d) return err?.message || fallback;
  if (d.Errors && d.Errors.message) return d.Errors.message;
  if (typeof d.Errors === "string" && d.Errors.trim()) return d.Errors;
  return fallback;
}

/** Tạo/mở hội thoại. participantIds = id người muốn chat (không gồm mình). Trả về object conversation (có id). */
export async function createConversation(participantIds, name) {
  try {
    const env = await instance.post("/message/conversation", { participantIds, name });
    return env?.Object || null;
  } catch (err) {
    throw new Error(extractError(err, "Tạo hội thoại thất bại"));
  }
}

/** Danh sách hội thoại (Inbox) của mình. Trả mảng { conversationId, name, type, lastMessageTime, lastMessage }. */
export async function getConversations(pageIdx = 1, pageSize = 30) {
  const env = await instance.get("/message/conversations", { params: { pageIdx, pageSize } });
  return Array.isArray(env?.Object) ? env.Object : [];
}

/** Lịch sử tin nhắn 1 hội thoại (BE trả mới nhất trước). */
export async function getHistory(conversationId, pageIdx = 1, pageSize = 50) {
  const env = await instance.get("/message/history", { params: { conversationId, pageIdx, pageSize } });
  return Array.isArray(env?.Object) ? env.Object : [];
}

/** Gửi tin nhắn (BE produce Kafka -> consumer lưu + đẩy WebSocket). Chỉ trả message thông báo. */
export async function sendMessage({ conversationId, text, photo, messageType = "TEXT" }) {
  try {
    const env = await instance.post("/message/send", { conversationId, text, photo, messageType });
    return env?.Errors?.message || "SEND OK";
  } catch (err) {
    throw new Error(extractError(err, "Gửi tin thất bại"));
  }
}
