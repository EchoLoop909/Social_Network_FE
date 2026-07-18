import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MessageCircle, Send, Bookmark, MoreHorizontal, Pin, Repeat2, UserPlus, X, Loader2 } from "lucide-react";
import Modal from "../../components/Modal";
import { getSharers } from "../../services/postApi";
import MediaCarousel from "./MediaCarousel";
import ReactionButton from "./ReactionButton";
import PostModal from "./PostModal";
import EditPostDialog from "./EditPostDialog";
import SharePostDialog from "./SharePostDialog";
import SharedOriginalCard from "./SharedOriginalCard";
import { setMyReaction, setCommentCount, setSaved, deletePostThunk } from "../../store/feedSlice";
import * as likeApi from "../../services/likeApi";
import { toggleBookmark } from "../../services/bookmarkApi";
import { addUserTag } from "../../services/postUserTagApi";
import TagPeopleDialog from "../create/TagPeopleDialog";
import { sendFriendRequest } from "../../services/followershipApi";
import { getRootComments } from "../../services/commentApi";
import { formatNumber } from "../../utils/formatNumber";
import { timeAgo } from "../../utils/timeAgo";
import MentionText from "../../utils/MentionText";

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.auth.user);
  const meIdFromToken = useMemo(() => {
    try {
      const t = JSON.parse(localStorage.getItem("auth_tokens") || "null");
      if (!t?.access_token) return null;
      return JSON.parse(atob(t.access_token.split(".")[1]))?.sub || null;
    } catch { return null; }
  }, []);
  const currentUserId = currentUser?.id || meIdFromToken;
  const isOwner = currentUserId && post.authorId === currentUserId;
  const saved = useSelector((s) => s.feed.savedIds || []).includes(post.id);

  // Lưu / bỏ lưu bài (bookmark) — cập nhật lạc quan rồi đồng bộ theo BE.
  const handleSave = async () => {
    const next = !saved;
    dispatch(setSaved({ postId: post.id, saved: next }));
    try {
      const real = await toggleBookmark(post.id);
      dispatch(setSaved({ postId: post.id, saved: real }));
    } catch {
      dispatch(setSaved({ postId: post.id, saved: !next })); // lỗi -> hoàn lại
    }
  };

  const [openModal, setOpenModal] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openShare, setOpenShare] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openTag, setOpenTag] = useState(false);
  const [peopleModal, setPeopleModal] = useState(null); // { title, loading, users } | null

  const openLikers = async () => {
    setPeopleModal({ title: "Lượt thích", loading: true, users: [] });
    try {
      const data = await likeApi.getReactions("POST", post.id, 1, 50);
      const users = (data?.likes || []).map((l) => l.user).filter(Boolean);
      setPeopleModal({ title: "Lượt thích", loading: false, users });
    } catch { setPeopleModal({ title: "Lượt thích", loading: false, users: [] }); }
  };
  const openSharers = async () => {
    setPeopleModal({ title: "Lượt chia sẻ", loading: true, users: [] });
    try {
      const users = await getSharers(post.id);
      setPeopleModal({ title: "Lượt chia sẻ", loading: false, users: Array.isArray(users) ? users : [] });
    } catch { setPeopleModal({ title: "Lượt chia sẻ", loading: false, users: [] }); }
  };

  // Phương án A: gắn thẻ người vào bài đã đăng
  const onTagConfirm = async (users) => {
    if (!users?.length) return;
    try {
      await Promise.all(users.map((u) => addUserTag(post.id, u.id).catch(() => {})));
      alert(`Đã gắn thẻ ${users.length} người vào bài viết`);
    } catch { /* ignore */ }
  };
  const [friendState, setFriendState] = useState("idle"); // idle | sending | done

  // Bài share đã mất gốc thì BE chặn share tiếp -> ẩn/khoá nút share ở FE cho khớp
  const shareDisabled = post.isShared && post.originalLost;
  const hydrated = useRef(false);

  const author = post.author || { username: "Người dùng", avatar: "" };
  const avatar = author.avatar || `https://ui-avatars.com/api/?name=${author.username}`;

  // Nạp cảm xúc hiện tại + số bình luận thật khi card xuất hiện
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    let alive = true;
    (async () => {
      try {
        if (currentUserId) {
          const r = await likeApi.getMyReaction("POST", post.id);
          if (alive && r) dispatch(setMyReaction({ postId: post.id, reactionType: r }));
        }
        const { totalElements } = await getRootComments(post.id, 1, 1);
        if (alive) dispatch(setCommentCount({ postId: post.id, count: totalElements }));
      } catch (e) {
        /* im lặng: chỉ là số liệu phụ trợ */
      }
    })();
    return () => {
      alive = false;
    };
  }, [post.id, currentUserId]); // eslint-disable-line

  // Gửi lời mời kết bạn tới tác giả bài viết (post.authorId là id thật từ BE).
  // Lưu ý: chưa có API lấy trạng thái quan hệ hiện tại, nên nút luôn khởi tạo ở "idle";
  // nếu BE báo "đã gửi trước đó" / "đã là bạn bè" thì coi như đã xong (done).
  const handleAddFriend = async () => {
    if (friendState !== "idle") return;
    setFriendState("sending");
    try {
      await sendFriendRequest(post.authorId);
      setFriendState("done");
    } catch (e) {
      const msg = e?.response?.data?.Errors?.message || "Gửi lời mời thất bại";
      if (/đã gửi|đã là bạn/i.test(msg)) {
        setFriendState("done");
      } else {
        setFriendState("idle");
      }
      alert(msg);
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm("Xoá bài viết này?")) return;
    try {
      await dispatch(deletePostThunk(post.id)).unwrap();
    } catch (e) {
      alert("Xoá bài thất bại: " + e);
    }
  };

  return (
    <article className="bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg mb-6">
      {/* HEADER */}
      <div className="flex items-center px-3 py-2.5">
        <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-400 mr-3 shrink-0">
          <img
            src={avatar}
            alt={author.username}
            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black"
            onError={(e) => {
              e.target.src = "https://ui-avatars.com/api/?name=" + author.username;
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm">{author.username}</span>
          {post.isPinned && <Pin size={13} className="inline ml-2 text-gray-400" />}
          <span className="text-gray-400 text-xs ml-2">• {timeAgo(post.ts)}</span>
        </div>

        {!isOwner && currentUserId && (
          <button
            onClick={handleAddFriend}
            disabled={friendState !== "idle"}
            className="flex items-center gap-1 text-xs font-semibold text-insta-primary disabled:text-gray-400 mr-1"
          >
            <UserPlus size={16} />
            {friendState === "sending"
              ? "Đang gửi..."
              : friendState === "done"
              ? "Đã gửi lời mời"
              : "Kết bạn"}
          </button>
        )}

        {isOwner && (
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)} className="text-gray-600 dark:text-gray-300 hover:opacity-60">
              <MoreHorizontal size={20} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-7 z-20 w-32 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 text-sm">
                  <button
                    onClick={() => { setMenuOpen(false); setOpenEdit(true); }}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setOpenTag(true); }}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    Gắn thẻ người
                  </button>
                  <button onClick={handleDelete} className="block w-full text-left px-3 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-700">
                    Xoá bài
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* MEDIA */}
      {post.media && post.media.length > 0 && (
        <div className="aspect-square border-y border-gray-100 dark:border-neutral-800">
          <MediaCarousel media={post.media} className="h-full" />
        </div>
      )}

      {/* BÀI CHỈ CÓ TEXT: hiển thị nội dung ở khu vực media (phía trên nút like) */}
      {(!post.media || post.media.length === 0) && !post.isShared && post.caption && (
        <div className="border-y border-gray-100 dark:border-neutral-800 px-5 py-10 min-h-[160px] flex items-center justify-center">
          <p className="text-xl leading-relaxed text-center whitespace-pre-wrap break-words">
            <MentionText text={post.caption} />
          </p>
        </div>
      )}

      {/* CARD BÀI GỐC LỒNG BÊN TRONG (chỉ với bài share) — bấm để mở bài gốc */}
      {post.isShared && (
        <div className="pt-2">
          <SharedOriginalCard
            original={post.original}
            lost={post.originalLost}
            onOpen={post.original ? () => navigate(`/post/${post.original.id}`) : undefined}
          />
        </div>
      )}

      {/* ACTIONS */}
      <div className="px-3 pt-2">
        <div className="flex justify-between mb-2 items-center">
          <div className="flex gap-4 items-center">
            <ReactionButton post={post} showLabel={false} />
            <button onClick={() => setOpenModal(true)} className="hover:opacity-60 transition">
              <MessageCircle size={24} />
            </button>
            <button
              onClick={() => setOpenShare(true)}
              disabled={shareDisabled}
              title={shareDisabled ? "Bài viết đã mất bài gốc, không thể chia sẻ" : "Chia sẻ"}
              className="hover:opacity-60 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Repeat2 size={24} />
            </button>
            <button className="hover:opacity-60 transition">
              <Send size={24} />
            </button>
          </div>
          <button onClick={handleSave} className="hover:opacity-60 transition" title={saved ? "Bỏ lưu" : "Lưu"}>
            <Bookmark size={24} className={saved ? "fill-current" : ""} />
          </button>
        </div>

        <div className="font-semibold text-sm mb-1">
          <button onClick={openLikers} className="hover:underline">{formatNumber(post.likes || 0)} lượt thích</button>
          {post.shareCount > 0 && (
            <>
              <span className="font-normal text-gray-500"> • </span>
              <button onClick={openSharers} className="font-normal text-gray-500 hover:underline">{formatNumber(post.shareCount)} lượt chia sẻ</button>
            </>
          )}
        </div>

        {post.media && post.media.length > 0 && post.caption && (
          <div className="text-sm">
            <span className="font-semibold mr-2">{author.username}</span>
            <MentionText text={post.caption} className="whitespace-pre-wrap break-words" />
          </div>
        )}

        <button
          onClick={() => setOpenModal(true)}
          className="block text-gray-500 text-sm mt-1"
        >
          {post.commentCount > 0 ? `Xem tất cả ${formatNumber(post.commentCount)} bình luận` : "Viết bình luận..."}
        </button>

        <div className="text-gray-400 text-[11px] uppercase mt-2 pb-3">{timeAgo(post.ts)}</div>
      </div>

      <PostModal post={post} open={openModal} onClose={() => setOpenModal(false)} currentUserId={currentUserId} />
      {openEdit && <EditPostDialog open={openEdit} onClose={() => setOpenEdit(false)} post={post} />}
      {openShare && <SharePostDialog open={openShare} onClose={() => setOpenShare(false)} post={post} />}
      <TagPeopleDialog open={openTag} onClose={() => setOpenTag(false)} onConfirm={onTagConfirm} />

      {peopleModal && (
        <Modal open onClose={() => setPeopleModal(null)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{peopleModal.title}</h2>
            <button onClick={() => setPeopleModal(null)} className="text-gray-500 hover:opacity-70"><X size={20} /></button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {peopleModal.loading ? (
              <div className="flex items-center gap-2 text-gray-500 py-6 justify-center"><Loader2 size={16} className="animate-spin" /> Đang tải...</div>
            ) : peopleModal.users.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">Chưa có ai.</div>
            ) : (
              peopleModal.users.map((u) => (
                <button key={u.id} onClick={() => { setPeopleModal(null); navigate(`/u/${u.id}`); }}
                  className="w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg text-left">
                  <img src={u.photo || `https://ui-avatars.com/api/?name=${u.username || "U"}`} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{u.username}</div>
                    {u.name && <div className="text-xs text-gray-500 truncate">{u.name}</div>}
                  </div>
                </button>
              ))
            )}
          </div>
        </Modal>
      )}
    </article>
  );
}
