import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  HiMiniArrowLeft,
  HiOutlineChatBubbleLeftRight,
  HiOutlineMagnifyingGlass,
  HiOutlineUserCircle,
  HiOutlineEllipsisHorizontal,
  HiOutlineCheckBadge,
  HiOutlineEnvelope,
  HiOutlineInboxArrowDown,
  HiOutlineXMark,
} from "react-icons/hi2";
import ChatComposer from "../../../components/chat/ChatComposer";
import ChatMessageBubble from "../../../components/chat/ChatMessageBubble";
import useContextPro from "../../../hooks/useContextPro";
import { useDebounce } from "../../../hooks/useDebounce";
import { useChatRealtime } from "../../../hooks/useChatRealtime";
import {
  useMarkSupportChatRead,
  useSendSupportMessage,
  useSupportChats,
  useSupportMessages,
  useUploadSupportAttachment,
} from "../../../hooks/useChat";
import type { SupportAttachmentUpload, SupportChat, SupportMessage } from "../../../types/chat";

function formatTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return new Intl.DateTimeFormat("ru", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }
  if (diffDays === 1) return "Yesterday";

  return new Intl.DateTimeFormat("ru", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatTimeFull(value: string) {
  return new Intl.DateTimeFormat("ru", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getMessagePreview(message: SupportMessage | null) {
  if (!message) return "No messages yet";
  if (message.body) return message.body;
  if (message.attachment_content_type?.startsWith("image/")) return "📷 Image";
  if (message.attachment_content_type === "application/pdf") return "📄 PDF file";
  return message.attachment_name || "📎 File";
}

function getAvatarColor(name: string) {
  const colors = [
    "from-[#b84a5b] to-[#d93d53]",
    "from-[#7c3aed] to-[#a78bfa]",
    "from-[#0ea5e9] to-[#38bdf8]",
    "from-[#f59e0b] to-[#fbbf24]",
    "from-[#10b981] to-[#34d399]",
    "from-[#ec4899] to-[#f472b6]",
    "from-[#8b5cf6] to-[#c084fc]",
    "from-[#f97316] to-[#fb923c]",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-gradient-to-r from-[#1f0a0e] via-[#2d1217] to-[#1f0a0e] ${className}`}
      style={{ backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }}
    />
  );
}

function AdminChats() {
  const [search, setSearch] = useState("");
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedAttachment, setUploadedAttachment] = useState<SupportAttachmentUpload | null>(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);
  const debouncedSearch = useDebounce(search.trim(), 350);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const didPickInitialChatRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const {
    state: { user },
  } = useContextPro();

  const chatsQuery = useSupportChats({
    limit: 100,
    search: debouncedSearch || undefined,
  });
  const chats = useMemo(() => chatsQuery.data?.items ?? [], [chatsQuery.data?.items]);
  const activeChat = chats.find((chat) => chat.owner_id === activeOwnerId) ?? null;
  const messagesQuery = useSupportMessages(activeOwnerId ?? undefined);
  const sendMessageMutation = useSendSupportMessage();
  const uploadAttachmentMutation = useUploadSupportAttachment();
  const markReadMutation = useMarkSupportChatRead();

  useChatRealtime({
    scope: "admin",
    enabled: Boolean(user?.id),
    onEvent: (payload) => {
      if (payload.event === "support.message.created" && payload.message?.sender_role === "owner") {
        toast.info(
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span><strong>{payload.chat.owner.full_name}:</strong> new message</span>
          </div>
        );
      }
    },
  });

  useEffect(() => {
    if (!didPickInitialChatRef.current && !activeOwnerId && chats.length) {
      didPickInitialChatRef.current = true;
      setActiveOwnerId(chats[0].owner_id);
      setIsMobileListOpen(false);
    }
  }, [activeOwnerId, chats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messagesQuery.data?.items.length, activeOwnerId]);

  useEffect(() => {
    if (!activeChat?.unread_count || !activeOwnerId || markReadMutation.isPending) return;
    markReadMutation.mutate(activeOwnerId);
  }, [activeChat?.unread_count, activeOwnerId, markReadMutation]);

  const sendCurrentMessage = async () => {
    const trimmed = message.trim();
    if ((!trimmed && !uploadedAttachment) || !activeOwnerId || sendMessageMutation.isPending || uploadAttachmentMutation.isPending) return;

    try {
      setMessage("");
      setSelectedFile(null);
      setUploadedAttachment(null);
      await sendMessageMutation.mutateAsync({
        ownerId: activeOwnerId,
        payload: {
          body: trimmed,
          attachment_url: uploadedAttachment?.url ?? null,
          attachment_file_id: uploadedAttachment?.file_id ?? null,
          attachment_name: uploadedAttachment?.name ?? null,
          attachment_content_type: uploadedAttachment?.content_type ?? null,
          attachment_size: uploadedAttachment?.size ?? null,
        },
      });
    } catch {
      setMessage(trimmed);
      toast.error("Message not sent");
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!activeOwnerId) return;
    try {
      setSelectedFile(file);
      setUploadedAttachment(null);
      const uploaded = await uploadAttachmentMutation.mutateAsync({ ownerId: activeOwnerId, file });
      setUploadedAttachment(uploaded);
    } catch {
      setSelectedFile(null);
      setUploadedAttachment(null);
      toast.error("File upload failed");
    }
  };

  const messages = messagesQuery.data?.items ?? [];

  const handleBackToList = () => {
    setActiveOwnerId(null);
    setIsMobileListOpen(true);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-7xl overflow-hidden rounded-[1.6rem] border border-[#3d171c] bg-[#090203] shadow-[0_26px_80px_rgba(0,0,0,0.28)]">
      {/* ---- SIDEBAR / CHAT LIST ---- */}
      <aside
        className={`${
          isMobileListOpen ? "flex" : "hidden"
        } w-full shrink-0 flex-col border-r border-[#2a1015] bg-[#0d0406] md:flex md:w-[380px] ${
          activeChat ? "hidden md:flex" : ""
        }`}
      >
        {/* Header */}
        <header className="relative border-b border-[#2a1015] bg-[#0d0406]/95 px-5 pb-5 pt-5 backdrop-blur-sm">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#b99089]/70">Admin Panel</p>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#b84a5b]/20 px-1.5 text-[10px] font-bold text-[#e4455b]">
              {chats.length}
            </span>
          </div>
          <h1 className="font-cormorant text-4xl leading-none text-white">Chats</h1>

          {/* Search */}
          <label className="mt-4 flex h-11 items-center gap-3 rounded-xl border border-[#3d171c] bg-[#0d0406] px-3 transition-all duration-200 focus-within:border-[#b84a5b] focus-within:shadow-[0_0_20px_rgba(184,74,91,0.15)]">
            <HiOutlineMagnifyingGlass className="text-lg text-[#b99089]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search owner..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6b4a45]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-[#b99089] hover:bg-white/10"
              >
                <HiOutlineXMark className="text-sm" />
              </button>
            )}
          </label>
        </header>

        {/* Chat list */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
          {chatsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-2xl p-3">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/5 rounded-lg" />
                    <Skeleton className="h-3 w-4/5 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : chats.length ? (
            <div className="space-y-1">
              {chats.map((chat: SupportChat, index: number) => {
                const active = chat.owner_id === activeOwnerId;
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => {
                      setActiveOwnerId(chat.owner_id);
                      setIsMobileListOpen(false);
                    }}
                    style={{ animationDelay: `${index * 30}ms` }}
                    className={`group relative flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all duration-200 animate-slideUp ${
                      active
                        ? "bg-gradient-to-r from-[#431620] to-[#2d1015] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "text-[#d4bfb9] hover:bg-white/[0.03]"
                    }`}
                  >
                    {/* Active indicator */}
                    {active && (
                      <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#e4455b] to-[#b84a5b]" />
                    )}

                    {/* Avatar */}
                    <span
                      className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white ${
                        chat.owner.avatar_url
                          ? ""
                          : `bg-gradient-to-br ${getAvatarColor(chat.owner.full_name)}`
                      }`}
                    >
                      {chat.owner.avatar_url ? (
                        <img loading="lazy" decoding="async"
                          src={chat.owner.avatar_url}
                          alt=""
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      ) : (
                        getInitials(chat.owner.full_name)
                      )}
                      {/* Online indicator */}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0d0406] bg-[#34d399]" />
                    </span>

                    {/* Content */}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-white">
                          {chat.owner.full_name}
                          <HiOutlineCheckBadge className="text-xs text-[#34d399]" />
                        </span>
                        {chat.last_message ? (
                          <span className="shrink-0 text-[10px] font-medium text-[#b99089]">
                            {formatTime(chat.last_message.created_at)}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span
                          className={`line-clamp-1 text-xs ${
                            chat.unread_count > 0 ? "font-medium text-white" : "text-[#b99089]"
                          }`}
                        >
                          {chat.unread_count > 0 && (
                            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#e4455b]" />
                          )}
                          {getMessagePreview(chat.last_message)}
                        </span>
                        {chat.unread_count > 0 ? (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e4455b] to-[#b84a5b] px-1.5 text-[10px] font-bold text-white shadow-[0_2px_8px_rgba(228,69,91,0.35)]">
                            {chat.unread_count > 99 ? "99+" : chat.unread_count}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#2a1015] to-[#1a090c] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <HiOutlineChatBubbleLeftRight className="text-3xl text-[#b99089]" />
              </div>
              <h3 className="font-cormorant text-2xl text-white">No conversations yet</h3>
              <p className="mt-2 max-w-xs text-xs leading-6 text-[#b99089]">
                When an owner sends their first message, it will appear here.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* ---- CHAT AREA ---- */}
      <section className={`min-w-0 flex-1 flex-col bg-[#090203] ${activeChat ? "flex" : "hidden md:flex"}`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <header className="relative flex min-h-[82px] items-center gap-4 border-b border-[#2a1015] bg-[#0d0406]/80 px-5 backdrop-blur-xl">
              {/* Back button mobile */}
              <button
                type="button"
                onClick={handleBackToList}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3d171c] bg-[#0d0406] text-[#b99089] transition-all duration-200 hover:border-[#b84a5b] hover:text-white md:hidden"
                aria-label="Back to chats"
              >
                <HiMiniArrowLeft className="text-lg" />
              </button>

              {/* Avatar */}
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#3d171c] bg-gradient-to-br from-[#230c10] to-[#1a090c]">
                {activeChat.owner.avatar_url ? (
                  <img loading="lazy" decoding="async"
                    src={activeChat.owner.avatar_url}
                    alt=""
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  <HiOutlineUserCircle className="text-2xl text-[#b99089]" />
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0d0406] bg-[#34d399]" />
              </span>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h2 className="flex items-center gap-2 truncate text-lg font-bold text-white">
                  {activeChat.owner.full_name}
                  <HiOutlineCheckBadge className="text-sm text-[#34d399]" />
                </h2>
                <div className="flex items-center gap-2 text-sm text-[#b99089]">
                  <span className="truncate">{activeChat.owner.email}</span>
                  <span className="h-1 w-1 rounded-full bg-[#3d171c]" />
                  <span className="flex items-center gap-1 text-xs">
                    <span className="h-2 w-2 rounded-full bg-[#34d399]" />
                    Online
                  </span>
                </div>
              </div>

              {/* Actions */}
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3d171c] bg-[#0d0406] text-[#b99089] transition-all duration-200 hover:border-[#b84a5b] hover:text-white"
              >
                <HiOutlineEllipsisHorizontal className="text-xl" />
              </button>
            </header>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 scrollbar-thin"
            >
              {messagesQuery.isLoading ? (
                <div className="space-y-4 px-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`space-y-2 ${
                          index % 2 === 0 ? "pr-16" : "pl-16"
                        }`}
                      >
                        <Skeleton
                          className={`h-12 rounded-2xl ${
                            index % 2 === 0
                              ? "rounded-bl-md"
                              : "rounded-br-md"
                          } ${index % 3 === 0 ? "w-64" : index % 3 === 1 ? "w-48" : "w-56"}`}
                        />
                        <Skeleton className="h-3 w-16 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length ? (
                <div className="space-y-4">
                  {/* Date separator for today */}
                  <div className="flex items-center gap-3 px-2 py-2">
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#3d171c]/50 to-transparent" />
                    <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#b99089]/60">
                      Today
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#3d171c]/50 to-transparent" />
                  </div>

                  {messages.map((item: SupportMessage, index: number) => {
                    const mine = item.sender_role === "admin";
                    const showTimestamp =
                      index === 0 ||
                      new Date(item.created_at).getTime() -
                        new Date(messages[index - 1].created_at).getTime() >
                        120000;
                    return (
                      <div key={item.id} className="space-y-1">
                        <ChatMessageBubble
                          message={item}
                          mine={mine}
                          showCheck={mine}
                        />
                        {showTimestamp && index < messages.length - 1 && (
                          <div
                            className={`flex px-1 ${
                              mine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="text-[10px] text-[#b99089]/40">
                              {formatTimeFull(item.created_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />

                  {/* Typing indicator placeholder */}
                  <div className="flex items-start gap-3 px-1">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#2a1015] to-[#1a090c] text-[10px] font-bold text-[#b99089]">
                      {activeChat ? getInitials(activeChat.owner.full_name) : "?"}
                    </span>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[#2a1015] bg-[#0d0406] px-4 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#b99089]/40" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#b99089]/40" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#b99089]/40" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-6 text-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#2a1015] to-[#1a090c] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <HiOutlineEnvelope className="text-4xl text-[#b99089]" />
                  </div>
                  <h2 className="font-cormorant text-3xl text-white">Start conversation</h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#b99089]">
                    Write a message to this owner and they will receive it in real-time.
                  </p>
                  <div className="mt-6 flex items-center gap-2 rounded-full border border-[#3d171c] bg-[#0d0406]/50 px-4 py-2 text-xs text-[#b99089]/70">
                    <HiOutlineInboxArrowDown className="text-sm" />
                    Messages are end-to-end encrypted
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <ChatComposer
              value={message}
              onChange={setMessage}
              onSend={() => void sendCurrentMessage()}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              uploadedAttachment={uploadedAttachment}
              onClearFile={() => {
                setSelectedFile(null);
                setUploadedAttachment(null);
              }}
              isSending={sendMessageMutation.isPending}
              isUploading={uploadAttachmentMutation.isPending}
              disabled={!activeOwnerId}
              placeholder="Write a message..."
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-[#090203]">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-[#2a1015] to-[#1a090c] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <HiOutlineChatBubbleLeftRight className="text-5xl text-[#b99089]" />
              </div>
              <h2 className="font-cormorant text-4xl text-white">Select a chat</h2>
              <p className="mt-2 text-sm text-[#b99089]">
                Choose a conversation from the sidebar
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminChats;