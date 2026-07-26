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

/** Đánh dấu đã đọc hội thoại (tới tin mới nhất). */
export async function markRead(conversationId) {
  try {
    await instance.post("/message/read", null, { params: { conversationId } });
  } catch (err) {
    // Trước đây nuốt lỗi im lặng -> không biết vì sao "đã đọc" không lưu được xuống DB.
    // Giờ log ra Console để còn thấy lỗi thật (401/403/...) thay vì chỉ tưởng là đã lưu.
    console.error("markRead thất bại:", extractError(err, "Không rõ lỗi"));
  }
}

/** Trạng thái đã đọc của thành viên khác: [{ userId, username, photo, lastReadMessageId }]. */
export async function getReadState(conversationId) {
  try {
    const env = await instance.get("/message/read-state", { params: { conversationId } });
    return Array.isArray(env?.Object) ? env.Object : [];
  } catch {
    return [];
  }
}

/** Gửi tin nhắn (BE produce Kafka -> consumer lưu + đẩy WebSocket). Chỉ trả message thông báo.
 *  replyToMessageId: tùy chọn — id tin nhắn đang được trả lời (cùng hội thoại). */
export async function sendMessage({ conversationId, text, photo, messageType = "TEXT", replyToMessageId }) {
  try {
    const env = await instance.post("/message/send", { conversationId, text, photo, messageType, replyToMessageId });
    return env?.Errors?.message || "SEND OK";
  } catch (err) {
    throw new Error(extractError(err, "Gửi tin thất bại"));
  }
}

/** Sửa nội dung 1 tin nhắn — chỉ chủ tin nhắn. */
export async function editMessage(id, text) {
  try {
    await instance.put("/message/update", { id, text });
  } catch (err) {
    throw new Error(extractError(err, "Sửa tin nhắn thất bại"));
  }
}

/** Xóa CỨNG 1 tin nhắn khỏi DB — chỉ chủ tin nhắn. */
export async function deleteMessage(id) {
  try {
    await instance.delete("/message/delete", { data: { id } });
  } catch (err) {
    throw new Error(extractError(err, "Xóa tin nhắn thất bại"));
  }
}

/** Rời nhóm (chỉ hội thoại GROUP). */
export async function leaveGroup(conversationId) {
  try {
    await instance.delete("/message/leave-group", { params: { conversationId } });
  } catch (err) {
    throw new Error(extractError(err, "Rời nhóm thất bại"));
  }
}

/** Thêm thành viên vào nhóm — bất kỳ thành viên nào cũng thêm được (không chỉ trưởng nhóm). */
export async function addParticipants(conversationId, userIds) {
  try {
    await instance.post("/message/add-participants", { conversationId, userIds });
  } catch (err) {
    throw new Error(extractError(err, "Thêm thành viên thất bại"));
  }
}

/** Xóa cả nhóm — CHỈ trưởng nhóm (người tạo). Xóa cứng hết tin nhắn trong nhóm. */
export async function deleteGroup(conversationId) {
  try {
    await instance.delete("/message/delete-group", { params: { conversationId } });
  } catch (err) {
    throw new Error(extractError(err, "Xóa nhóm thất bại"));
  }
}
