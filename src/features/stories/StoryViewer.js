import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Modal from "../../components/Modal";
import { seenStory } from "../../store/storySlice";
import { AnimatePresence, motion } from "framer-motion";

export default function StoryViewer({ openId, onClose }) {
  const { items } = useSelector((s) => s.stories);
  const [idx, setIdx] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!openId) return;
    const i = items.findIndex((s) => s.id === openId);
    setIdx(i >= 0 ? i : 0);
  }, [openId, items]);

  useEffect(() => {
    if (!openId) return;
    dispatch(seenStory(items[idx]?.id));
  }, [idx, openId, dispatch, items]);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const story = items[idx];
  const current = story?.items?.[0];

  return (
    <Modal open={!!openId} onClose={onClose}>
      <div className="aspect-[9/16] w-[360px] mx-auto bg-black rounded-xl overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.img
            key={current?.id}
            src={current?.image}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.4 }}
          />
        </AnimatePresence>
        <div className="absolute top-0 left-0 right-0 p-2 flex gap-1">
          <div className="h-1 flex-1 bg-white/40 rounded">
            <div className="h-1 bg-white rounded animate-[progress_5s_linear]" />
          </div>
        </div>
        <div className="absolute inset-0 grid grid-cols-2">
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} />
          <button
            onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))}
          />
        </div>
      </div>
      <style>{`@keyframes progress{from{width:0}to{width:100%}}`}</style>
    </Modal>
  );
}
