import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeed } from "../../store/feedSlice";
import PostCard from "./PostCard";
import useInfiniteScroll from "../../utils/useInfiniteScroll";
import StoryRail from "../stories/StoryRail";
import StoryViewer from "../stories/StoryViewer";
import { useState } from "react";

export default function FeedList() {
  const dispatch = useDispatch();
  const { items, nextCursor, status } = useSelector((s) => s.feed);
  const [openStory, setOpenStory] = useState(null);

  useEffect(() => {
    if (items.length === 0) dispatch(fetchFeed(0));
  }, [dispatch, items.length]);

  const moreRef = useInfiniteScroll(() => {
    if (nextCursor != null && status !== "loading") {
      dispatch(fetchFeed(nextCursor));
    }
  }, [nextCursor, status]);

  return (
    <div className="max-w-[600px] mx-auto ">
      <StoryRail onOpen={setOpenStory} />
      <div className="mt-4" />
      {items.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      <div ref={moreRef} className="h-10" />
      <StoryViewer openId={openStory} onClose={() => setOpenStory(null)} />
    </div>
  );
}
