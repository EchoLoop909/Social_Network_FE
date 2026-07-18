import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchNotifList, fetchUnreadCount, markAllRead, markRead } from "../services/notifApi";

// Tải danh sách thông báo của mình
export const fetchNotifs = createAsyncThunk("notif/fetch", async () => {
  return await fetchNotifList();
});

// Tải số chưa đọc (cho badge chuông)
export const fetchUnread = createAsyncThunk("notif/unread", async () => {
  return await fetchUnreadCount();
});

// Đánh dấu tất cả đã đọc
export const markAllNotifsRead = createAsyncThunk("notif/markAll", async () => {
  await markAllRead();
  return true;
});

// Đánh dấu 1 thông báo đã đọc
export const markOneRead = createAsyncThunk("notif/markOne", async (id) => {
  await markRead(id);
  return id;
});

const slice = createSlice({
  name: "notifications",
  initialState: { items: [], unread: 0 },
  reducers: {
    // Nhận thông báo real-time đẩy về qua WebSocket
    pushNew: (s, a) => {
      s.items.unshift(a.payload);
      s.unread += 1;
    },
    setUnread: (s, a) => {
      s.unread = a.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchNotifs.fulfilled, (s, a) => {
      s.items = a.payload;
    });
    b.addCase(fetchUnread.fulfilled, (s, a) => {
      s.unread = a.payload;
    });
    b.addCase(markAllNotifsRead.fulfilled, (s) => {
      s.items = s.items.map((n) => ({ ...n, isRead: true }));
      s.unread = 0;
    });
    b.addCase(markOneRead.fulfilled, (s, a) => {
      const n = s.items.find((x) => x.id === a.payload);
      if (n && !n.isRead) {
        n.isRead = true;
        s.unread = Math.max(0, s.unread - 1);
      }
    });
  },
});

export const { pushNew, setUnread } = slice.actions;
export default slice.reducer;
