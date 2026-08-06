import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  Search, SquarePen, ChevronDown, Send, Info,
  Smile, Mic, Image as ImageIcon, Sticker, Loader2, Users, Check, X,
  MoreHorizontal, Reply, Pencil, Trash2, LogOut, UserPlus,
} from "lucide-react";
import axios from "axios";
import {
  getConversations, getHistory, sendMessage, createConversation, markRead, getReadState,
  editMessage, deleteMessage, leaveGroup, deleteGroup, addParticipants,
} from "../../services/messageApi";
import { react as reactTo, unlike as unreactTo, getReactions } from "../../services/likeApi";
import { searchUsers, getFriends } from "../../services/followershipApi";
import { connectChat } from "../../services/chatSocket";
import { useNavigate } from "react-router-dom";
import { getStoredTokens } from "../../services/authApi";
import { avatarSrc } from "../../utils/avatar";
import { BE_URL } from "../../config";
import Modal from "../../components/Modal";
import MessageDetailsModal from "./MessageDetailsModal";
import { REACTIONS, reactionByType } from "../feed/reactions";

const EMOJI_PICKER_LIST = [
  "😀","😁","😂","🤣","😊","😍","😘","😜","🤔","😎","🥳","😇",
  "🙂","🙃","😉","😢","😭","😡","😱","😴","🤗","🤩","🥰","😅",
  "👍","👎","👏","🙏","💪","🔥","❤️","💔","💯","🎉","✨","👀",
];

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
      return JSON.parse(atob(t.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) || {};
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

  // Tạo chat mới bằng tìm người (hoặc danh sách bạn bè khi ô tìm đang rỗng)
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [friends, setFriends] = useState([]);

  // Trạng thái "đã xem" của MỌI thành viên khác cho hội thoại đang mở:
  // [{ userId, username, photo, lastReadMessageId }]
  const [readState, setReadState] = useState([]);

  // Tạo NHÓM
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupQuery, setGroupQuery] = useState("");
  const [groupResults, setGroupResults] = useState([]);
  const [groupPicked, setGroupPicked] = useState([]); // [user]
  const [groupCreating, setGroupCreating] = useState(false);

  // Menu "..." của từng tin nhắn: React / Trả lời / Sửa / Xóa
  const [openMsgMenu, setOpenMsgMenu] = useState(null); // id tin đang mở menu
  const [reactionPickerFor, setReactionPickerFor] = useState(null); // id tin đang mở bảng cảm xúc
  const [detailsFor, setDetailsFor] = useState(null); // id tin đang mở modal "Chi tiết"
  const [replyingTo, setReplyingTo] = useState(null); // message object đang trả lời
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  // Cảm xúc theo từng tin: { [messageId]: { reactionSummary, myReaction } }
  const [reactions, setReactions] = useState({});

  // Menu header hội thoại (Rời nhóm / Xóa nhóm / Thêm bạn bè) + emoji picker khi soạn tin
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  // Thêm thành viên vào nhóm — ai cũng thêm được, không chỉ trưởng nhóm
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState([]);
  const [addPicked, setAddPicked] = useState([]); // [user]
  const [addSubmitting, setAddSubmitting] = useState(false);

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

  // Danh sách bạn bè — dùng làm gợi ý "bắt đầu chat mới" khi ô tìm đang rỗng.
  useEffect(() => {
    getFriends().then(setFriends).catch(() => setFriends([]));
  }, []);

  // Mount: nạp danh sách hội thoại + kết nối WebSocket
  useEffect(() => {
    loadConversations();
    clientRef.current = connectChat(() => setConnected(true));
    return () => { try { clientRef.current?.deactivate(); } catch { /* ignore */ } };
  }, [loadConversations]);

  // Subscribe topic của hội thoại đang mở (khi đã kết nối).
  // BE đẩy frame dạng { event, data } — phân biệt: NEW_MESSAGE / MESSAGE_EDITED /
  // MESSAGE_DELETED / PARTICIPANT_LEFT / GROUP_DELETED.
  useEffect(() => {
    if (!connected || !activeId || !clientRef.current) return;
    const sub = clientRef.current.subscribe(`/topic/conversation/${activeId}`, (frame) => {
      try {
        const { event, data } = JSON.parse(frame.body);
        if (event === "NEW_MESSAGE") {
          setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
          if (data.senderId && data.senderId !== meId) markRead(activeId);
          getReadState(activeId).then(setReadState);
        } else if (event === "MESSAGE_EDITED") {
          setMessages((prev) => prev.map((m) => (m.id === data.id ? data : m)));
        } else if (event === "MESSAGE_DELETED") {
          setMessages((prev) => prev.filter((m) => m.id !== data.id));
        } else if (event === "READ_STATE_CHANGED") {
          // Ai cũng nhận được — không riêng người gửi/nhận tin mới nhất — nên "đã xem" cập nhật
          // real-time cho MỌI người đang mở đúng hội thoại này, kể cả khi người kia chỉ mở lên
          // đọc chứ không gửi gì mới.
          getReadState(activeId).then(setReadState);
        } else if (event === "PARTICIPANT_LEFT") {
          loadConversations();
        } else if (event === "PARTICIPANT_ADDED") {
          loadConversations();
        } else if (event === "GROUP_DELETED") {
          setErr("Nhóm này đã bị xóa.");
          setActiveId(null);
          setMessages([]);
          loadConversations();
        }
      } catch { /* ignore */ }
    });
    return () => { try { sub.unsubscribe(); } catch { /* ignore */ } };
  }, [connected, activeId, loadConversations]);

  // Subscribe TẤT CẢ hội thoại của mình (không chỉ hội thoại đang mở) để cập nhật ngay tin nhắn
  // mới nhất + thời gian ở danh sách bên trái, kể cả khi mình đang không mở đúng đoạn chat đó.
  const conversationIds = conversations.map((c) => c.conversationId).join(",");
  useEffect(() => {
    if (!connected || !clientRef.current || !conversationIds) return;
    const subs = conversationIds.split(",").map((cid) =>
      clientRef.current.subscribe(`/topic/conversation/${cid}`, (frame) => {
        try {
          const { event, data } = JSON.parse(frame.body);
          if (event === "NEW_MESSAGE") {
            setConversations((prev) => {
              const updated = prev.map((cv) =>
                cv.conversationId === data.conversationId
                  ? { ...cv, lastMessage: data, lastMessageTime: data.createTime }
                  : cv
              );
              // Đưa hội thoại vừa có tin mới lên đầu danh sách (giống Inbox thật).
              updated.sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
              return updated;
            });
          } else if (event === "READ_STATE_CHANGED" && data.userId === meId) {
            // Chính mình vừa đánh dấu đã đọc (ở tab/thiết bị nào đó) -> hết in đậm/chấm xanh ngay.
            setConversations((prev) =>
              prev.map((cv) =>
                cv.conversationId === data.conversationId
                  ? { ...cv, myLastReadMessageId: data.lastReadMessageId }
                  : cv
              )
            );
          }
        } catch { /* ignore */ }
      })
    );
    return () => { subs.forEach((s) => { try { s.unsubscribe(); } catch { /* ignore */ } }); };
  }, [connected, conversationIds]);

  // Tự cuộn xuống cuối khi có tin mới
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Nạp cảm xúc cho các tin đang hiển thị (gộp 1 lượt mỗi khi danh sách tin thay đổi).
  useEffect(() => {
    if (messages.length === 0) return;
    let alive = true;
    Promise.all(
      messages.map((m) =>
        getReactions("MESSAGE", m.id)
          .then((r) => [m.id, r])
          .catch(() => [m.id, { reactionSummary: {} }])
      )
    ).then((pairs) => {
      if (!alive) return;
      const map = {};
      for (const [id, r] of pairs) map[id] = r;
      setReactions(map);
    });
    return () => { alive = false; };
  }, [messages]);

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

  // Tìm người cho hộp thoại TẠO NHÓM (debounce 400ms)
  useEffect(() => {
    const q = groupQuery.trim();
    if (!q) { setGroupResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const list = await searchUsers(q);
        setGroupResults((meId ? list.filter((u) => u.id !== meId) : list).slice(0, 8));
      } catch { /* ignore */ }
    }, 400);
    return () => clearTimeout(t);
  }, [groupQuery, meId]);

  // Tìm người cho modal THÊM BẠN BÈ vào nhóm đang mở (debounce 400ms)
  useEffect(() => {
    const q = addQuery.trim();
    if (!q) { setAddResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const list = await searchUsers(q);
        setAddResults((meId ? list.filter((u) => u.id !== meId) : list).slice(0, 8));
      } catch { /* ignore */ }
    }, 400);
    return () => clearTimeout(t);
  }, [addQuery, meId]);

  const openConversation = async (id) => {
    setActiveId(id);
    setLoadingMsgs(true);
    setErr("");
    setReadState([]);
    setReplyingTo(null);
    setEditingId(null);
    setGroupMenuOpen(false);
    // Cập nhật NGAY (optimistic) — hết đậm/chấm xanh tức thì lúc bấm vào, không đợi
    // vòng gọi BE + WebSocket quay lại mới cập nhật (mới thấy chậm/trễ).
    setConversations((prev) =>
      prev.map((cv) =>
        cv.conversationId === id && cv.lastMessage
          ? { ...cv, myLastReadMessageId: cv.lastMessage.id }
          : cv
      )
    );
    try {
      const list = await getHistory(id);   // BE trả mới nhất trước
      setMessages([...list].reverse());     // đảo lại: cũ trên, mới dưới
      markRead(id);                          // mình đã đọc tới tin mới nhất (lưu DB + báo real-time)
      getReadState(id).then(setReadState);   // trạng thái "đã xem" của người khác
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
      await sendMessage({ conversationId: activeId, text: t, replyToMessageId: replyingTo?.id });
      setText("");
      setReplyingTo(null);
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
      setQuery(""); setResults([]); setSearchFocused(false);
      await loadConversations();
      if (cid) openConversation(cid);
    } catch (e) {
      setErr(e?.message || "Tạo hội thoại thất bại");
    }
  };

  // ===== Menu tin nhắn: React / Trả lời / Sửa / Xóa =====
  const pickReaction = async (message, type) => {
    setReactionPickerFor(null);
    setOpenMsgMenu(null);
    try {
      const mine = reactions[message.id]?.myReaction;
      if (mine === type) await unreactTo("MESSAGE", message.id);
      else await reactTo("MESSAGE", message.id, type);
      const r = await getReactions("MESSAGE", message.id);
      setReactions((prev) => ({ ...prev, [message.id]: r }));
    } catch (e) {
      setErr(e?.message || "Thả cảm xúc thất bại");
    }
  };

  const startReply = (message) => {
    setOpenMsgMenu(null);
    setReplyingTo(message);
  };

  const startEdit = (message) => {
    setOpenMsgMenu(null);
    setEditingId(message.id);
    setEditingText(message.text || "");
  };

  const submitEdit = async () => {
    const t = editingText.trim();
    if (!t || !editingId) { setEditingId(null); return; }
    try {
      await editMessage(editingId, t);
      // BE sẽ đẩy MESSAGE_EDITED qua WebSocket để cập nhật lại UI.
    } catch (e) {
      setErr(e?.message || "Sửa tin nhắn thất bại");
    } finally {
      setEditingId(null);
      setEditingText("");
    }
  };

  const removeMessage = async (message) => {
    setOpenMsgMenu(null);
    if (!window.confirm("Xóa tin nhắn này?")) return;
    try {
      await deleteMessage(message.id);
      // BE sẽ đẩy MESSAGE_DELETED qua WebSocket để gỡ khỏi danh sách.
    } catch (e) {
      setErr(e?.message || "Xóa tin nhắn thất bại");
    }
  };

  // ===== Rời nhóm / Xóa nhóm =====
  const doLeaveGroup = async () => {
    if (!activeId || !window.confirm("Rời khỏi nhóm này?")) return;
    setGroupMenuOpen(false);
    try {
      await leaveGroup(activeId);
      setActiveId(null);
      setMessages([]);
      await loadConversations();
    } catch (e) {
      setErr(e?.message || "Rời nhóm thất bại");
    }
  };

  const doDeleteGroup = async () => {
    if (!activeId || !window.confirm("Xóa cả nhóm này? Toàn bộ tin nhắn sẽ mất vĩnh viễn.")) return;
    setGroupMenuOpen(false);
    try {
      await deleteGroup(activeId);
      setActiveId(null);
      setMessages([]);
      await loadConversations();
    } catch (e) {
      setErr(e?.message || "Xóa nhóm thất bại");
    }
  };

  // ===== Thêm bạn bè vào nhóm — ai cũng thêm được, không chỉ trưởng nhóm =====
  const toggleAddPick = (u) =>
    setAddPicked((prev) => (prev.some((x) => x.id === u.id) ? prev.filter((x) => x.id !== u.id) : [...prev, u]));

  const submitAddMembers = async () => {
    if (!activeId || addPicked.length === 0) return;
    setAddSubmitting(true);
    try {
      await addParticipants(activeId, addPicked.map((u) => u.id));
      setAddMembersOpen(false); setAddQuery(""); setAddResults([]); setAddPicked([]);
      await loadConversations();
    } catch (e) {
      setErr(e?.message || "Thêm thành viên thất bại");
    } finally {
      setAddSubmitting(false);
    }
  };

  // Thông tin hiển thị của 1 hội thoại (avatar + tên). Chat 1-1 dùng otherUser từ BE.
  const convView = (c) => {
    if (c?.otherUser) {
      return {
        title: c.otherUser.name || c.otherUser.username || "Người dùng",
        avatar: avatarSrc(c.otherUser),
        members: null,
      };
    }
    return {
      title: c?.name || c?.lastMessage?.senderName || ("Cuộc trò chuyện " + String(c?.conversationId).slice(0, 6)),
      avatar: avatarSrc(null),
      members: Array.isArray(c?.members) ? c.members : [], // nhóm -> ghép avatar thành viên
    };
  };

  const activeConv = conversations.find((c) => c.conversationId === activeId);
  const activeView = activeConv ? convView(activeConv) : null;
  const isGroup = activeConv?.type === "GROUP";
  const isGroupLeader = isGroup && activeConv?.creatorId && activeConv.creatorId === meId;
  const focusSearch = () => searchRef.current?.focus();

  // "Đã xem": 1 người tính là đã xem tin X nếu tin MỚI NHẤT họ đọc tới (lastReadMessageId)
  // được tạo CÙNG LÚC HOẶC SAU tin X — vì đọc tin sau thì chắc chắn đã đọc tin trước đó rồi.
  // (Trước đây so khớp tuyệt đối messageId === lastReadMessageId nên chỉ đúng 1 tin duy nhất
  // -> mọi tin cũ hơn bị tính nhầm là "chưa ai xem" dù họ đã đọc lướt qua.)
  const messageTimeById = useMemo(() => {
    const map = {};
    for (const m of messages) map[m.id] = m.createTime;
    return map;
  }, [messages]);

  const getSeenBy = (messageId) => {
    const targetTime = messageTimeById[messageId];
    if (!targetTime) return [];
    return readState.filter((p) => {
      if (!p.lastReadMessageId) return false;
      const readTime = messageTimeById[p.lastReadMessageId];
      if (!readTime) return false;
      return new Date(readTime) >= new Date(targetTime);
    });
  };

  // Tạo nhóm: tìm người (debounce)
  const togglePick = (u) =>
    setGroupPicked((prev) => (prev.some((x) => x.id === u.id) ? prev.filter((x) => x.id !== u.id) : [...prev, u]));
  const submitGroup = async () => {
    if (groupPicked.length < 2) { setErr("Chọn ít nhất 2 người để tạo nhóm"); return; }
    setGroupCreating(true);
    try {
      const conv = await createConversation(groupPicked.map((u) => u.id), groupName.trim() || null);
      const cid = conv?.conversationId || conv?.id;
      setGroupOpen(false); setGroupName(""); setGroupQuery(""); setGroupResults([]); setGroupPicked([]);
      await loadConversations();
      if (cid) openConversation(cid);
    } catch (e) {
      setErr(e?.message || "Tạo nhóm thất bại");
    } finally {
      setGroupCreating(false);
    }
  };

  const showSearchDropdown = searchFocused || query.trim();

  return (
    <div className="flex h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* ===== Cột danh sách hội thoại ===== */}
      <aside className="w-[397px] shrink-0 border-r border-gray-200 dark:border-neutral-800 flex flex-col">
        {/* Header username + soạn tin */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <button className="flex items-center gap-1 text-xl font-bold">
            {meName} <ChevronDown size={18} />
          </button>
          <div className="flex items-center gap-3">
            <button className="p-1 hover:opacity-60" title="Tạo nhóm" onClick={() => { setGroupOpen(true); setErr(""); }}>
              <Users size={22} />
            </button>
            <button className="p-1 hover:opacity-60" title="New message" onClick={focusSearch}>
              <SquarePen size={24} />
            </button>
          </div>
        </div>

        {/* Ô tìm kiếm — rỗng thì gợi ý bạn bè, có chữ thì tìm mọi user */}
        <div className="px-6 py-2 relative">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search"
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-sm focus:outline-none placeholder-gray-500"
            />
          </div>
          {showSearchDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSearchFocused(false)} />
              <div className="absolute left-6 right-6 z-20 mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                {query.trim() ? (
                  searching ? (
                    <div className="p-3 text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Đang tìm...</div>
                  ) : results.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">Không tìm thấy.</div>
                  ) : (
                    results.map((u) => (
                      <button key={u.id} onClick={() => startChat(u)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left">
                        <img src={avatarSrc(u)} alt="" className="w-9 h-9 rounded-full object-cover bg-gray-200" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{u.username}</div>
                          <div className="text-xs text-gray-500 truncate">{displayName(u)}</div>
                        </div>
                      </button>
                    ))
                  )
                ) : friends.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">Bạn chưa có bạn bè nào.</div>
                ) : (
                  <>
                    <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400">Bạn bè</div>
                    {friends.map((u) => (
                      <button key={u.id} onClick={() => startChat(u)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left">
                        <img src={avatarSrc(u)} alt="" className="w-9 h-9 rounded-full object-cover bg-gray-200" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{u.username}</div>
                          <div className="text-xs text-gray-500 truncate">{displayName(u)}</div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Your note + bạn bè (bấm vào 1 bạn -> mở/tạo chat 1-1 luôn) */}
        <div className="px-6 pt-3 pb-1 flex gap-3 overflow-x-auto">
          <div className="flex flex-col items-center w-[72px] shrink-0">
            <div className="relative">
              <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                <img src={mePhoto || avatarSrc({ name: meName })} alt="" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black" />
              </div>
            </div>
            <span className="text-xs mt-1 text-gray-600 dark:text-gray-300 truncate w-[72px] text-center">{meName}</span>
          </div>
          {friends.map((u) => (
            <button key={u.id} onClick={() => startChat(u)} className="flex flex-col items-center w-[72px] shrink-0">
              <div className="w-14 h-14 rounded-full p-[2px] border-2 border-gray-200 dark:border-neutral-700">
                <img src={avatarSrc(u)} alt="" className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="text-xs mt-1 text-gray-600 dark:text-gray-300 truncate w-[72px] text-center">{u.username}</span>
            </button>
          ))}
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
              // Chưa đọc: có tin cuối, không phải do chính mình gửi, và tin đó chưa khớp
              // với "tin cuối mình đã đọc tới" (myLastReadMessageId) của hội thoại này.
              const unread = !!(
                c.lastMessage &&
                c.lastMessage.senderId !== meId &&
                c.lastMessage.id !== c.myLastReadMessageId
              );
              return (
                <button key={c.conversationId} onClick={() => openConversation(c.conversationId)}
                  className={`w-full flex items-center gap-3 px-6 py-2 text-left hover:bg-gray-50 dark:hover:bg-neutral-900 ${active ? "bg-gray-100 dark:bg-neutral-800" : ""}`}>
                  <div className="relative shrink-0">
                    <ConvAvatar view={v} size={56} />
                    {unread && (
                      <span className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white dark:border-black" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm truncate ${unread ? "font-bold" : ""}`}>{v.title}</div>
                    <div className={`text-xs truncate ${unread ? "font-bold text-gray-900 dark:text-white" : "text-gray-500"}`}>
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
                {activeView && <ConvAvatar view={activeView} size={44} />}
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate hover:underline">{activeView?.title}</div>
                  <div className="text-xs text-gray-500">Active now</div>
                </div>
              </div>
              <div className="flex items-center gap-5 text-black dark:text-white">
                <div className="relative">
                  <button className="hover:opacity-60" onClick={() => setGroupMenuOpen((v) => !v)}><Info size={24} /></button>
                  {groupMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setGroupMenuOpen(false)} />
                      <div className="absolute right-0 top-8 z-20 w-52 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 text-sm">
                        {isGroup ? (
                          <>
                            <button onClick={doLeaveGroup} className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700">
                              <LogOut size={15} /> Rời nhóm
                            </button>
                            <button
                              onClick={() => { setGroupMenuOpen(false); setAddMembersOpen(true); }}
                              className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700"
                            >
                              <UserPlus size={15} /> Thêm bạn bè
                            </button>
                            {isGroupLeader ? (
                              <button onClick={doDeleteGroup} className="w-full flex items-center gap-2 text-left px-3 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-700">
                                <Trash2 size={15} /> Xóa nhóm
                              </button>
                            ) : (
                              <div className="px-3 py-2 text-xs text-gray-400">Chỉ trưởng nhóm mới được xóa cả nhóm</div>
                            )}
                          </>
                        ) : (
                          <div className="px-3 py-2 text-xs text-gray-400">Không có tùy chọn cho đoạn chat 1-1</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
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
                  const gapMin = prev ? (new Date(m.createTime) - new Date(prev.createTime)) / 60000 : Infinity;
                  const newDay = !prev || new Date(prev.createTime).toDateString() !== new Date(m.createTime).toDateString();
                  const showDivider = newDay || gapMin > 30; // đổi ngày HOẶC cách tin trước > 30 phút
                  const msgReactions = reactions[m.id]?.reactionSummary || {};
                  const hasReactions = Object.values(msgReactions).some((c) => c > 0);
                  // Tin hệ thống (rời nhóm / thêm thành viên...): chỉ hiện 1 dòng chữ giữa màn
                  // hình, không avatar/bong bóng/menu — giống thông báo hệ thống của Messenger.
                  if (m.messageType === "SYSTEM") {
                    return (
                      <React.Fragment key={m.id}>
                        {showDivider && (
                          <div className="text-center text-[11px] text-gray-400 my-3">{fmtDaySep(m.createTime)}</div>
                        )}
                        <div className="text-center text-[12px] text-gray-400 my-1.5">{m.text}</div>
                      </React.Fragment>
                    );
                  }
                  return (
                    <React.Fragment key={m.id}>
                      {showDivider && (
                        <div className="text-center text-[11px] text-gray-400 my-3">{fmtDaySep(m.createTime)}</div>
                      )}
                      <div className={`group relative flex items-end gap-2 max-w-[70%] ${mine ? "self-end flex-row-reverse" : "self-start"}`}>
                        {!mine && (
                          <img src={avatarSrc({ photo: m.senderPhoto, name: m.senderName })} alt="" className="w-6 h-6 rounded-full object-cover bg-gray-200 shrink-0" />
                        )}
                        <div className="min-w-0">
                          {/* Tên người gửi (nhóm lẫn 1-1) */}
                          {!mine && (
                            <div className="text-[11px] font-semibold mb-0.5 ml-1 text-black dark:text-white">{m.senderName}</div>
                          )}
                          {editingId === m.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") { e.preventDefault(); submitEdit(); }
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                                className="px-3 py-2 rounded-2xl text-sm border border-blue-400 bg-white dark:bg-neutral-800 outline-none"
                              />
                              <button onClick={submitEdit} className="text-xs text-blue-500 font-semibold">Lưu</button>
                              <button onClick={() => setEditingId(null)} className="text-xs text-gray-400">Hủy</button>
                            </div>
                          ) : (
                            <div
                              title={fmtClock(m.createTime)}
                              className={`px-3.5 py-2 rounded-3xl text-sm break-words ${mine ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-neutral-800"}`}>
                              {m.replyToMessageId && (
                                <div className={`mb-1 pl-2 border-l-2 text-xs opacity-80 ${mine ? "border-white/60" : "border-gray-400"}`}>
                                  <div className="font-semibold">{m.replyToSenderName || "Tin nhắn"}</div>
                                  <div className="truncate max-w-[180px]">{m.replyToText || "(tin gốc đã bị xóa)"}</div>
                                </div>
                              )}
                              {m.text || (m.photo ? <img src={m.photo} alt="" className="max-w-[220px] rounded-lg" /> : "")}
                              {m.isEdited && <span className="opacity-70 text-[10px] ml-1">(đã chỉnh sửa)</span>}
                            </div>
                          )}
                          {/* Badge cảm xúc dưới bong bóng */}
                          {hasReactions && (
                            <div className={`flex gap-0.5 mt-0.5 ${mine ? "justify-end" : "justify-start"}`}>
                              {Object.entries(msgReactions).filter(([, c]) => c > 0).map(([type, c]) => (
                                <span key={type} className="text-[11px] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-full px-1.5 py-0.5 shadow-sm">
                                  {reactionByType[type]?.emoji || "👍"} {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Nút "..." — hiện khi hover */}
                        {editingId !== m.id && (
                          <div className="relative opacity-0 group-hover:opacity-100 transition shrink-0 self-center">
                            <button onClick={() => setOpenMsgMenu(openMsgMenu === m.id ? null : m.id)} className="p-1 hover:opacity-70">
                              <MoreHorizontal size={16} className="text-gray-400" />
                            </button>
                            {openMsgMenu === m.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenMsgMenu(null)} />
                                <div className={`absolute z-20 top-6 ${mine ? "right-0" : "left-0"} w-36 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 text-sm`}>
                                  <button onClick={() => setReactionPickerFor(reactionPickerFor === m.id ? null : m.id)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700">Thả cảm xúc</button>
                                  <button onClick={() => { setDetailsFor(m.id); setOpenMsgMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700">
                                    <Info size={14} /> Chi tiết
                                  </button>
                                  <button onClick={() => startReply(m)} className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700">
                                    <Reply size={14} /> Trả lời
                                  </button>
                                  {mine && (
                                    <>
                                      <button onClick={() => startEdit(m)} className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700">
                                        <Pencil size={14} /> Sửa
                                      </button>
                                      <button onClick={() => removeMessage(m)} className="w-full flex items-center gap-2 text-left px-3 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-700">
                                        <Trash2 size={14} /> Xóa
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                            {reactionPickerFor === m.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setReactionPickerFor(null)} />
                                <div className="absolute z-20 top-6 left-0 flex gap-1 rounded-full bg-white dark:bg-neutral-800 shadow-lg border border-gray-200 dark:border-neutral-700 px-2 py-1">
                                  {REACTIONS.map((r) => (
                                    <button key={r.type} title={r.label} onClick={() => pickReaction(m, r.type)} className="text-xl hover:scale-125 transition-transform">
                                      {r.emoji}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        {/* Giờ gửi — hiện khi di chuột vào tin */}
                        <span className="opacity-0 group-hover:opacity-100 transition text-[10px] text-gray-400 shrink-0 self-center">
                          {fmtClock(m.createTime)}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Đang trả lời — hiện phía trên thanh soạn */}
            {replyingTo && (
              <div className="px-4 pt-1 shrink-0 flex items-center justify-between text-xs bg-gray-50 dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 py-1.5">
                <div className="min-w-0 truncate">
                  Đang trả lời <span className="font-semibold">{replyingTo.senderName}</span>: {replyingTo.text || "ảnh"}
                </div>
                <button onClick={() => setReplyingTo(null)} className="ml-2 shrink-0"><X size={14} /></button>
              </div>
            )}

            {/* Thanh nhập */}
            <div className="px-4 pb-5 pt-1 shrink-0">
              <div className="relative flex items-center gap-3 border border-gray-300 dark:border-neutral-700 rounded-full px-4 py-2.5">
                <button className="hover:opacity-60 shrink-0" onClick={() => setEmojiOpen((v) => !v)}><Smile size={24} /></button>
                {emojiOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setEmojiOpen(false)} />
                    <div className="absolute z-20 bottom-full left-0 mb-2 grid grid-cols-8 gap-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 w-72">
                      {EMOJI_PICKER_LIST.map((em) => (
                        <button key={em} onClick={() => { setText((t) => t + em); setEmojiOpen(false); }} className="text-xl hover:bg-gray-100 dark:hover:bg-neutral-700 rounded p-1">
                          {em}
                        </button>
                      ))}
                    </div>
                  </>
                )}
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

      {/* ===== Modal TẠO NHÓM ===== */}
      <Modal open={groupOpen} onClose={() => setGroupOpen(false)}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Tạo nhóm chat</h2>
          <button onClick={() => setGroupOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full"><X size={20} /></button>
        </div>
        {err && groupOpen && <div className="mb-2 text-sm text-red-600">{err}</div>}

        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Tên nhóm (tùy chọn)"
          className="w-full mb-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Người đã chọn */}
        {groupPicked.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {groupPicked.map((u) => (
              <span key={u.id} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                {u.username}
                <button onClick={() => togglePick(u)}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}

        <div className="relative mb-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={groupQuery}
            onChange={(e) => setGroupQuery(e.target.value)}
            placeholder="Tìm người thêm vào nhóm..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-sm focus:outline-none"
          />
        </div>

        <div className="max-h-56 overflow-y-auto mb-3">
          {groupResults.map((u) => {
            const picked = groupPicked.some((x) => x.id === u.id);
            return (
              <button key={u.id} onClick={() => togglePick(u)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-left">
                <img src={avatarSrc(u)} alt="" className="w-9 h-9 rounded-full object-cover bg-gray-200" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{u.username}</div>
                  <div className="text-xs text-gray-500 truncate">{displayName(u)}</div>
                </div>
                {picked && <Check size={18} className="text-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={submitGroup}
          disabled={groupCreating || groupPicked.length < 2}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {groupCreating && <Loader2 size={16} className="animate-spin" />} Tạo nhóm ({groupPicked.length})
        </button>
      </Modal>

      {/* ===== Modal THÊM BẠN BÈ vào nhóm đang mở (ai cũng thêm được) ===== */}
      <Modal open={addMembersOpen} onClose={() => setAddMembersOpen(false)}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Thêm bạn bè vào nhóm</h2>
          <button onClick={() => setAddMembersOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full"><X size={20} /></button>
        </div>

        {addPicked.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {addPicked.map((u) => (
              <span key={u.id} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                {u.username}
                <button onClick={() => toggleAddPick(u)}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}

        <div className="relative mb-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={addQuery}
            onChange={(e) => setAddQuery(e.target.value)}
            placeholder="Tìm bạn bè để thêm vào nhóm..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-sm focus:outline-none"
          />
        </div>

        <div className="max-h-56 overflow-y-auto mb-3">
          {(addQuery.trim() ? addResults : friends).map((u) => {
            const picked = addPicked.some((x) => x.id === u.id);
            return (
              <button key={u.id} onClick={() => toggleAddPick(u)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-left">
                <img src={avatarSrc(u)} alt="" className="w-9 h-9 rounded-full object-cover bg-gray-200" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{u.username}</div>
                  <div className="text-xs text-gray-500 truncate">{displayName(u)}</div>
                </div>
                {picked && <Check size={18} className="text-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={submitAddMembers}
          disabled={addSubmitting || addPicked.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {addSubmitting && <Loader2 size={16} className="animate-spin" />} Thêm ({addPicked.length})
        </button>
      </Modal>

      <MessageDetailsModal
        open={!!detailsFor}
        onClose={() => setDetailsFor(null)}
        seenBy={getSeenBy(detailsFor).filter((p) => {
          const msg = messages.find((m) => m.id === detailsFor);
          return !msg || p.userId !== msg.senderId;
        })}
        likes={reactions[detailsFor]?.likes || []}
        reactionSummary={reactions[detailsFor]?.reactionSummary || {}}
      />
    </div>
  );
}

// Ảnh đại diện hội thoại: nhóm (>=2 thành viên) -> ghép 2 avatar chồng nhau kiểu Messenger;
// còn lại -> 1 avatar. members từ BE (tối đa 4 thành viên khác mình).
function ConvAvatar({ view, size = 56 }) {
  const members = (view && view.members) || [];

  if (members.length >= 2) {
    const s2 = Math.round(size * 0.66);
    return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <img
          src={avatarSrc(members[0])}
          alt=""
          className="absolute top-0 left-0 rounded-full object-cover bg-gray-200 border-2 border-white dark:border-black"
          style={{ width: s2, height: s2 }}
        />
        <img
          src={avatarSrc(members[1])}
          alt=""
          className="absolute bottom-0 right-0 rounded-full object-cover bg-gray-200 border-2 border-white dark:border-black"
          style={{ width: s2, height: s2 }}
        />
      </div>
    );
  }

  const single = (members[0] && avatarSrc(members[0])) || (view && view.avatar) || avatarSrc(null);
  return (
    <img
      src={single}
      alt=""
      className="rounded-full object-cover bg-gray-200 shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
