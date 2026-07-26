import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MessageCircle, Bookmark, MoreHorizontal, Pin, Repeat2, UserPlus, UserCheck, X, Loader2 } from "lucide-react";
import Modal from "../../components/Modal";
import { getSharers } from "../../services/postApi";
import MediaCarousel from "./MediaCarousel";
import ReactionButton from "./ReactionButton";
import PostModal from "./PostModal";
import ReactionsModal from "./ReactionsModal";
import EditPostDialog from "./EditPostDialog";
import SharePostDialog from "./SharePostDialog";
import SharedOriginalCard from "./SharedOriginalCard";
import { setMyReaction, setCommentCount, setSaved, deletePostThunk } from "../../store/feedSlice";
import * as likeApi from "../../services/likeApi";
import { toggleBookmark } from "../../services/bookmarkApi";
import { addUserTag } from "../../services/postUserTagApi";
import TagPeopleDialog from "../create/TagPeopleDialog";
import ReportPostDialog from "./ReportPostDialog";
import { sendFriendRequest } from "../../services/followershipApi";
import { loadRelationship, invalidateRelationship } from "../../services/relationshipCache";
import { getRootComments } from "../../services/commentApi";
import { formatNumber } from "../../utils/formatNumber";
import { timeAgo } from "../../utils/timeAgo";
import MentionText from "../../utils/MentionText";
import { markSeen } from "../../utils/seenTracker";

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.auth.user);
  const meIdFromToken = useMemo(() => {
    try {
      const t = JSON.parse(localStorage.getItem("auth_tokens") || "null");
      if (!t?.access_token) return null;
      const b64 = t.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(b64))?.sub || null;
    } catch { return null; }
  }, []);
  const currentUserId = currentUser?.id || meIdFromToken;
  const isOwner = currentUserId && post.authorId === currentUserId;
  const saved = useSelector((s) => s.feed.savedIds || []).includes(post.id);
  const commentCount = useSelector((s) => {
    const p = (s.feed.items || []).find((x) => x.id === post.id) || (s.feed.viewing?.id === post.id ? s.feed.viewing : null);
    return p?.commentCount ?? post.commentCount ?? 0;
  });

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
  const [openReport, setOpenReport] = useState(false);
  const [peopleModal, setPeopleModal] = useState(null); // { title, loading, users } | null
  const [reactionsOpen, setReactionsOpen] = useState(false); // modal xem cảm xúc theo loại
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

  // Quan hệ với tác giả: null (đang tải) | "friend" (bạn bè) | "following" (đang theo dõi) | "none"
  const [relation, setRelation] = useState(null);
  const [friendSending, setFriendSending] = useState(false);

  // Bài share đã mất gốc thì BE chặn share tiếp -> ẩn/khoá nút share ở FE cho khớp
  const shareDisabled = post.isShared && post.originalLost;
  const hydrated = useRef(false);

  // Báo "đã lướt thấy" cho gợi ý AI — chỉ khi bài THỰC SỰ lọt vào khung nhìn (không phải
  // chỉ vì có trong response API), gộp theo lô ở seenTracker để tránh gọi API dồn dập.
  const cardRef = useRef(null);
  const seenReported = useRef(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !seenReported.current) {
          seenReported.current = true;
          markSeen(post.id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [post.id]);

  const author = post.author || { username: "Người dùng", name: "", avatar: "" };
  // Avatar mặc định = viết tắt HỌ TÊN người dùng (vd "Hoàng Hiệp" -> "HH"); nếu có ảnh thì dùng ảnh.
  const initialsName = (author.name && author.name.trim()) ? author.name.trim() : author.username;
  const avatar = author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(initialsName)}`;

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

  // Xác định quan hệ với tác giả để hiển thị đúng nút (Kết bạn / Đang theo dõi / ẩn nếu đã là bạn)
  useEffect(() => {
    if (isOwner || !currentUserId || !post.authorId) return;
    let alive = true;
    loadRelationship().then(({ friendIds, followingIds }) => {
      if (!alive) return;
      if (friendIds.has(post.authorId)) setRelation("friend");
      else if (followingIds.has(post.authorId)) setRelation("following");
      else setRelation("none");
    });
    return () => { alive = false; };
  }, [post.authorId, currentUserId, isOwner]);

  // Gửi lời mời kết bạn tới tác giả (chỉ khi đang "none"). Thành công -> chuyển sang "following".
  const handleAddFriend = async () => {
    if (friendSending || relation !== "none") return;
    setFriendSending(true);
    try {
      await sendFriendRequest(post.authorId);
      setRelation("following");
      invalidateRelationship(); // để các card khác / lần sau nạp lại đúng
    } catch (e) {
      const msg = e?.message || "Gửi lời mời thất bại";
      if (/đã gửi|đang theo dõi/i.test(msg)) setRelation("following");
      else if (/đã là bạn/i.test(msg)) setRelation("friend");
      else alert(msg);
    } finally {
      setFriendSending(false);
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
    <article ref={cardRef} className="bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg mb-6">
      {/* HEADER */}
      <div className="flex items-center px-3 py-2.5">
        <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-400 mr-3 shrink-0">
          <img
            src={avatar}
            alt={author.username}
            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black cursor-pointer"
            onClick={() => post.authorId && navigate(`/u/${post.authorId}`)}
            onError={(e) => {
              e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(initialsName);
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <span
            className="font-semibold text-sm cursor-pointer hover:underline"
            onClick={() => post.authorId && navigate(`/u/${post.authorId}`)}
          >
            {author.username}
          </span>
          {post.isPinned && <Pin size={13} className="inline ml-2 text-gray-400" />}
          <span className="text-gray-400 text-xs ml-2">• {timeAgo(post.ts)}</span>
        </div>

        {/* Nút quan hệ: đã là bạn -> ẩn; đang theo dõi -> nhãn "Đang theo dõi"; chưa -> "Kết bạn" */}
        {!isOwner && currentUserId && relation && relation !== "friend" && (
          <button
            onClick={handleAddFriend}
            disabled={friendSending || relation === "following"}
            className="flex items-center gap-1 text-xs font-semibold text-insta-primary disabled:text-gray-400 mr-1"
          >
            {relation === "following" ? <UserCheck size={16} /> : <UserPlus size={16} />}
            {friendSending
              ? "Đang gửi..."
              : relation === "following"
              ? "Đang theo dõi"
              : "Kết bạn"}
          </button>
        )}

        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="text-gray-600 dark:text-gray-300 hover:opacity-60">
            <MoreHorizontal size={20} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-7 z-20 w-40 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 text-sm">
                {isOwner ? (
                  <>
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
                  </>
                ) : (
                  <button
                    onClick={() => { setMenuOpen(false); setOpenReport(true); }}
                    className="block w-full text-left px-3 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    Báo cáo
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MEDIA */}
      {post.media && post.media.length > 0 && (
        <div className="aspect-square border-y border-gray-100 dark:border-neutral-800">
          <MediaCarousel media={post.media} className="h-full" />
        </div>
      )}

      {/* BÀI CHỈ CÓ TEXT: hiển thị như status Facebook — căn trái, cỡ chữ thường, ngay dưới header */}
      {(!post.media || post.media.length === 0) && !post.isShared && post.caption && (
        <div className="px-3 pt-1 pb-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          <MentionText text={post.caption} />
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

      {/* CAPTION cho bài CÓ media: đặt DƯỚI ảnh/video, TRÊN khu vực like/comment */}
      {post.media && post.media.length > 0 && post.caption && (
        <div className="px-3 pt-3 text-sm">
          <span className="font-semibold mr-2">{author.username}</span>
          <MentionText text={post.caption} className="whitespace-pre-wrap break-words" />
        </div>
      )}

      {/* ACTIONS — icon kèm SỐ đếm (like / comment / share) */}
      <div className="px-3 pt-2 pb-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-5 items-center text-sm">
            {/* Thích */}
            <div className="flex items-center gap-1.5">
              <ReactionButton post={post} showLabel={false} />
              <button onClick={() => setReactionsOpen(true)} className="font-semibold hover:underline">
                {formatNumber(post.likes || 0)}
              </button>
            </div>
            {/* Bình luận */}
            <button onClick={() => setOpenModal(true)} className="flex items-center gap-1.5 hover:opacity-60 transition">
              <MessageCircle size={24} />
              <span className="font-semibold">{formatNumber(commentCount)}</span>
            </button>
            {/* Chia sẻ */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setOpenShare(true)}
                disabled={shareDisabled}
                title={shareDisabled ? "Bài viết đã mất bài gốc, không thể chia sẻ" : "Chia sẻ"}
                className="hover:opacity-60 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Repeat2 size={24} />
              </button>
              {post.shareCount > 0 && (
                <button onClick={openSharers} className="font-semibold hover:underline">
                  {formatNumber(post.shareCount)}
                </button>
              )}
            </div>
          </div>
          <button onClick={handleSave} className="hover:opacity-60 transition" title={saved ? "Bỏ lưu" : "Lưu"}>
            <Bookmark size={24} className={saved ? "fill-current" : ""} />
          </button>
        </div>
      </div>

      <PostModal post={post} open={openModal} onClose={() => setOpenModal(false)} currentUserId={currentUserId} />
      <ReactionsModal open={reactionsOpen} onClose={() => setReactionsOpen(false)} targetId={post.id} />
      {openEdit && <EditPostDialog open={openEdit} onClose={() => setOpenEdit(false)} post={post} />}
      {openShare && <SharePostDialog open={openShare} onClose={() => setOpenShare(false)} post={post} />}
      <TagPeopleDialog open={openTag} onClose={() => setOpenTag(false)} onConfirm={onTagConfirm} />
      {openReport && <ReportPostDialog open={openReport} onClose={() => setOpenReport(false)} postId={post.id} />}

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
                  <img src={u.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.username || "U")}`} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
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
