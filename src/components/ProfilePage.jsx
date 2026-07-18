import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Grid, Bookmark, User, Camera, Loader2, Lock, X } from "lucide-react";
import { getUserById, getUserPosts, updateMyProfile } from "../services/profileApi";
import { getFriends, getSentRequests } from "../services/followershipApi";
import { uploadMedia } from "../services/postApi";
import { on, off } from "../services/eventBus";
import { getHighlights, deleteStory, setHighlight } from "../services/storyRealApi";
import { getSavedPosts } from "../services/bookmarkApi";
import { getTaggedPosts } from "../services/postUserTagApi";
import StoryViewerModal from "../features/stories/StoryViewerModal";

const AVATAR_FALLBACK = "https://via.placeholder.com/150?text=?";

function displayName(u) {
  if (!u) return "";
  return (
    u.name ||
    [u.lastname, u.firstname].filter(Boolean).join(" ").trim() ||
    u.username ||
    ""
  );
}

// id của mình từ 'sub' trong access_token
function getMyId() {
  try {
    const t = JSON.parse(localStorage.getItem("auth_tokens") || "null");
    if (!t?.access_token) return null;
    return JSON.parse(atob(t.access_token.split(".")[1]))?.sub || null;
  } catch {
    return null;
  }
}

const ProfilePage = () => {
  const { userId: routeParam } = useParams();
  const navigate = useNavigate();
  const ctx = useOutletContext() || {};
  const setMyInfo = ctx.setMyInfo;

  const meId = useMemo(() => getMyId(), []);
  const targetId = routeParam && routeParam !== "me" ? routeParam : meId;
  const isSelf = !!meId && targetId === meId;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postCount, setPostCount] = useState(0);
  const [friends, setFriends] = useState([]); // người theo dõi / bạn bè (ACCEPTED)
  const [following, setFollowing] = useState([]); // đang theo dõi (đã gửi yêu cầu)
  const [highlights, setHighlights] = useState([]); // story Highlight (giữ mãi)
  const [hlStart, setHlStart] = useState(null); // index bắt đầu khi xem Highlight | null
  const [tab, setTab] = useState("posts"); // posts | saved | tagged
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [taggedPosts, setTaggedPosts] = useState([]);
  const [taggedLoaded, setTaggedLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(null); // { title, items } | null
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Modal chỉnh sửa hồ sơ (chỉ chính mình)
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", isPrivate: false });
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setForm({
      name: user?.name || "",
      description: user?.description || "",
      isPrivate: !!user?.isPrivate,
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    setErr("");
    try {
      await updateMyProfile({
        name: form.name.trim(),
        description: form.description,
        isPrivate: form.isPrivate,
      });
      setUser((prev) => ({
        ...prev,
        name: form.name.trim(),
        description: form.description,
        isPrivate: form.isPrivate,
      }));
      if (typeof setMyInfo === "function") {
        setMyInfo((prev) => ({ ...(prev || {}), name: form.name.trim() }));
      }
      setEditOpen(false);
    } catch (e) {
      setErr(e?.response?.data?.Errors?.message || e?.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setSaving(false);
    }
  };

  const load = useCallback(async () => {
    if (!targetId) {
      setErr("Không xác định được người dùng (bạn chưa đăng nhập?)");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr("");
    setTab("posts");
    setSavedPosts([]);
    setSavedLoaded(false);
    setTaggedPosts([]);
    setTaggedLoaded(false);
    try {
      const [u, p, fr, se, hl] = await Promise.all([
        getUserById(targetId),
        getUserPosts(targetId),
        getFriends(isSelf ? undefined : targetId),
        getSentRequests(isSelf ? undefined : targetId),
        getHighlights(targetId).catch(() => []),
      ]);
      setUser(u);
      setPosts(p.items || []);
      setPostCount(p.totalElements || 0);
      setFriends(Array.isArray(fr) ? fr : []);
      setFollowing(Array.isArray(se) ? se : []);
      setHighlights(Array.isArray(hl) ? hl : []);
    } catch (e) {
      setErr(e?.response?.data?.Errors?.message || e?.message || "Tải trang cá nhân thất bại");
    } finally {
      setLoading(false);
    }
  }, [targetId, isSelf]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time: khi quan hệ kết bạn thay đổi (được đồng ý / có lời mời) -> nạp lại trang, khỏi F5.
  useEffect(() => {
    const handler = () => load();
    on("friendship:changed", handler);
    return () => off("friendship:changed", handler);
  }, [load]);

  // Tải bài đã lưu (chỉ chính chủ) khi mở tab "Đã lưu"
  useEffect(() => {
    if (tab === "saved" && isSelf && !savedLoaded) {
      getSavedPosts()
        .then((p) => setSavedPosts(Array.isArray(p) ? p : []))
        .catch(() => setSavedPosts([]))
        .finally(() => setSavedLoaded(true));
    }
  }, [tab, isSelf, savedLoaded]);

  // Tải bài user được gắn thẻ khi mở tab "Được gắn thẻ"
  useEffect(() => {
    if (tab === "tagged" && targetId && !taggedLoaded) {
      getTaggedPosts(isSelf ? undefined : targetId)
        .then((p) => setTaggedPosts(Array.isArray(p) ? p : []))
        .catch(() => setTaggedPosts([]))
        .finally(() => setTaggedLoaded(true));
    }
  }, [tab, targetId, isSelf, taggedLoaded]);

  // Đổi ảnh đại diện (chỉ chính mình)
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingAvatar(true);
    setErr("");
    try {
      const media = await uploadMedia([file]); // [{url,type,...}]
      const url = media?.[0]?.url;
      if (!url) throw new Error("Upload ảnh thất bại");
      await updateMyProfile({ photo: url });
      setUser((prev) => ({ ...prev, photo: url }));
      if (typeof setMyInfo === "function") setMyInfo((prev) => ({ ...(prev || {}), photo: url }));
    } catch (e2) {
      setErr(e2?.message || "Lỗi khi cập nhật ảnh đại diện");
    } finally {
      setLoadingAvatar(false);
      e.target.value = "";
    }
  };

  const openList = (title, items) => setModal({ title, items });
  const goToUser = (id) => {
    setModal(null);
    if (id) navigate(`/u/${id}`);
  };

  // Quản lý Highlight (chỉ trang của mình)
  const onHlDelete = async (story) => {
    try { await deleteStory(story.id); setHighlights((prev) => prev.filter((x) => x.id !== story.id)); } catch { /* ignore */ }
  };
  const onHlToggle = async (story) => {
    const next = !story.isArchived; // trong Highlights, next=false nghĩa là bỏ khỏi Highlights
    try {
      await setHighlight(story.id, next);
      setHighlights((prev) => (next ? prev.map((x) => (x.id === story.id ? { ...x, isArchived: next } : x)) : prev.filter((x) => x.id !== story.id)));
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-500 gap-2">
        <Loader2 className="animate-spin" /> Đang tải...
      </div>
    );
  }
  if (err) {
    return <div className="max-w-[935px] mx-auto px-5 py-10 text-red-600">{err}</div>;
  }
  if (!user) {
    return <div className="max-w-[935px] mx-auto px-5 py-10 text-gray-500">Không tìm thấy người dùng.</div>;
  }

  const isPrivateBlocked = !isSelf && user.isPrivate && posts.length === 0 && postCount === 0;
  const gridList = tab === "saved" ? savedPosts : tab === "tagged" ? taggedPosts : posts;

  return (
    <div className="flex flex-col items-center w-full">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

      <div className="w-full max-w-[935px] px-5 py-8">
        {/* ===== Header ===== */}
        <header className="flex flex-col md:flex-row md:items-start mb-10">
          <div className="flex-shrink-0 mr-0 md:mr-24 flex justify-center md:block mb-6 md:mb-0">
            <div
              className={`w-[150px] h-[150px] rounded-full p-[2px] border border-gray-200 overflow-hidden relative group ${isSelf ? "cursor-pointer" : ""}`}
              onClick={() => isSelf && fileInputRef.current?.click()}
              title={isSelf ? "Đổi ảnh đại diện" : ""}
            >
              {loadingAvatar && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                  <Loader2 className="animate-spin text-white" />
                </div>
              )}
              <img src={user.photo || AVATAR_FALLBACK} alt="avatar" className="w-full h-full rounded-full object-cover" />
              {isSelf && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Camera className="text-white" size={26} />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-5">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <span className="text-xl font-normal">{user.username || "Người dùng"}</span>
              {isSelf && (
                <button
                  onClick={openEdit}
                  className="bg-[#efefef] dark:bg-neutral-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-neutral-600 transition"
                >
                  Chỉnh sửa trang cá nhân
                </button>
              )}
            </div>

            {/* Stats — bấm để xem danh sách */}
            <div className="flex justify-center md:justify-start gap-10 text-base">
              <span><strong>{postCount}</strong> bài viết</span>
              <button className="hover:opacity-70" onClick={() => openList("Người theo dõi", friends)}>
                <strong>{friends.length}</strong> người theo dõi
              </button>
              <button className="hover:opacity-70" onClick={() => openList("Đang theo dõi", following)}>
                Đang theo dõi <strong>{following.length}</strong>
              </button>
              <button className="hover:opacity-70" onClick={() => openList("Bạn bè", friends)}>
                <strong>{friends.length}</strong> bạn bè
              </button>
            </div>

            <div className="text-sm">
              {user.description && (
                <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">{user.description}</div>
              )}
            </div>
          </div>
        </header>

        {/* ===== Highlights (Tin nổi bật — giữ mãi) ===== */}
        {highlights.length > 0 && (
          <div className="flex gap-5 overflow-x-auto py-4 mb-2">
            {highlights.map((h, idx) => (
              <button key={h.id} onClick={() => setHlStart(idx)} className="flex flex-col items-center w-[80px] shrink-0" title={h.caption || "Tin nổi bật"}>
                <div className="w-16 h-16 rounded-full p-[2px] border border-gray-300 dark:border-neutral-600 overflow-hidden bg-gray-100">
                  {h.mediaType === "VIDEO" ? (
                    <video src={h.mediaUrl} className="w-full h-full rounded-full object-cover" muted />
                  ) : (
                    <img src={h.mediaUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  )}
                </div>
                <span className="text-xs mt-1 truncate w-[72px] text-center">{h.caption || "Nổi bật"}</span>
              </button>
            ))}
          </div>
        )}

        {hlStart != null && (
          <StoryViewerModal
            key={hlStart}
            stories={highlights}
            startIndex={hlStart}
            meId={meId}
            onClose={() => setHlStart(null)}
            onDelete={isSelf ? onHlDelete : undefined}
            onToggleHighlight={isSelf ? onHlToggle : undefined}
          />
        )}

        {/* ===== Tabs ===== */}
        <div className="border-t border-gray-300 dark:border-neutral-700 flex justify-center gap-14 text-xs tracking-widest font-semibold uppercase">
          <TabItem icon={<Grid size={12} />} label="Bài viết" active={tab === "posts"} onClick={() => setTab("posts")} />
          {isSelf && (
            <TabItem icon={<Bookmark size={12} />} label="Đã lưu" active={tab === "saved"} onClick={() => setTab("saved")} />
          )}
          <TabItem icon={<User size={12} />} label="Được gắn thẻ" active={tab === "tagged"} onClick={() => setTab("tagged")} />
        </div>

        {/* ===== Lưới bài viết / đã lưu ===== */}
        {tab === "posts" && isPrivateBlocked ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-16 h-16 rounded-full border-2 border-black dark:border-white flex items-center justify-center">
              <Lock size={30} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold">Đây là tài khoản riêng tư</h2>
            <p className="text-sm text-gray-500 max-w-sm">Hãy theo dõi và được chấp nhận để xem bài viết.</p>
          </div>
        ) : gridList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full border-2 border-black dark:border-white flex items-center justify-center mb-2">
              {tab === "saved" ? <Bookmark size={34} strokeWidth={1.5} /> : tab === "tagged" ? <User size={34} strokeWidth={1.5} /> : <Camera size={34} strokeWidth={1.5} />}
            </div>
            <h2 className="text-3xl font-extrabold">
              {tab === "saved" ? "Chưa có bài đã lưu" : tab === "tagged" ? "Chưa có bài được gắn thẻ" : "Chưa có bài viết"}
            </h2>
            <p className="text-sm text-gray-500 max-w-sm">
              {tab === "saved" ? "Các bài bạn lưu sẽ xuất hiện ở đây." : tab === "tagged" ? "Các bài có gắn thẻ người này sẽ xuất hiện ở đây." : "Các bài viết sẽ xuất hiện ở đây."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-2 mt-2">
            {gridList.map((p) => {
              const img = p.mediaList?.[0]?.mediaUrl;
              const isVideo = (p.mediaList?.[0]?.mediaType || "").toUpperCase() === "VIDEO";
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/post/${p.id}`)}
                  className="relative aspect-square bg-gray-100 dark:bg-neutral-800 overflow-hidden group"
                >
                  {img ? (
                    isVideo ? (
                      <video src={img} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 text-xs text-gray-500 text-center line-clamp-5">
                      {p.text || "Bài viết"}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== Modal chỉnh sửa hồ sơ ===== */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setEditOpen(false)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-700 px-4 py-3">
              <span className="font-semibold">Chỉnh sửa trang cá nhân</span>
              <button onClick={() => !saving && setEditOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <label className="text-sm">
                <span className="block mb-1 font-medium">Tên hiển thị</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tên hiển thị"
                />
              </label>
              <label className="text-sm">
                <span className="block mb-1 font-medium">Mô tả</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  maxLength={2000}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Giới thiệu về bạn..."
                />
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPrivate}
                  onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))}
                />
                Tài khoản riêng tư (chỉ bạn bè được chấp nhận mới xem được bài viết)
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-neutral-700 px-4 py-3">
              <button
                onClick={() => setEditOpen(false)}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />} Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal danh sách user ===== */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-xl w-full max-w-sm max-h-[70vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-700 px-4 py-3">
              <span className="font-semibold">{modal.title}</span>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              {modal.items.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-10">Danh sách trống.</div>
              ) : (
                modal.items.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => goToUser(u.id)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-left"
                  >
                    <img src={u.photo || AVATAR_FALLBACK} alt="" className="w-11 h-11 rounded-full object-cover bg-gray-200" />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{u.username}</div>
                      <div className="text-xs text-gray-500 truncate">{displayName(u)}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TabItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-1.5 py-4 cursor-pointer border-t ${active ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-gray-400"}`}>
    {icon}
    <span>{label}</span>
  </div>
);

export default ProfilePage;
