// Metadata 6 loại cảm xúc, khớp enum ReactionType phía BE.
export const REACTIONS = [
  { type: "LIKE", emoji: "👍", label: "Thích", color: "text-blue-500" },
  { type: "HEART", emoji: "❤️", label: "Yêu thích", color: "text-red-500" },
  { type: "HAHA", emoji: "😂", label: "Haha", color: "text-yellow-500" },
  { type: "WOW", emoji: "😮", label: "Wow", color: "text-yellow-500" },
  { type: "SAD", emoji: "😢", label: "Buồn", color: "text-yellow-500" },
  { type: "ANGRY", emoji: "😠", label: "Phẫn nộ", color: "text-orange-600" },
];

export const reactionByType = REACTIONS.reduce((acc, r) => {
  acc[r.type] = r;
  return acc;
}, {});
