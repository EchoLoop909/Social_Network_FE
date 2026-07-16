import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Users, UserPlus, Cake, List, Home, Loader2, AlertCircle, Check, Ban, Search, SendHorizontal } from "lucide-react";
import {
  getFriends,
  getFriendRequests,
  getSuggestions,
  getBlockedUsers,
  getSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend,
  blockUser,
  unblockUser,
  searchUsers,
} from "../services/followershipApi";

const PLACEHOLDER = "https://via.placeholder.com/180?text=?";

function displayName(u) {
  const full = [u.lastname, u.firstname].filter(Boolean).join(" ").trim();
  return full || u.username || "Người dùng";
}

/* ============ Trang Bạn bè kiểu Facebook ============ */
export default function FriendsPage() {
  const [tab, setTab] = useState("home"); // home | requests | suggestions | all
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [sent, setSent] = useState([]); // lời mời mình đã gửi đi
  const [hidden, setHidden] = useState(() => new Set()); // gợi ý bị "Gỡ" (ẩn client)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState(null);

  // --- Tìm kiếm người dùng ---
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // id của chính mình (lấy từ 'sub' trong access_token) để loại khỏi kết quả tìm kiếm
  const meId = useMemo(() => {
    try {
      const t = JSON.parse(localStorage.getItem("auth_tokens") || "null");
      if (!t?.access_token) return null;
      return JSON.parse(atob(t.access_token.split(".")[1]))?.sub || null;
    } catch {
      return null;
    }
  }, []);

  // Tìm kiếm với debounce 400ms mỗi khi gõ (chỉ khi đang ở tab "search")
  useEffect(() => {
    if (tab !== "search") return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const list = await searchUsers(q);
        setResults(meId ? list.filter((u) => u.id !== meId) : list);
        setSearched(true);
      } catch (e) {
        setErr(e?.message || "Tìm kiếm thất bại");
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, tab, meId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [f, r, s, b, sq] = await Promise.all([
        getFriends(),
        getFriendRequests(),
        getSuggestions(),
        getBlockedUsers(),
        getSentRequests(),
      ]);
      setFriends(f);
      setRequests(r);
      setSuggestions(s);
      setBlocked(b);
      setSent(sq);
    } catch (e) {
      setErr(e?.message || "Tải dữ liệu bạn bè thất bại");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function act(id, fn, okMsg) {
    setBusyId(id);
    setErr("");
    try {
      await fn();
      if (okMsg) flash(okMsg);
    } catch (e) {
      setErr(e?.message || "Thao tác thất bại");
    } finally {
      setBusyId(null);
    }
  }

  // Xác nhận lời mời -> accept, bỏ khỏi requests, nạp lại friends
  const onAccept = (u) =>
    act(u.id, async () => {
      await acceptFriendRequest(u.id);
      setRequests((prev) => prev.filter((x) => x.id !== u.id));
      setFriends(await getFriends());
    }, `Đã kết bạn với ${displayName(u)}`);

  // Xóa (từ chối) lời mời -> reject, bỏ khỏi requests
  const onReject = (u) =>
    act(u.id, async () => {
      await rejectFriendRequest(u.id);
      setRequests((prev) => prev.filter((x) => x.id !== u.id));
    }, "Đã xóa lời mời");

  // Thêm bạn bè (gợi ý) -> send, bỏ khỏi suggestions, cập nhật danh sách đã gửi
  const onSend = (u) =>
    act(u.id, async () => {
      await sendFriendRequest(u.id);
      setSuggestions((prev) => prev.filter((x) => x.id !== u.id));
      setSent(await getSentRequests());
    }, `Đã gửi lời mời tới ${displayName(u)}`);

  // Gỡ gợi ý -> ẩn client
  const onDismiss = (u) => setHidden((prev) => new Set(prev).add(u.id));

  // Gửi lời mời từ kết quả tìm kiếm -> send, bỏ khỏi kết quả, cập nhật danh sách đã gửi
  const onSendSearch = (u) =>
    act(u.id, async () => {
      await sendFriendRequest(u.id);
      setResults((prev) => prev.filter((x) => x.id !== u.id));
      setSent(await getSentRequests());
    }, `Đã gửi lời mời tới ${displayName(u)}`);

  // Hủy lời mời đã gửi -> unfriend (xóa quan hệ), bỏ khỏi danh sách đã gửi
  const onCancelSent = (u) =>
    act(u.id, async () => {
      await unfriend(u.id);
      setSent((prev) => prev.filter((x) => x.id !== u.id));
    }, `Đã hủy lời mời tới ${displayName(u)}`);

  // Hủy kết bạn -> unfriend, bỏ khỏi friends
  const onUnfriend = (u) =>
    act(u.id, async () => {
      await unfriend(u.id);
      setFriends((prev) => prev.filter((x) => x.id !== u.id));
    }, `Đã hủy kết bạn với ${displayName(u)}`);

  // Chặn -> xóa mọi quan hệ, thêm vào danh sách đã chặn
  const onBlock = (u) =>
    act(u.id, async () => {
      await blockUser(u.id);
      setFriends((prev) => prev.filter((x) => x.id !== u.id));
      setSuggestions((prev) => prev.filter((x) => x.id !== u.id));
      setRequests((prev) => prev.filter((x) => x.id !== u.id));
      setResults((prev) => prev.filter((x) => x.id !== u.id));
      setSent((prev) => prev.filter((x) => x.id !== u.id));
      setBlocked(await getBlockedUsers());
    }, `Đã chặn ${displayName(u)}`);

  // Bỏ chặn -> bỏ khỏi danh sách đã chặn
  const onUnblock = (u) =>
    act(u.id, async () => {
      await unblockUser(u.id);
      setBlocked((prev) => prev.filter((x) => x.id !== u.id));
    }, `Đã bỏ chặn ${displayName(u)}`);

  const visibleSuggestions = suggestions.filter((u) => !hidden.has(u.id));

  const navItems = [
    { key: "home", label: "Trang chủ", icon: Home },
    { key: "search", label: "Tìm kiếm", icon: Search },
    { key: "requests", label: "Lời mời kết bạn", icon: UserPlus, badge: requests.length },
    { key: "sent", label: "Đã gửi lời mời", icon: SendHorizontal, badge: sent.length },
    { key: "suggestions", label: "Gợi ý", icon: Users },
    { key: "all", label: "Tất cả bạn bè", icon: List, badge: friends.length },
    { key: "blocked", label: "Đã chặn", icon: Ban, badge: blocked.length },
  ];

  return (
    <div className="flex w-full min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Sub-nav trái */}
      <aside className="w-[300px] shrink-0 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 px-3 py-4 hidden md:block">
        <h1 className="text-2xl font-bold px-2 mb-3">Bạn bè</h1>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-3 px-2 py-2.5 rounded-lg text-left font-medium transition
                ${tab === key ? "bg-blue-50 text-blue-600 dark:bg-neutral-700" : "hover:bg-gray-100 dark:hover:bg-neutral-700"}`}
            >
              <span className={`w-9 h-9 rounded-full flex items-center justify-center ${tab === key ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-neutral-600"}`}>
                <Icon size={18} />
              </span>
              <span className="flex-1">{label}</span>
              {badge > 0 && <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5">{badge}</span>}
            </button>
          ))}
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-gray-400 cursor-not-allowed">
            <span className="w-9 h-9 rounded-full bg-gray-200 dark:bg-neutral-600 flex items-center justify-center"><Cake size={18} /></span>
            <span>Sinh nhật</span>
          </div>
        </nav>
      </aside>

      {/* Nội dung */}
      <main className="flex-1 px-4 md:px-8 py-6 max-w-[1100px]">
        {/* Tab chọn nhanh cho mobile */}
        <div className="flex gap-2 mb-4 md:hidden overflow-x-auto">
          {navItems.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${tab === key ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              {label}
            </button>
          ))}
        </div>

        {err && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
            <AlertCircle size={18} className="mt-0.5" /> <span>{err}</span>
          </div>
        )}
        {toast && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm">
            <Check size={18} className="mt-0.5" /> <span>{toast}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 py-20 justify-center">
            <Loader2 className="animate-spin" /> Đang tải...
          </div>
        ) : (
          <>
            {tab === "home" && (
              <div className="flex flex-col gap-8">
                <Section
                  title="Lời mời kết bạn"
                  empty="Không có lời mời nào."
                  items={requests}
                  render={(u) => (
                    <PersonCard key={u.id} u={u} busy={busyId === u.id}
                      primary={{ label: "Xác nhận", onClick: () => onAccept(u) }}
                      secondary={{ label: "Xóa", onClick: () => onReject(u) }} />
                  )}
                />
                <Section
                  title="Những người bạn có thể biết"
                  empty="Chưa có gợi ý nào."
                  items={visibleSuggestions}
                  render={(u) => (
                    <PersonCard key={u.id} u={u} busy={busyId === u.id}
                      primary={{ label: "Thêm bạn bè", onClick: () => onSend(u) }}
                      secondary={{ label: "Gỡ", onClick: () => onDismiss(u) }} />
                  )}
                />
              </div>
            )}

            {tab === "search" && (
              <div>
                <div className="text-sm text-gray-500">Tìm kiếm</div>
                <h2 className="text-2xl font-bold mb-4">Tìm kiếm người dùng</h2>

                <div className="relative mb-6 max-w-xl">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nhập tên hoặc username..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {searching ? (
                  <div className="flex items-center gap-2 text-gray-500 py-10 justify-center">
                    <Loader2 className="animate-spin" /> Đang tìm...
                  </div>
                ) : !query.trim() ? (
                  <Empty text="Nhập từ khóa để tìm người dùng." />
                ) : results.length === 0 && searched ? (
                  <Empty text={`Không tìm thấy người dùng khớp "${query.trim()}".`} />
                ) : (
                  <Grid>
                    {results.map((u) => (
                      <PersonCard key={u.id} u={u} busy={busyId === u.id}
                        primary={{ label: "Thêm bạn bè", onClick: () => onSendSearch(u) }}
                        secondary={{ label: "Chặn", onClick: () => onBlock(u) }} />
                    ))}
                  </Grid>
                )}
              </div>
            )}

            {tab === "requests" && (
              <TitledList title="Lời mời kết bạn" count={requests.length + " lời mời kết bạn"}>
                {requests.length === 0 ? (
                  <Empty text="Không có lời mời kết bạn nào." />
                ) : (
                  <Grid>
                    {requests.map((u) => (
                      <PersonCard key={u.id} u={u} busy={busyId === u.id}
                        primary={{ label: "Xác nhận", onClick: () => onAccept(u) }}
                        secondary={{ label: "Xóa", onClick: () => onReject(u) }} />
                    ))}
                  </Grid>
                )}
              </TitledList>
            )}

            {tab === "sent" && (
              <TitledList title="Đã gửi lời mời" count={sent.length + " lời mời đang chờ"}>
                {sent.length === 0 ? (
                  <Empty text="Bạn chưa gửi lời mời kết bạn nào." />
                ) : (
                  <Grid>
                    {sent.map((u) => (
                      <PersonCard key={u.id} u={u} busy={busyId === u.id}
                        primary={{ label: "Hủy lời mời", onClick: () => onCancelSent(u) }}
                        secondary={{ label: "Chặn", onClick: () => onBlock(u) }} />
                    ))}
                  </Grid>
                )}
              </TitledList>
            )}

            {tab === "suggestions" && (
              <TitledList title="Gợi ý" count="Những người bạn có thể biết">
                {visibleSuggestions.length === 0 ? (
                  <Empty text="Chưa có gợi ý nào." />
                ) : (
                  <Grid>
                    {visibleSuggestions.map((u) => (
                      <PersonCard key={u.id} u={u} busy={busyId === u.id}
                        primary={{ label: "Thêm bạn bè", onClick: () => onSend(u) }}
                        secondary={{ label: "Gỡ", onClick: () => onDismiss(u) }} />
                    ))}
                  </Grid>
                )}
              </TitledList>
            )}

            {tab === "all" && (
              <TitledList title="Tất cả bạn bè" count={friends.length + " người bạn"}>
                {friends.length === 0 ? (
                  <Empty text="Bạn chưa có người bạn nào." />
                ) : (
                  <div className="flex flex-col divide-y divide-gray-100 dark:divide-neutral-700">
                    {friends.map((u) => (
                      <FriendRow key={u.id} u={u} busy={busyId === u.id}
                        onUnfriend={() => onUnfriend(u)} onBlock={() => onBlock(u)} />
                    ))}
                  </div>
                )}
              </TitledList>
            )}

            {tab === "blocked" && (
              <TitledList title="Đã chặn" count={blocked.length + " người bị chặn"}>
                {blocked.length === 0 ? (
                  <Empty text="Bạn chưa chặn ai." />
                ) : (
                  <div className="flex flex-col divide-y divide-gray-100 dark:divide-neutral-700">
                    {blocked.map((u) => (
                      <BlockedRow key={u.id} u={u} busy={busyId === u.id} onUnblock={() => onUnblock(u)} />
                    ))}
                  </div>
                )}
              </TitledList>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ============ Thành phần con ============ */

function Avatar({ u, size = 56 }) {
  return (
    <img
      src={u.photo || PLACEHOLDER}
      alt={displayName(u)}
      style={{ width: size, height: size }}
      className="rounded-full object-cover bg-gray-200 border"
    />
  );
}

// Thẻ dạng grid (Facebook: ảnh to phía trên, nút bên dưới)
function PersonCard({ u, primary, secondary, busy }) {
  return (
    <div className="border rounded-xl overflow-hidden bg-white dark:bg-neutral-800 flex flex-col">
      <img src={u.photo || PLACEHOLDER} alt={displayName(u)}
        className="w-full aspect-square object-cover bg-gray-200" />
      <div className="p-3 flex flex-col gap-2">
        <div className="font-semibold truncate">{displayName(u)}</div>
        <div className="text-xs text-gray-400 -mt-1">@{u.username}</div>
        <button disabled={busy} onClick={primary.onClick}
          className="bg-blue-600 text-white rounded-md py-1.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1">
          {busy && <Loader2 size={14} className="animate-spin" />} {primary.label}
        </button>
        <button disabled={busy} onClick={secondary.onClick}
          className="bg-gray-200 dark:bg-neutral-600 rounded-md py-1.5 text-sm font-semibold hover:bg-gray-300 disabled:opacity-50">
          {secondary.label}
        </button>
      </div>
    </div>
  );
}

// Hàng trong danh sách "Tất cả bạn bè"
function FriendRow({ u, onUnfriend, onBlock, busy }) {
  return (
    <div className="flex items-center gap-3 py-3 px-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-lg">
      <Avatar u={u} size={60} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{displayName(u)}</div>
        <div className="text-sm text-gray-400 truncate">@{u.username}</div>
      </div>
      <button disabled={busy} onClick={onUnfriend}
        className="bg-gray-100 dark:bg-neutral-700 text-gray-800 dark:text-neutral-200 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1">
        {busy && <Loader2 size={14} className="animate-spin" />} Hủy kết bạn
      </button>
      <button disabled={busy} onClick={onBlock} title="Chặn người này"
        className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-100 disabled:opacity-50 flex items-center gap-1">
        <Ban size={14} /> Chặn
      </button>
    </div>
  );
}

// Hàng trong danh sách "Đã chặn"
function BlockedRow({ u, onUnblock, busy }) {
  return (
    <div className="flex items-center gap-3 py-3 px-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-lg">
      <Avatar u={u} size={60} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{displayName(u)}</div>
        <div className="text-sm text-gray-400 truncate">@{u.username}</div>
      </div>
      <button disabled={busy} onClick={onUnblock}
        className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
        {busy && <Loader2 size={14} className="animate-spin" />} Bỏ chặn
      </button>
    </div>
  );
}

function Section({ title, items, render, empty }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="text-sm text-blue-600">{items.length}</span>
      </div>
      {items.length === 0 ? <Empty text={empty} /> : <Grid>{items.map(render)}</Grid>}
    </section>
  );
}

function TitledList({ title, count, children }) {
  return (
    <div>
      <div className="text-sm text-gray-500">{title}</div>
      <h2 className="text-2xl font-bold mb-4">{count}</h2>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{children}</div>
  );
}

function Empty({ text }) {
  return <div className="text-sm text-gray-500 py-12 text-center border rounded-xl bg-white dark:bg-neutral-800">{text}</div>;
}
