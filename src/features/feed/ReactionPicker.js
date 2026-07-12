import { REACTIONS } from "./reactions";

/** Thanh chọn 6 cảm xúc (hiện khi hover nút thả cảm xúc). */
export default function ReactionPicker({ onPick }) {
  return (
    <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-full bg-white dark:bg-neutral-800 shadow-lg border border-gray-200 dark:border-neutral-700 px-2 py-1 z-20">
      {REACTIONS.map((r) => (
        <button
          key={r.type}
          title={r.label}
          onClick={(e) => {
            e.stopPropagation();
            onPick(r.type);
          }}
          className="text-2xl hover:scale-125 transition-transform"
        >
          {r.emoji}
        </button>
      ))}
    </div>
  );
}
