import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Volume2, VolumeX, Play } from "lucide-react";
import { getReels } from "../services/feedApi";
import { recordVideoView } from "../services/postApi";

/**
 * Trang Reels: xem video dọc kiểu TikTok/Instagram.
 * - Mỗi video 1 màn hình, cuộn dọc snap.
 * - Tự phát video đang ở giữa màn (IntersectionObserver), tạm dừng video rời đi.
 * - Khi rời 1 video -> gửi tiến độ xem (watch-time) cho BE nuôi gợi ý.
 */
export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [cursor, setCursor] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [muted, setMuted] = useState(true); // bắt đầu tắt tiếng để trình duyệt cho autoplay

  const load = useCallback(async () => {
    if (loading || done) return;
    setLoading(true);
    try {
      const { posts, nextCursor } = await getReels({ cursor, limit: 10 });
      setReels((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...posts.filter((p) => !seen.has(p.id))];
      });
      if (nextCursor) setCursor(nextCursor);
      else setDone(true);
    } catch (e) {
      setDone(true);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, done]);

  useEffect(() => {
    load();
  }, []); // chỉ tải trang đầu khi mở Reels

  if (!loading && reels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Chưa có video nào.
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
      onScroll={(e) => {
        const el = e.currentTarget;
        // gần chạm đáy -> tải thêm
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 800) load();
      }}
    >
      {reels.map((r) => (
        <ReelItem
          key={r.id}
          reel={r}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
        />
      ))}
      {loading && (
        <div className="h-16 flex items-center justify-center text-white/70">Đang tải…</div>
      )}
    </div>
  );
}

function ReelItem({ reel, muted, onToggleMute }) {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const watchedRef = useRef(0);
  const [playing, setPlaying] = useState(false);

  const videoUrl = (reel.media.find((m) => m.type === "VIDEO") || reel.media[0] || {}).url;

  // Gửi tiến độ xem lên BE (watch-time)
  const flush = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const watchedSeconds = Math.round(watchedRef.current);
    if (watchedSeconds <= 0) return;
    recordVideoView({
      postId: reel.id,
      watchedSeconds,
      duration: Math.round(v.duration || 0),
    });
  }, [reel.id]);

  useEffect(() => {
    const v = videoRef.current;
    const el = wrapRef.current;
    if (!v || !el) return;

    // Vào giữa màn -> play; rời -> pause + gửi watch-time
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          v.play().then(() => setPlaying(true)).catch(() => {});
        } else {
          v.pause();
          setPlaying(false);
          flush();
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    io.observe(el);

    const onTime = () => {
      watchedRef.current = Math.max(watchedRef.current, v.currentTime);
    };
    v.addEventListener("timeupdate", onTime);

    return () => {
      io.disconnect();
      v.removeEventListener("timeupdate", onTime);
      flush(); // rời component -> gửi lần cuối
    };
  }, [flush]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="snap-start h-screen w-full flex items-center justify-center relative"
    >
      <div className="relative h-full max-h-screen w-full max-w-[480px] bg-black">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            loop
            playsInline
            muted={muted}
            preload="metadata"
            onClick={togglePlay}
            className="h-full w-full object-contain bg-black"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-white/60">
            Video lỗi
          </div>
        )}

        {/* Nút play khi đang tạm dừng */}
        {!playing && videoUrl && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Play size={64} className="text-white/80" fill="currentColor" />
          </button>
        )}

        {/* Tắt/bật tiếng */}
        <button
          onClick={onToggleMute}
          className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2"
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Tác giả + caption */}
        <div className="absolute left-0 right-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
          <div
            className="flex items-center gap-2 mb-2 cursor-pointer w-fit"
            onClick={() => navigate(`/u/${reel.author.id}`)}
          >
            <img
              src={reel.author.avatar}
              alt=""
              className="w-9 h-9 rounded-full object-cover border border-white/50"
            />
            <span className="font-semibold">{reel.author.username}</span>
          </div>
          {reel.caption && <p className="text-sm line-clamp-2">{reel.caption}</p>}
        </div>

        {/* Cột tương tác bên phải */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 text-white">
          <div className="flex flex-col items-center">
            <Heart size={28} />
            <span className="text-xs mt-1">{reel.likes}</span>
          </div>
          <div
            className="flex flex-col items-center cursor-pointer"
            onClick={() => navigate(`/post/${reel.id}`)}
          >
            <MessageCircle size={28} />
            <span className="text-xs mt-1">{reel.commentCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
