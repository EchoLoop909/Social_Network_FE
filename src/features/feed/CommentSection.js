import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Heart, Loader2 } from "lucide-react";
import {
  addComment,
  getRootComments,
  getReplies,
  updateComment,
  deleteComment,
} from "../../services/commentApi";
import * as likeApi from "../../services/likeApi";
import { incCommentCount, setCommentCount } from "../../store/feedSlice";
import { timeAgo } from "../../utils/timeAgo";
import MentionText from "../../utils/MentionText";

/* ---------- Ô nhập bình luận ---------- */
function CommentBox({ onSubmit, placeholder = "Thêm bình luận...", initial = "", submitLabel = "Đăng", autoFocus }) {
  const [text, setText] = useState(initial);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      await onSubmit(value);
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        rows={1}
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="flex-1 resize-none bg-transparent border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
      />
      <button
        onClick={submit}
        disabled={!text.trim() || sending}
        className="text-sm font-semibold text-blue-500 disabled:opacity-40 px-2 py-2"
      >
        {sending ? <Loader2 size={16} className="animate-spin" /> : submitLabel}
      </button>
    </div>
  );
}

/* ---------- Một bình luận (gốc hoặc reply) ---------- */
function CommentItem({ comment, postId, currentUserId, onDeleted, isReply = false }) {
  const dispatch = useDispatch();
  const isOwner = currentUserId && comment.author.id === currentUserId;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.reactionCount || 0);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [text, setText] = useState(comment.text);
  const [deleted, setDeleted] = useState(false);

  // Replies
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyCount, setReplyCount] = useState(comment.replyCount || 0);
  const [replyOpen, setReplyOpen] = useState(false);

  const toggleLike = async () => {
    try {
      if (liked) {
        await likeApi.unlike("COMMENT", comment.id);
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await likeApi.react("COMMENT", comment.id, "LIKE");
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch (e) {
      console.error("Like comment lỗi:", e);
    }
  };

  const loadReplies = async () => {
    setLoadingReplies(true);
    try {
      const { items } = await getReplies(comment.id, 1, 50);
      setReplies(items);
      setShowReplies(true);
    } catch (e) {
      console.error("Tải reply lỗi:", e);
    } finally {
      setLoadingReplies(false);
    }
  };

  const submitReply = async (value) => {
    await addComment({ postId, text: value, parentCommentId: comment.id });
    dispatch(incCommentCount({ postId, delta: 1 }));
    setReplyOpen(false);
    setReplyCount((c) => c + 1);
    await loadReplies();
  };

  const saveEdit = async () => {
    const value = editText.trim();
    if (!value) return;
    try {
      await updateComment({ commentId: comment.id, text: value });
      setText(value);
      setEditing(false);
    } catch (e) {
      console.error("Sửa comment lỗi:", e);
    }
  };

  const remove = async () => {
    if (!window.confirm("Xoá bình luận này?")) return;
    try {
      await deleteComment(comment.id);
      dispatch(incCommentCount({ postId, delta: -1 }));
      setDeleted(true);
      onDeleted && onDeleted(comment.id);
    } catch (e) {
      console.error("Xoá comment lỗi:", e);
    }
  };

  if (deleted) return null;

  return (
    <div className={`flex gap-2 ${isReply ? "ml-10 mt-3" : "mt-4"}`}>
      <img
        src={comment.author.avatar}
        alt={comment.author.username}
        className="w-8 h-8 rounded-full object-cover shrink-0"
        onError={(e) => {
          e.target.src = "https://ui-avatars.com/api/?name=" + comment.author.username;
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-100 dark:bg-neutral-800 rounded-2xl px-3 py-2">
          <div className="text-sm font-semibold">{comment.author.username}</div>
          {editing ? (
            <div className="mt-1">
              <textarea
                rows={2}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full resize-none bg-transparent border border-gray-300 dark:border-neutral-600 rounded-lg px-2 py-1 text-sm outline-none"
              />
              <div className="flex gap-3 mt-1 text-xs">
                <button onClick={saveEdit} className="text-blue-500 font-semibold">Lưu</button>
                <button onClick={() => { setEditing(false); setEditText(text); }} className="text-gray-500">Huỷ</button>
              </div>
            </div>
          ) : (
            <div className="text-sm whitespace-pre-wrap break-words"><MentionText text={text} /></div>
          )}
        </div>

        {/* Hàng thao tác */}
        <div className="flex items-center gap-4 mt-1 px-3 text-xs text-gray-500">
          <span>{timeAgo(comment.ts)}</span>
          <button onClick={toggleLike} className={`flex items-center gap-1 font-semibold ${liked ? "text-red-500" : ""}`}>
            <Heart size={13} className={liked ? "fill-red-500" : ""} /> {likeCount > 0 ? likeCount : "Thích"}
          </button>
          {!isReply && (
            <button onClick={() => setReplyOpen((v) => !v)} className="font-semibold">Trả lời</button>
          )}
          {isOwner && !editing && (
            <>
              <button onClick={() => setEditing(true)} className="font-semibold">Sửa</button>
              <button onClick={remove} className="font-semibold text-red-500">Xoá</button>
            </>
          )}
        </div>

        {/* Ô trả lời */}
        {replyOpen && (
          <div className="mt-2 px-1">
            <CommentBox autoFocus placeholder={`Trả lời ${comment.author.username}...`} submitLabel="Gửi" onSubmit={submitReply} />
          </div>
        )}

        {/* Xem phản hồi */}
        {!isReply && replyCount > 0 && (
          <button
            onClick={() => (showReplies ? setShowReplies(false) : loadReplies())}
            className="mt-2 px-3 text-xs font-semibold text-gray-500 flex items-center gap-1"
          >
            {loadingReplies && <Loader2 size={12} className="animate-spin" />}
            {showReplies ? "Ẩn phản hồi" : `Xem ${replyCount} phản hồi`}
          </button>
        )}

        {showReplies &&
          replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              postId={postId}
              currentUserId={currentUserId}
              isReply
              onDeleted={(id) => {
                setReplies((list) => list.filter((x) => x.id !== id));
                setReplyCount((c) => Math.max(0, c - 1));
              }}
            />
          ))}
      </div>
    </div>
  );
}

/* ---------- Khu vực bình luận của 1 bài ---------- */
export default function CommentSection({ post, currentUserId }) {
  const dispatch = useDispatch();
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const loadedOnce = useRef(false);

  const load = async (p) => {
    setLoading(true);
    try {
      const { items, totalPage: tp, totalElements } = await getRootComments(post.id, p, 10);
      setComments((prev) => (p === 1 ? items : [...prev, ...items]));
      setTotalPage(tp);
      setPage(p);
      // Đồng bộ số comment thật lên store (BE không maintain commentCount)
      if (p === 1) dispatch(setCommentCount({ postId: post.id, count: totalElements }));
    } catch (e) {
      console.error("Tải bình luận lỗi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    load(1);
  }, [post.id]); // eslint-disable-line

  const submitRoot = async (value) => {
    await addComment({ postId: post.id, text: value });
    dispatch(incCommentCount({ postId: post.id, delta: 1 }));
    await load(1);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-1">
        {comments.length === 0 && !loading && (
          <div className="text-center text-gray-400 text-sm py-8">Chưa có bình luận nào</div>
        )}
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            postId={post.id}
            currentUserId={currentUserId}
            onDeleted={(id) => setComments((list) => list.filter((x) => x.id !== id))}
          />
        ))}
        {page < totalPage && (
          <button onClick={() => load(page + 1)} className="mt-4 text-sm text-gray-500 font-semibold">
            Xem thêm bình luận
          </button>
        )}
        {loading && (
          <div className="flex justify-center py-3">
            <Loader2 size={18} className="animate-spin text-gray-400" />
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 dark:border-neutral-800 pt-3 mt-2">
        <CommentBox onSubmit={submitRoot} />
      </div>
    </div>
  );
}
