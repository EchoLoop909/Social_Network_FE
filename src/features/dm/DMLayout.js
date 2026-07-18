import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  Search, SquarePen, ChevronDown, Send, Phone, Video, Info,
  Smile, Mic, Image as ImageIcon, Sticker, Loader2,
} from "lucide-react";
import axios from "axios";
import { getConversations, getHistory, sendMessage, createConversation } from "../../services/messageApi";
import { searchUsers } from "../../services/followershipApi";
import { connectChat } from "../../services/chatSocket";
import { useNavigate } from "react-router-dom";
import { getStoredTokens } from "../../services/authApi";
import { BE_URL } from "../../config";

const PLACEHOLDER = "https://via.placeholder.com/56?text=?";

function displayName(u) {
  if (!u) return "Người dùng";
  const full = [u.lastname, u.firstname].filter(Boolean).join(" ").trim();
  return full || u.name || u.username || "Người dùng";
}
function fmtClock(dt) {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch { return ""; }
}
function fmtDaySep(dt) {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString("en-US", {
      month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  } catch { return ""; }
}
function fmtAgo(dt) {
  if (!dt) return "";
  try {
    const diff = Math.max(0, Date.now() - new Date(dt).getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    const w = Math.floor(d / 7);
    return `${w}w`;
  } catch { return ""; }
}

export default function DMLayout() {
  const meAuth = useMemo(() => {
    try {
      const t = JSON.parse(localStorage.getItem("auth_tokens") || "null");
      if (!t?.access_token) return {};
      return JSON.parse(atob(t.access_token.split(".")[1])) || {};
    } catch { return {}; }
  }, []);
  const meId = meAuth?.sub || null;
  const meName = meAuth?.preferred_username || meAuth?.name || "you";

  const [mePhoto, setMePhoto] = useState(null);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  // Tạo chat mới bằng tìm người
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const endRef = useRef(null);
  const searchRef = useRef(null);

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      setConversations(await getConversations());
    } catch (e) {
      setErr(e?.message || "Tải hội thoại thất bại");
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  // Lấy avatar của mình để hiển thị "Your note"
  useEffect(() => {
    const token = getStoredTokens()?.access_token;
    if (!token || !meId) return;
    axios
      .get(`${BE_URL}/auth/getuser`, { params: { userId: meId }, headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const list = res?.data?.Object;
        const me = Array.isArray(list) ? (list.find((u) => u.id === meId) || list[0]) : null;
        if (me?.photo) setMePhoto(me.photo);
      })
      .catch(() => {});
  }, [meId]);

  // Mount: nạp danh sách hội thoại + kết nối WebSocket
  useEffect(() => {
    loadConversations();
    clientRef.current = connectChat(() => setConnected(true));
    return () => { try { clientRef.current?.deactivate(); } catch { /* ignore */ } };
  }, [loadConversations]);

  // Subscribe topic của hội thoại đang mở (khi đã kết nối)
  useEffect(() => {
    if (!connected || !activeId || !clientRef.current) return;
    const sub = clientRef.current.subscribe(`/topic/conversation/${activeId}`, (frame) => {
      try {
        const msg = JSON.parse(frame.body);
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      } catch { /* ignore */ }
    });
    return () => { try { sub.unsubscribe(); } catch { /* ignore */ } };
  }, [connected, activeId]);

  // Tự cuộn xuống cuối khi có tin mới
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Tìm người để tạo chat (debounce 400ms)
  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const list = await searchUsers(q);
        setResults((meId ? list.filter((u) => u.id !== meId) : list).slice(0, 6));
      } catch { /* ignore */ } finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [query, meId]);

  const openConversation = async (id) => {
    setActiveId(id);
    setLoadingMsgs(true);
    setErr("");
    try {
      const list = await getHistory(id);   // BE trả mới nhất trước
      setMessages([...list].reverse());     // đảo lại: cũ trên, mới dưới
    } catch (e) {
      setErr(e?.message || "Tải tin nhắn thất bại");
    } finally {
      setLoadingMsgs(false);
    }
  };

  const onSend = async () => {
    const t = text.trim();
    if (!t || !activeId) return;
    setSending(true);
    setErr("");
    try {
      await sendMessage({ conversationId: activeId, text: t });
      setText("");
      // Tin sẽ hiện khi consumer đẩy về qua WebSocket (real-time).
    } catch (e) {
      setErr(e?.message || "Gửi tin thất bại");
    } finally {
      setSending(false);
    }
  };

  const startChat = async (user) => {
    setErr("");
    try {
      const conv = await createConversation([user.id]);
      const cid = conv?.conversationId || conv?.id;
      setQuery(""); setResults([]);
      await loadConversations();
      if (cid) openConversation(cid);
    } catch (e) {
      setErr(e?.message || "Tạo hội thoại thất bại");
    }
  };

  // Thông tin hiển thị của 1 hội thoại (avatar + tên). Chat 1-1 dùng otherUser từ BE.
  const convView = (c) => {
    if (c?.otherUser) {
      return {
        title: c.otherUser.name || c.otherUser.username || "Người dùng",
        avatar: c.otherUser.photo || PLACEHOLDER,
      };
    }
    return {
      title: c?.name || c?.lastMessage?.senderName || ("Cuộc trò chuyện " + String(c?.conversationId).slice(0, 6)),
      avatar: PLACEHOLDER,
    };
  };

  const activeConv = conversations.find((c) => c.conversationId === activeId);
  const activeView = activeConv ? convView(activeConv) : null;
  const focusSearch = () => searchRef.current?.focus();

  return (
    <div className="flex h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* ===== Cột danh sách hội thoại ===== */}
      <aside className="w-[397px] shrink-0 border-r border-gray-200 dark:border-neutral-800 flex flex-col">
        {/* Header username + soạn tin */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <button className="flex items-center gap-1 text-xl font-bold">
            {meName} <ChevronDown size={18} />
          </button>
          <button className="p-1 hover:opacity-60" title="New message" onClick={focusSearch}>
            <SquarePen size={24} />
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="px-6 py-2 relative">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-sm focus:outline-none placeholder-gray-500"
            />
          </div>
          {query.trim() && (
            <div className="absolute left-6 right-6 z-20 mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-72 overflow-y-auto">
              {searching ? (
                <div className="p-3 text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Đang tìm...</div>
              ) : results.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">Không tìm thấy.</div>
              ) : (
                results.map((u) => (
                  <button key={u.id} onClick={() => startChat(u)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left">
                    <img src={u.photo || PLACEHOLDER} alt="" className="w-9 h-9 rounded-full object-cover bg-gray-200" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{u.username}</div>
                      <div className="text-xs text-gray-500 truncate">{displayName(u)}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Your note */}
        <div className="px-6 pt-3 pb-1">
          <div className="flex flex-col items-center w-[72px]">
            <div className="relative">
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] px-2 py-1 rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 shadow-sm">
                What's new...
              </span>
              <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                <img src={mePhoto || "https://via.placeholder.com/56"} alt="" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black" />
              </div>
            </div>
            <span className="text-xs mt-1 text-gray-600 dark:text-gray-300">Your note</span>
          </div>
        </div>

        {/* Tabs Messages / Requests */}
        <div className="px-6 pt-3 pb-2 flex items-center justify-between">
          <span className="font-bold text-[15px]">Messages</span>
          <button className="text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white">Requests</button>
        </div>

        {/* Danh sách hội thoại */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 text-gray-500 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Đang tải...</div>
          ) : conversations.length === 0 ? (
            <div className="px-6 py-4 text-sm text-gray-500">Chưa có hội thoại. Tìm người ở trên để bắt đầu.</div>
          ) : (
            conversations.map((c) => {
              const v = convView(c);
              const preview = c.lastMessage ? (c.lastMessage.text || "Đã gửi ảnh") : "Chưa có tin nhắn";
              const active = activeId === c.conversationId;
              return (
                <button key={c.conversationId} onClick={() => openConversation(c.conversationId)}
                  className={`w-full flex items-center gap-3 px-6 py-2 text-left hover:bg-gray-50 dark:hover:bg-neutral-900 ${active ? "bg-gray-100 dark:bg-neutral-800" : ""}`}>
                  <img src={v.avatar} alt="" className="w-14 h-14 rounded-full object-cover bg-gray-200 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{v.title}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {preview}
                      {c.lastMessageTime ? <span> · {fmtAgo(c.lastMessageTime)}</span> : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ===== Cột chat ===== */}
      <main className="flex-1 flex flex-col min-w-0">
        {err && <div className="m-3 rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">{err}</div>}

        {!activeId ? (
          /* Trạng thái trống */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="w-24 h-24 rounded-full border-2 border-black dark:border-white flex items-center justify-center">
              <Send size={44} strokeWidth={1.2} />
            </div>
            <div className="text-xl mt-1">Your messages</div>
            <div className="text-sm text-gray-500">Send a message to start a chat.</div>
            <button onClick={focusSearch}
              className="mt-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
              Send message
            </button>
            {!connected && <div className="text-xs text-gray-400 mt-1">(đang kết nối real-time...)</div>}
          </div>
        ) : (
          <>
            {/* Header hội thoại */}
            <div className="h-[74px] px-4 flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 shrink-0">
              <div className="flex items-center gap-3 min-w-0 cursor-pointer"
                   onClick={() => activeConv?.otherUser?.id && navigate(`/u/${activeConv.otherUser.id}`)}>
                <img src={activeView?.avatar || PLACEHOLDER} alt="" className="w-11 h-11 rounded-full object-cover bg-gray-200" />
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate hover:underline">{activeView?.title}</div>
                  <div className="text-xs text-gray-500">Active now</div>
                </div>
              </div>
              <div className="flex items-center gap-5 text-black dark:text-white">
                <button className="hover:opacity-60"><Phone size={22} /></button>
                <button className="hover:opacity-60"><Video size={24} /></button>
                <button className="hover:opacity-60"><Info size={24} /></button>
              </div>
            </div>

            {/* Vùng tin nhắn */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-1">
              {loadingMsgs ? (
                <div className="text-gray-500 flex items-center gap-2 justify-center py-10"><Loader2 className="animate-spin" size={16} /> Đang tải tin...</div>
              ) : messages.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-10">Chưa có tin nhắn. Gõ gì đó để bắt đầu.</div>
              ) : (
                messages.map((m, i) => {
                  const mine = m.senderId === meId;
                  const prev = messages[i - 1];
                  const newDay = !prev || new Date(prev.createTime).toDateString() !== new Date(m.createTime).toDateString();
                  return (
                    <React.Fragment key={m.id}>
                      {newDay && (
                        <div className="text-center text-[11px] text-gray-400 my-3">{fmtDaySep(m.createTime)}</div>
                      )}
                      <div className={`flex items-end gap-2 max-w-[70%] ${mine ? "self-end flex-row-reverse" : "self-start"}`}>
                        {!mine && (
                          <img src={activeView?.avatar || PLACEHOLDER} alt="" className="w-6 h-6 rounded-full object-cover bg-gray-200 shrink-0" />
                        )}
                        <div
                          title={fmtClock(m.createTime)}
                          className={`px-3.5 py-2 rounded-3xl text-sm break-words ${mine ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-neutral-800"}`}>
                          {m.text || (m.photo ? <img src={m.photo} alt="" className="max-w-[220px] rounded-lg" /> : "")}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Thanh nhập */}
            <div className="px-4 pb-5 pt-1 shrink-0">
              <div className="flex items-center gap-3 border border-gray-300 dark:border-neutral-700 rounded-full px-4 py-2.5">
                <button className="hover:opacity-60 shrink-0"><Smile size={24} /></button>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                  placeholder="Message..."
                  className="flex-1 bg-transparent outline-none text-sm placeholder-gray-500"
                />
                {text.trim() ? (
                  <button onClick={onSend} disabled={sending}
                    className="text-blue-500 font-semibold text-sm hover:text-blue-600 disabled:opacity-50 shrink-0">
                    {sending ? <Loader2 size={16} className="animate-spin" /> : "Send"}
                  </button>
                ) : (
                  <div className="flex items-center gap-4 text-black dark:text-white shrink-0">
                    <button className="hover:opacity-60"><Mic size={24} /></button>
                    <button className="hover:opacity-60"><ImageIcon size={24} /></button>
                    <button className="hover:opacity-60"><Sticker size={24} /></button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
