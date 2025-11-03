import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getNotifications, markAllRead } from "../services/notifApi";
import { on } from "../services/eventBus";

export const fetchNotifs = createAsyncThunk("notif/fetch", async () => {
  const { notifications } = await getNotifications();
  return notifications;
});

export const markAllNotifsRead = createAsyncThunk("notif/markAll", async () => {
  await markAllRead();
  return true;
});

const slice = createSlice({
  name: "notifications",
  initialState: { items: [], unread: 0 },
  reducers: {
    pushNew: (s, a) => {
      s.items.unshift(a.payload);
      s.unread += 1;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchNotifs.fulfilled, (s, a) => {
      s.items = a.payload;
      s.unread = a.payload.filter((n) => !n.read).length;
    });
    b.addCase(markAllNotifsRead.fulfilled, (s) => {
      s.items = s.items.map((n) => ({ ...n, read: true }));
      s.unread = 0;
    });
  },
});

export const { pushNew } = slice.actions;
export default slice.reducer;

// lắng sự kiện realtime
on("notif:new", () => {
  // tạo notif random
  const n = {
    id: "n_" + Date.now(),
    type: "like",
    userId: "u_anna",
    postId: "p1",
    read: false,
    ts: Date.now(),
  };
  window.__store__?.dispatch(pushNew(n));
});
