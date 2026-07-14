import React, { useState } from "react";
import { Lock, UserPlus, UserMinus, Check, Loader2, AlertCircle, Ban } from "lucide-react";
import { getStoredTokens } from "../services/authApi";
import { getUserById, getUserPosts } from "../services/profileApi";
import {
  sendFriendRequest,
  acceptFriendRequest,
  unfriend,
  blockUser,
  unblockUser,
} from "../services/followershipApi";

// Lấy id user hiện tại từ JWT (sub) để phân biệt "trang của chính mình".
function getMyId() {
  const at = getStoredTokens()?.access_token;
  if (!at) return null;
  try {
    const payload = JSON.parse(
      atob(at.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload.sub || null;
  } catch {
    return null;
  }
}

export default function FriendRequestDemo() {
  const myId = getMyId();

  const [targetId, setTargetId] = useState("");
  const [loadedId, setLoadedId] = useState(null); // id đã load hồ sơ
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [ok, setOk] = useState(""); // thông báo thành công / info
  const [err, setErr] = useState(""); // thông báo lỗi (bắt từ BE)
  const [acting, setActing] = useState(false); // đang gọi action kết bạn

  // Ô chấp nhận lời mời (đóng vai người NHẬN): nhập id người đã gửi lời mời tới mình
  const [requesterId, setRequesterId] = useState("");

  const isOwner = user && myId && user.id === myId;
  const isPrivateBlocked =
    user && user.isPrivate === true && !isOwner && posts.length === 0;

  async function loadProfile(id) {
    const uid = (id ?? targetId).trim();
    if (!uid) {
      setErr("Nhập id người dùng cần xem");
      return;
    }
    setLoading(true);
    setErr("");
    setOk("");
    setUser(null);
    setPosts([]);
    try {
      const u = await getUserById(uid);
      if (!u) {
        setErr("Không tìm thấy người dùng với id = " + uid);
        setLoadedId(null);
        return;
      }
      setUser(u);
      setLoadedId(uid);
      // Lấy bài viết — BE tự chặn nếu private & chưa được chấp nhận (trả rỗng).
      const { items } = await getUserPosts(uid);
      setPosts(items);
    } catch (e) {
      setErr(e?.message || "Tải hồ sơ thất bại");
    } finally {
      setLoading(false);
    }
  }

  // Bọc gọi action: hiện loading, bắt lỗi BE, reload lại bài viết sau khi đổi quan hệ.
  async function runAction(fn, targetForReload) {
    setActing(true);
    setErr("");
    setOk("");
    try {
      const msg = await fn();
      setOk(msg);
      if (targetForReload) {
        const { items } = await getUserPosts(targetForReload);
        setPosts(items);
      }
    } catch (e) {
      setErr(e?.message || "Thao tác thất bại");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="w-full max-w-[720px] mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Demo — Gửi lời mời kết bạn</h1>
      <p className="text-sm text-gray-500 mb-6">
        Nhập id của một người dùng khác (lấy từ Swagger / DB) để xem hồ sơ và thử gửi lời mời.
        Mọi lỗi từ backend đều được hiển thị bên dưới.
      </p>

      {/* Ô nhập id + tải hồ sơ */}
      <form
        className="flex gap-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          loadProfile();
        }}
      >
        <input
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          placeholder="id người dùng (targetUserId)"
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Tải hồ sơ
        </button>
      </form>

      {/* Thông báo */}
      {err && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <span>{err}</span>
        </div>
      )}
      {ok && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm">
          <Check size={18} className="mt-0.5 flex-shrink-0" />
          <span>{ok}</span>
        </div>
      )}

      {/* Hồ sơ */}
      {user && (
        <div className="border rounded-xl p-5 mb-6">
          <div className="flex items-center gap-4">
            <img
              src={user.photo || "https://via.placeholder.com/72"}
              alt="avatar"
              className="w-[72px] h-[72px] rounded-full object-cover border"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {user.username || "(không tên)"}
                </span>
                {user.isPrivate ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    <Lock size={12} /> Riêng tư
                  </span>
                ) : (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Công khai
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {[user.lastname, user.firstname].filter(Boolean).join(" ")}
              </div>
              {user.description && (
                <div className="text-sm text-gray-500 mt-1">{user.description}</div>
              )}
            </div>
          </div>

          {/* Nút hành động kết bạn */}
          {isOwner ? (
            <div className="mt-4 text-sm text-gray-500 italic">
              Đây là trang của chính bạn.
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={acting}
                onClick={() => runAction(() => sendFriendRequest(user.id), user.id)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {acting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                Gửi lời mời kết bạn
              </button>
              <button
                disabled={acting}
                onClick={() => runAction(() => unfriend(user.id), user.id)}
                className="flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
              >
                <UserMinus size={16} />
                Hủy kết bạn / Bỏ theo dõi
              </button>
              <button
                disabled={acting}
                onClick={() => runAction(() => blockUser(user.id), user.id)}
                className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
              >
                <Ban size={16} /> Chặn
              </button>
              <button
                disabled={acting}
                onClick={() => runAction(() => unblockUser(user.id), user.id)}
                className="flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
              >
                Bỏ chặn
              </button>
            </div>
          )}
        </div>
      )}

      {/* Khu vực bài viết */}
      {user && (
        <div>
          <h2 className="text-base font-semibold mb-3">Bài viết</h2>

          {isPrivateBlocked ? (
            <div className="flex flex-col items-center justify-center text-center py-12 border rounded-xl bg-gray-50">
              <Lock size={40} className="text-gray-400 mb-3" />
              <div className="font-semibold">Tài khoản này ở chế độ riêng tư</div>
              <p className="text-sm text-gray-500 max-w-sm mt-1">
                Bạn cần gửi lời mời kết bạn và được <b>{user.username}</b> chấp nhận
                mới xem được bài viết và thông tin trang cá nhân.
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-sm text-gray-500 py-8 text-center border rounded-xl">
              Chưa có bài viết nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {posts.map((p) => (
                <div key={p.id} className="border rounded-lg overflow-hidden">
                  {p.mediaList?.[0]?.mediaUrl && (
                    <img
                      src={p.mediaList[0].mediaUrl}
                      alt="post"
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-3">
                    <div className="text-sm whitespace-pre-line">
                      {p.text || "(không có nội dung)"}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {p.visibility} · ❤ {p.reactionCount ?? 0} · 💬{" "}
                      {p.commentCount ?? 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Khu vực CHẤP NHẬN lời mời (đóng vai người nhận) */}
      {loadedId && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-base font-semibold mb-2">
            Chấp nhận lời mời (đóng vai người nhận)
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Nhập id của người đã gửi lời mời tới <b>bạn</b> để chấp nhận (FOLLOWING → ACCEPTED).
          </p>
          <div className="flex gap-2">
            <input
              value={requesterId}
              onChange={(e) => setRequesterId(e.target.value)}
              placeholder="requesterId (người gửi lời mời)"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              disabled={acting || !requesterId.trim()}
              onClick={() =>
                runAction(() => acceptFriendRequest(requesterId.trim()), null)
              }
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              <Check size={16} />
              Chấp nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
