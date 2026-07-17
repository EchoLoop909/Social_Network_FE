import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Send, Search, Loader2, MessagesSquare } from "lucide-react";
import { getConversations, getHistory, sendMessage, createConversation } from "../../services/messageApi";
import { searchUsers } from "../../services/followershipApi";
import { connectChat } from "../../services/chatSocket";

const PLACEHOLDER = "https://via.placeholder.com/48?text=?";

function displayName(u) {
  if (!u) return "Người dùng";
  const full = [u.lastname, u.firstname].filter(Boolean).join(" ").trim();
  return full || u.name || u.username || "Người dùng";
}
function fmtTime(dt) {
  if (!dt) return "";
  try { return new Date(dt).toLocaleString("vi-VN"); } catch { return ""; }
}

export default function DMLayout() {
  const meId = useMemo(() => {
    try {
      const t = JSON.parse(localStorage.getItem("auth_tokens") || "null");
      if (!t?.access_token) return null;
      return JSON.parse(atob(t.access_token.split(".")[1]))?.sub || null;
    } catch { return null; }
  }, []);

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

  const convLabel = (c) =>
    c.name || c.lastMessage?.senderName || ("Cuộc trò chuyện " + String(c.conversationId).slice(0, 6));

  return (
    <div className="flex h-[calc(100vh-40px)] w-full border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
      {/* ===== Cột trái ===== */}
      <aside className="w-[340px] shrink-0 border-r border-gray-200 dark:border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
          <h1 className="text-lg font-bold mb-3">Tin nhắn</h1>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm người để nhắn tin..."
              className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {query.trim() && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searching ? (
                  <div className="p-3 text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Đang tìm...</div>
                ) : results.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">Không tìm thấy.</div>
                ) : (
                  results.map((u) => (
                    <button key={u.id} onClick={() => startChat(u)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 text-left">
                      <img src={u.photo || PLACEHOLDER} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-200" />
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
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 text-gray-500 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Đang tải...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Chưa có hội thoại. Tìm người ở trên để bắt đầu.</div>
          ) : (
            conversations.map((c) => (
              <button key={c.conversationId} onClick={() => openConversation(c.conversationId)}
                className={`w-full flex flex-col items-start px-4 py-3 border-b border-gray-100 dark:border-neutral-800 text-left hover:bg-gray-50 dark:hover:bg-neutral-800
                  ${activeId === c.conversationId ? "bg-blue-50 dark:bg-neutral-800" : ""}`}>
                <div className="font-semibold text-sm truncate w-full">{convLabel(c)}</div>
                <div className="text-xs text-gray-500 truncate w-full">
                  {c.lastMessage ? (c.lastMessage.text || "[ảnh]") : "Chưa có tin nhắn"}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ===== Cột phải: khung chat ===== */}
      <main className="flex-1 flex flex-col min-w-0">
        {err && <div className="m-3 rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">{err}</div>}

        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <MessagesSquare size={56} strokeWidth={1.2} />
            <div className="text-sm">Chọn một hội thoại hoặc tìm người để bắt đầu nhắn tin.</div>
            {!connected && <div className="text-xs text-gray-400">(đang kết nối real-time...)</div>}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {loadingMsgs ? (
                <div className="text-gray-500 flex items-center gap-2 justify-center py-10"><Loader2 className="animate-spin" size={16} /> Đang tải tin...</div>
              ) : messages.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-10">Chưa có tin nhắn. Gõ gì đó để bắt đầu.</div>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === meId;
                  return (
                    <div key={m.id} className={`flex flex-col max-w-[75%] ${mine ? "self-end items-end" : "self-start items-start"}`}>
                      {!mine && <span className="text-[11px] text-gray-400 ml-1">{m.senderName}</span>}
                      <div className={`px-3 py-2 rounded-2xl text-sm break-words ${mine ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-neutral-700"}`}>
                        {m.text || (m.photo ? <img src={m.photo} alt="" className="max-w-[200px] rounded" /> : "")}
                      </div>
                      <span className="text-[10px] text-gray-400 mx-1">{fmtTime(m.createTime)}</span>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-gray-200 dark:border-neutral-800 p-3 flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={onSend} disabled={sending || !text.trim()}
                className="bg-blue-600 text-white rounded-full p-2.5 hover:bg-blue-700 disabled:opacity-50">
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
