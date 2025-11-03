// Ảnh mẫu public (pexels/unsplash)
const IMG = (i) => `https://picsum.photos/id/${100 + (i % 80)}/900/900`;

export const currentUser = {
  id: "u_me",
  username: "me",
  name: "Bạn",
  avatar:
    "https://images.unsplash.com/photo-1545996124-0501ebae84d0?q=80&w=200&auto=format&fit=crop",
};

export const users = [
  currentUser,
  {
    id: "u_anna",
    username: "anna",
    name: "Anna",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "u_mike",
    username: "mike",
    name: "Mike",
    avatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "u_sara",
    username: "sara",
    name: "Sara",
    avatar:
      "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "u_tlnails",
    username: "ttl.nails",
    name: "TTL Nails",
    avatar:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=200&auto=format&fit=crop",
  },
];

export const stories = users.slice(0, 5).map((u, idx) => ({
  id: "s" + idx,
  userId: u.id,
  seen: idx % 3 === 0,
  items: [
    {
      id: "s" + idx + "_1",
      image: IMG(80 + idx),
      ts: Date.now() - (idx + 1) * 3600e3,
    },
    {
      id: "s" + idx + "_2",
      image: IMG(81 + idx),
      ts: Date.now() - (idx + 1) * 1800e3,
    },
  ],
}));

const sampleCaptions = [
  "TT... xem thêm --------------------",
  "Một ngày thật đẹp! #sunny",
  "Coffee & code ☕️",
  "Hello từ Instagram clone 👋",
  "Cuối tuần thư giãn...",
];

export const posts = Array.from({ length: 12 }).map((_, i) => {
  const author = users[(i % (users.length - 1)) + 1];
  return {
    id: "p" + (i + 1),
    authorId: author.id,
    images: [IMG(60 + i), IMG(61 + i), IMG(62 + i)].slice(0, (i % 3) + 1),
    likes: Math.floor(Math.random() * 2000) + 10,
    likedByMe: false,
    savedByMe: false,
    caption: sampleCaptions[i % sampleCaptions.length],
    ts: Date.now() - (i + 1) * 3600e3,
    comments: [
      {
        id: "c" + i + "_1",
        userId: "u_anna",
        content: "Xinh quá!",
        ts: Date.now() - 200000,
      },
      {
        id: "c" + i + "_2",
        userId: "u_mike",
        content: "🔥🔥",
        ts: Date.now() - 150000,
      },
    ],
  };
});

export const suggestions = ["u_anna", "u_mike", "u_sara", "u_tlnails"].map(
  (uid, i) => ({
    id: "sg" + i,
    userId: uid,
    followed: i % 2 === 0,
  })
);

export const notificationsSeed = [
  {
    id: "n1",
    type: "like",
    userId: "u_anna",
    postId: "p1",
    read: false,
    ts: Date.now() - 5e5,
  },
  {
    id: "n2",
    type: "follow",
    userId: "u_mike",
    read: false,
    ts: Date.now() - 9e5,
  },
  {
    id: "n3",
    type: "comment",
    userId: "u_sara",
    postId: "p2",
    read: true,
    ts: Date.now() - 2e6,
  },
];

export const threadsSeed = [
  {
    id: "t1",
    users: ["u_me", "u_anna"],
    messages: Array.from({ length: 12 }).map((_, i) => ({
      id: "m1_" + i,
      from: i % 2 ? "u_me" : "u_anna",
      text: i % 3 ? "Hello " + i : "😍",
      ts: Date.now() - (12 - i) * 600000,
    })),
    unreadCount: 2,
  },
  {
    id: "t2",
    users: ["u_me", "u_mike"],
    messages: Array.from({ length: 14 }).map((_, i) => ({
      id: "m2_" + i,
      from: i % 2 ? "u_me" : "u_mike",
      text: i % 4 ? "OK " + i : "👍",
      ts: Date.now() - (14 - i) * 500000,
    })),
    unreadCount: 1,
  },
  {
    id: "t3",
    users: ["u_me", "u_sara"],
    messages: Array.from({ length: 10 }).map((_, i) => ({
      id: "m3_" + i,
      from: i % 2 ? "u_me" : "u_sara",
      text: i % 2 ? "See ya" : "Hi",
      ts: Date.now() - (10 - i) * 550000,
    })),
    unreadCount: 0,
  },
];

export const exploreSeed = Array.from({ length: 18 }).map((_, i) => ({
  id: "e" + i,
  image: IMG(70 + i),
}));
