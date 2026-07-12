import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Hiển thị media bài viết (ảnh/video). Nếu nhiều media -> carousel có mũi tên + chấm.
 * media: [{ url, type: "IMAGE"|"VIDEO" }]
 */
export default function MediaCarousel({ media = [], className = "" }) {
  const [idx, setIdx] = useState(0);
  if (!media || media.length === 0) return null;

  const cur = media[Math.min(idx, media.length - 1)];
  const many = media.length > 1;

  return (
    <div className={`relative w-full bg-black flex items-center justify-center overflow-hidden ${className}`}>
      {cur.type === "VIDEO" ? (
        <video src={cur.url} controls className="w-full h-full object-contain max-h-full" />
      ) : (
        <img src={cur.url} alt="media" className="w-full h-full object-contain max-h-full" />
      )}

      {many && (
        <>
          {idx > 0 && (
            <button
              onClick={() => setIdx((i) => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {idx < media.length - 1 && (
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1"
            >
              <ChevronRight size={20} />
            </button>
          )}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {media.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
