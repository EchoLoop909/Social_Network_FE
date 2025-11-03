import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getThreads, getMessages, sendMessage } from "../services/dmApi";
import { on } from "../services/eventBus";

export const fetchThreads = createAsyncThunk("dm/threads", async () => {
  const { threads } = await getThreads();
  return threads;
});

export const fetchMessages = createAsyncThunk(
  "dm/messages",
  async (threadId) => {
    const { messages } = await getMessages(threadId);
    return { threadId, messages };
  }
);

export const sendMessageThunk = createAsyncThunk(
  "dm/send",
  async ({ threadId, text }) => {
    const { message } = await sendMessage(threadId, text);
    return { threadId, message };
  }
);

const slice = createSlice({
  name: "dm",
  initialState: { threads: [], messagesByThread: {}, current: null, unread: 0 },
  reducers: {
    setCurrent: (s, a) => {
      s.current = a.payload;
      const t = s.threads.find((x) => x.id === a.payload);
      if (t) t.unreadCount = 0;
      s.unread = s.threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);
    },
    pushIncoming: (s, a) => {
      const { threadId, message } = a.payload;
      s.messagesByThread[threadId] = [
        ...(s.messagesByThread[threadId] || []),
        message,
      ];
      const t = s.threads.find((x) => x.id === threadId);
      if (t && s.current !== threadId) t.unreadCount = (t.unreadCount || 0) + 1;
      s.unread = s.threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchThreads.fulfilled, (s, a) => {
      s.threads = a.payload;
      s.unread = a.payload.reduce((acc, t) => acc + (t.unreadCount || 0), 0);
    });
    b.addCase(fetchMessages.fulfilled, (s, a) => {
      s.messagesByThread[a.payload.threadId] = a.payload.messages;
    });
    b.addCase(sendMessageThunk.fulfilled, (s, a) => {
      const { threadId, message } = a.payload;
      s.messagesByThread[threadId] = [
        ...(s.messagesByThread[threadId] || []),
        message,
      ];
    });
  },
});

export const { setCurrent, pushIncoming } = slice.actions;
export default slice.reducer;

// giả lập incoming message
on("dm:new", () => {
  const state = window.__store__?.getState?.();
  const t = state?.dm?.threads?.[0];
  if (!t) return;
  const incoming = {
    id: "m_in_" + Date.now(),
    from: t.partner.id,
    text: "Ping ✉️",
    ts: Date.now(),
  };
  window.__store__?.dispatch(
    pushIncoming({ threadId: t.id, message: incoming })
  );
});
