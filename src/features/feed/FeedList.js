import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeed, setSavedIds } from "../../store/feedSlice";
import { getSavedIds } from "../../services/bookmarkApi";
import PostCard from "./PostCard";
import useInfiniteScroll from "../../utils/useInfiniteScroll";

export default function FeedList() {
  const dispatch = useDispatch();
  const { items, nextCursor, status } = useSelector((s) => s.feed);

  useEffect(() => {
    if (items.length === 0) dispatch(fetchFeed(0));
  }, [dispatch, items.length]);

  // Nạp danh sách bài đã lưu để tô nút "đã lưu" đúng trạng thái
  useEffect(() => {
    getSavedIds().then((ids) => dispatch(setSavedIds(ids))).catch(() => {});
  }, [dispatch]);

  const moreRef = useInfiniteScroll(() => {
    if (nextCursor != null && status !== "loading") {
      dispatch(fetchFeed(nextCursor));
    }
  }, [nextCursor, status]);

  return (
    <div className="max-w-[600px] mx-auto ">
      {items.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      <div ref={moreRef} className="h-10" />
    </div>
  );
}
