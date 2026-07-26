import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Hash } from "lucide-react";
import {
  searchAll,
  getRecent,
  clearRecent,
  removeRecent,
  addRecent,
} from "../../services/searchApi";
import { searchHashtags } from "../../services/hashtagApi";

export default function SearchPanel({ onClose }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState([]);
  const [results, setResults] = useState([]);
  const [hashtagResults, setHashtagResults] = useState([]);
  const isHashtagQuery = q.trim().startsWith("#");

  useEffect(() => {
    getRecent().then(setRecent);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const kw = q.trim();
      if (!kw) {
        setResults([]);
        setHashtagResults([]);
        return;
      }
      if (kw.startsWith("#")) {
        const rs = await searchHashtags(kw).catch(() => []);
        if (alive) setHashtagResults(rs);
        return;
      }
      const rs = await searchAll(kw);
      if (alive) setResults(rs);
    })();
    return () => {
      alive = false;
    };
  }, [q]);

  const pick = async (item) => {
    await addRecent(item);
    setQ("");
    setRecent(await getRecent());
  };

  const pickHashtag = (h) => {
    setQ("");
    onClose?.();
    navigate(`/hashtag/${encodeURIComponent(h.name)}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Tìm kiếm</h2>

      <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg px-4 py-2 flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm"
          className="bg-transparent outline-none w-full text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button onClick={() => setQ("")}>
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      {!q && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500">Mới đây</h3>
            {recent.length > 0 && (
              <button
                className="text-insta-primary text-sm"
                onClick={async () => setRecent(await clearRecent())}
              >
                Xóa tất cả
              </button>
            )}
          </div>
          <ul className="space-y-3">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={r.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="text-sm">
                    <div className="font-semibold">{r.username}</div>
                    <div className="text-gray-500 leading-[18px] text-[12px]">
                      {r.name} {r.subtitle ? <span>• {r.subtitle}</span> : null}
                    </div>
                  </div>
                </div>
                <button
                  className="text-gray-400"
                  onClick={async () => setRecent(await removeRecent(r.id))}
                >
                  ✕
                </button>
              </li>
            ))}
            {recent.length === 0 && (
              <div className="text-gray-400 text-sm text-center mt-16">
                Không có nội dung tìm kiếm mới đây.
              </div>
            )}
          </ul>
        </>
      )}

      {q && isHashtagQuery && (
        <ul className="space-y-4">
          {hashtagResults.map((h) => (
            <li
              key={h.id}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => pickHashtag(h)}
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                <Hash size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">#{h.name}</div>
                <div className="text-[12px] text-gray-500 leading-[18px] truncate">
                  {h.postCount || 0} bài viết
                </div>
              </div>
            </li>
          ))}
          {hashtagResults.length === 0 && (
            <div className="text-gray-400 text-sm text-center mt-16">
              Không tìm thấy hashtag nào.
            </div>
          )}
        </ul>
      )}

      {q && !isHashtagQuery && (
        <ul className="space-y-4">
          {results.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => pick(a)}
            >
              <img
                src={a.avatar}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {a.username}
                </div>
                <div className="text-[12px] text-gray-500 leading-[18px] truncate">
                  {a.name} {a.note ? `• ${a.note}` : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
