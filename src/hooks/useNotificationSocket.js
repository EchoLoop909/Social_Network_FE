import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { emit } from "../services/eventBus";
import { connectChat } from "../services/chatSocket";
import { fetchUnread, pushNew } from "../store/notifSlice";
import {
  getStoredTokens,
  clearTokens,
  logoutFromKeycloak,
  setAccountLockedMessage,
} from "../services/authApi";
import { logout } from "../store/authSlice";

/**
 * Tải số thông báo chưa đọc + mở WebSocket nghe kênh riêng /topic/notifications/{meId}.
 * Dùng chung cho MainLayout (user) và AdminPage (admin) — cả hai chỉ là 1 User với recipientId
 * khác nhau, cùng 1 notification engine ở BE.
 */
export function useNotificationSocket() {
  const dispatch = useDispatch();

  const meId = useMemo(() => {
    try {
      const t = getStoredTokens();
      if (!t?.access_token) return null;
      const b64 = t.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(b64))?.sub || null;
    } catch { return null; }
  }, []);

  const notifClientRef = useRef(null);
  const [notifConnected, setNotifConnected] = useState(false);

  useEffect(() => {
    if (!meId) return;
    dispatch(fetchUnread());
    notifClientRef.current = connectChat(() => setNotifConnected(true));
    return () => { try { notifClientRef.current?.deactivate(); } catch { /* ignore */ } };
  }, [meId, dispatch]);

  useEffect(() => {
    if (!notifConnected || !meId || !notifClientRef.current) return;
    const sub = notifClientRef.current.subscribe(`/topic/notifications/${meId}`, (frame) => {
      try {
        const n = JSON.parse(frame.body);
        if (n?.type === "FRIENDSHIP_SYNC") { emit("friendship:changed", n); return; }
        if (n?.type === "ACCOUNT_SUSPENDED") {
          setAccountLockedMessage(n.message);
          logoutFromKeycloak();
          clearTokens();
          dispatch(logout());
          return;
        }
        dispatch(pushNew(n));
        if (n?.type === "FOLLOW" || n?.type === "FOLLOW_REQUEST") emit("friendship:changed", n);
      } catch { /* ignore */ }
    });
    return () => { try { sub.unsubscribe(); } catch { /* ignore */ } };
  }, [notifConnected, meId, dispatch]);

  return { meId };
}
