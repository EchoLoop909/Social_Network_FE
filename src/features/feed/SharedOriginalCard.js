import MediaCarousel from "./MediaCarousel";

/**
 * Card bài GỐC lồng bên trong 1 lượt share.
 * - lost = true  -> gốc đã bị xoá, hiển thị placeholder "Bài viết gốc không còn tồn tại".
 * - original     -> shape gọn từ feedApi.normalizeOriginal: { id, author, caption, media }.
 */
export default function SharedOriginalCard({ original, lost }) {
  if (lost) {
    return (
      <div className="mx-3 mb-2 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 text-center text-sm text-gray-500">
        Bài viết gốc không còn tồn tại
      </div>
    );
  }
  if (!original) return null;

  const author = original.author || { username: "Người dùng", avatar: "" };
  const avatar = author.avatar || `https://ui-avatars.com/api/?name=${author.username}`;

  return (
    <div className="mx-3 mb-2 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
      <div className="flex items-center px-3 py-2">
        <img
          src={avatar}
          alt={author.username}
          className="w-6 h-6 rounded-full object-cover mr-2"
          onError={(e) => {
            e.target.src = "https://ui-avatars.com/api/?name=" + author.username;
          }}
        />
        <span className="font-semibold text-xs">{author.username}</span>
      </div>

      {original.media && original.media.length > 0 && (
        <div className="aspect-square border-y border-gray-100 dark:border-neutral-800">
          <MediaCarousel media={original.media} className="h-full" />
        </div>
      )}

      {original.caption && (
        <div className="px-3 py-2 text-sm whitespace-pre-wrap break-words">{original.caption}</div>
      )}
    </div>
  );
}
