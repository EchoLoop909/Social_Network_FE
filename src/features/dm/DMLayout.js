import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchThreads,
  fetchMessages,
  sendMessageThunk,
  setCurrent,
} from "../../store/dmSlice";
import { Edit2, Search as SearchIcon, Send } from "lucide-react";

export default function DMLayout() {
  const dispatch = useDispatch();
  const { threads, current, messagesByThread } = useSelector((s) => s.dm);
  const me = useSelector((s) => s.auth.me);

  useEffect(() => {
    dispatch(fetchThreads());
  }, [dispatch]);

  useEffect(() => {
    if (current && !messagesByThread[current]) dispatch(fetchMessages(current));
  }, [current, messagesByThread, dispatch]);

  return (
    <div className="grid grid-cols-[400px_1fr] h-[calc(100vh-40px)] border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
      {/* LEFT COLUMN */}
      <div className="border-r border-gray-200 dark:border-neutral-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="font-semibold text-lg">{me?.username || "me"}</div>
          <button
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full"
            aria-label="Viết tin nhắn mới"
          >
            <Edit2 size={18} />
          </button>
        </div>

        {/* Search box */}
        <div className="px-4 mb-3">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 rounded-full px-3 py-2">
            <SearchIcon size={16} className="text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="bg-transparent text-sm flex-1 outline-none"
            />
          </div>
        </div>

        {/* Note */}
        <div className="px-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={me?.avatar || "https://picsum.photos/id/64/60/60"}
                alt=""
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 right-0 bg-insta-primary rounded-full p-[2px]">
                <div className="bg-white w-3 h-3 rounded-full"></div>
              </div>
            </div>
            <div className="text-sm">
              <div className="font-semibold">{me?.username}</div>
              <div className="text-gray-500 text-[12px] leading-[16px]">
                Ghi chú của bạn
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-between text-sm font-semibold px-4 mb-2 border-b border-gray-200 dark:border-neutral-800 pb-2">
          <span className="text-black dark:text-white">Tin nhắn</span>
          <span className="text-gray-400">Tin nhắn đang chờ</span>
        </div>

        {/* Thread list */}
        <div className="overflow-y-auto flex-1">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => dispatch(setCurrent(t.id))}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-800 ${
                current === t.id ? "bg-gray-50 dark:bg-neutral-800" : ""
              }`}
            >
              <img
                src={t.partner.avatar}
                alt=""
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">
                  {t.partner.username}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {t.messages.at(-1)?.text || ""}
                </div>
              </div>
              {t.unreadCount ? (
                <span className="w-2 h-2 bg-insta-primary rounded-full" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      {!current ? (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 border-2 border-gray-400 rounded-full flex items-center justify-center mb-4">
            <Send size={36} className="text-gray-500" />
          </div>
          <div className="text-2xl font-light mb-2">Tin nhắn của bạn</div>
          <div className="text-sm text-gray-500 mb-6">
            Gửi ảnh và tin nhắn riêng tư cho bạn bè hoặc nhóm
          </div>
          <button className="bg-insta-primary text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Gửi tin nhắn
          </button>
        </div>
      ) : (
        <ChatWindow
          messages={messagesByThread[current] || []}
          thread={threads.find((t) => t.id === current)}
          onSend={(text) =>
            dispatch(sendMessageThunk({ threadId: current, text }))
          }
        />
      )}
    </div>
  );
}

function ChatWindow({ messages, thread, onSend }) {
  return (
    <div className="flex flex-col h-full overflow-y-scroll">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-neutral-800 px-4 py-3">
        <img
          src={thread.partner.avatar}
          alt=""
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="text-sm font-semibold">{thread.partner.username}</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[70%] px-3 py-2 rounded-lg ${
              m.from === "u_me"
                ? "ml-auto bg-insta-primary text-white"
                : "bg-gray-100 dark:bg-neutral-800"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} />
    </div>
  );
}

function ChatInput({ onSend }) {
  const onSubmit = (e) => {
    e.preventDefault();
    const text = e.target.text.value.trim();
    if (!text) return;
    onSend(text);
    e.target.reset();
  };
  return (
    <form
      onSubmit={onSubmit}
      className="p-3 border-t border-gray-200 dark:border-neutral-800 flex gap-2"
    >
      <input
        name="text"
        className="flex-1 bg-transparent border border-gray-300 dark:border-neutral-700 rounded-full px-3 py-2 outline-none text-sm"
        placeholder="Nhắn tin..."
      />
      <button className="px-3 py-2 bg-insta-primary text-white rounded-full text-sm">
        Gửi
      </button>
    </form>
  );
}
