import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import ChatComposer from "../../components/chat/ChatComposer";
import ChatMessageBubble from "../../components/chat/ChatMessageBubble";
import useContextPro from "../../hooks/useContextPro";
import { useChatRealtime } from "../../hooks/useChatRealtime";
import {
  useMarkMySupportChatRead,
  useMySupportChat,
  useMySupportMessages,
  useSendMySupportMessage,
  useUploadMySupportAttachment,
} from "../../hooks/useChat";
import { useMyLatestShopApplication } from "../../hooks/useCatalog";
import type { SupportAttachmentUpload, SupportMessage } from "../../types/chat";

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("ru", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

// ─── Typing dots component ────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#d93d53]"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#d93d53]"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#d93d53]"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

// ─── Empty state decorative icons (floating) ──────────────────────────────
const floatIcons = ["💬", "🌸", "✨", "❤️", "💐", "🌟", "🕊️", "🌷"];

function OwnerSupport() {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedAttachment, setUploadedAttachment] =
    useState<SupportAttachmentUpload | null>(null);
  const [adminTyping, setAdminTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const {
    state: { user },
  } = useContextPro();
  const chatQuery = useMySupportChat();
  const messagesQuery = useMySupportMessages();
  const latestApplicationQuery = useMyLatestShopApplication();
  const sendMessageMutation = useSendMySupportMessage();
  const uploadAttachmentMutation = useUploadMySupportAttachment();
  const markReadMutation = useMarkMySupportChatRead();
  const latestApplication = latestApplicationQuery.data;

  useChatRealtime({
    scope: "me",
    enabled: Boolean(user?.id),
    onEvent: (payload) => {
      if (
        payload.event === "support.message.created" &&
        payload.message?.sender_id !== user?.id
      ) {
        toast.info("Администратор ответил в чате", {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            background: "linear-gradient(135deg, #1a090c, #2d0e14)",
            color: "#f8e9e5",
            border: "1px solid #4a1d22",
            borderRadius: "16px",
          },
        });
      }
      if (
        payload.event === "support.message.created" &&
        payload.message?.sender_id === user?.id
      ) {
        setAdminTyping(false);
      }
    },
  });

  const messages = useMemo(
    () => messagesQuery.data?.items ?? [],
    [messagesQuery.data?.items],
  );

  // Simulated admin typing indicator (real implementation would use WebSocket event)
  useEffect(() => {
    if (!messages.length) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender_id === user?.id) {
      // If user sent last message, show typing after a short delay
      const timer = setTimeout(() => setAdminTyping(true), 5000);
      const hideTimer = setTimeout(() => setAdminTyping(false), 12000);
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
    setAdminTyping(false);
  }, [messages.length, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (!chatQuery.data?.unread_count || markReadMutation.isPending) return;
    markReadMutation.mutate();
  }, [chatQuery.data?.unread_count, markReadMutation]);

  const sendCurrentMessage = async () => {
    const trimmed = message.trim();
    if (
      (!trimmed && !uploadedAttachment) ||
      sendMessageMutation.isPending ||
      uploadAttachmentMutation.isPending
    )
      return;

    try {
      setMessage("");
      setSelectedFile(null);
      setUploadedAttachment(null);
      await sendMessageMutation.mutateAsync({
        body: trimmed,
        attachment_url: uploadedAttachment?.url ?? null,
        attachment_file_id: uploadedAttachment?.file_id ?? null,
        attachment_name: uploadedAttachment?.name ?? null,
        attachment_content_type: uploadedAttachment?.content_type ?? null,
        attachment_size: uploadedAttachment?.size ?? null,
      });
    } catch {
      setMessage(trimmed);
      setSelectedFile(uploadedAttachment ? selectedFile : null);
      toast.error("Сообщение не отправилось", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: "linear-gradient(135deg, #1a090c, #2d0e14)",
          color: "#f8e9e5",
          border: "1px solid #4a1d22",
          borderRadius: "16px",
        },
      });
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      setSelectedFile(file);
      setUploadedAttachment(null);
      const uploaded = await uploadAttachmentMutation.mutateAsync(file);
      setUploadedAttachment(uploaded);
    } catch {
      setSelectedFile(null);
      setUploadedAttachment(null);
      toast.error("Fayl yuklanmadi", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: "linear-gradient(135deg, #1a090c, #2d0e14)",
          color: "#f8e9e5",
          border: "1px solid #4a1d22",
          borderRadius: "16px",
        },
      });
    }
  };

  const isLoading = chatQuery.isLoading || messagesQuery.isLoading;
  const pinnedDecisionDate = latestApplication?.updated_at
    ? formatMessageTime(latestApplication.updated_at)
    : null;
  const shouldShowPinnedApplication =
    Boolean(latestApplication) &&
    (Boolean(latestApplication?.admin_comment) ||
      latestApplication?.status !== "pending");

  const pinnedTitle =
    latestApplication?.status === "approved"
      ? "✅ Запрос принят"
      : latestApplication?.status === "rejected"
        ? "❌ Запрос отклонен"
        : "🕐 Заявка на рассмотрении";

  const pinnedMessage =
    latestApplication?.admin_comment ||
    (latestApplication?.status === "approved"
      ? "Ваша заявка одобрена. Теперь вы можете управлять магазином в панели владельца."
      : latestApplication?.status === "rejected"
        ? "Администратор отклонил заявку. Напишите в чат, если хотите уточнить детали."
        : "Администратор рассматривает вашу заявку.");

  // Date separator logic: group messages by date
  const messagesWithSeparators = useMemo(() => {
    const result: Array<{ type: "separator"; date: string } | { type: "message"; msg: SupportMessage }> = [];
    let lastDate: string | null = null;

    for (const msg of messages) {
      const msgDate = new Date(msg.created_at).toLocaleDateString("ru", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        result.push({ type: "separator", date: msgDate });
      }
      result.push({ type: "message", msg });
    }
    return result;
  }, [messages]);

  // ──────────────────── Pinned status badge color ──────────────────────
  const pinnedBadgeColor =
    latestApplication?.status === "approved"
      ? "border-emerald-700/50 bg-emerald-950/40 text-emerald-300"
      : latestApplication?.status === "rejected"
        ? "border-red-700/50 bg-red-950/40 text-red-300"
        : "border-amber-700/50 bg-amber-950/40 text-amber-300";

  return (
    <div className="group/container relative mx-auto flex h-[calc(100vh-6rem)] max-w-5xl flex-col overflow-hidden rounded-[1.8rem] border border-[#4a1d22]/80 bg-[#0c0406] shadow-[0_32px_90px_rgba(0,0,0,0.4)]">
      {/* Subtle ambient gradient glow at top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#b11f32]/6 to-transparent" />

      {/* ───── HEADER ───── */}
      <header className="relative z-10 flex min-h-[88px] items-center justify-between gap-4 border-b border-[#4a1d22]/60 bg-[#0f0507]/95 px-5 py-4 backdrop-blur-lg sm:px-7">
        {/* Left: avatar + title */}
        <div className="flex min-w-0 items-center gap-4">
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#7a3944]/60 bg-gradient-to-br from-[#4d121f] to-[#1a080b] shadow-[0_4px_20px_rgba(177,31,50,0.15)]">
            <HiOutlineShieldCheck className="text-2xl text-[#ffb8c5]" />
            {/* Online dot */}
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0c0406] bg-[#77e6a3] shadow-[0_0_10px_rgba(119,230,163,0.5)]" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.28em] text-[#b99089]">
              Muslima Boutique
            </p>
            <h1 className="truncate font-cormorant text-[2rem] leading-tight text-white sm:text-[2.4rem]">
              Чат с админом
            </h1>
          </div>
        </div>

        {/* Right: status */}
        <div className="flex shrink-0 items-center gap-2.5 rounded-full border border-[#4a1d22]/60 bg-gradient-to-r from-[#14080a] to-[#1b0a0d] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#77e6a3] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#77e6a3]" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#b2cdb0]">
            Online
          </span>
        </div>
      </header>

      {/* ───── PINNED APPLICATION ───── */}
      {shouldShowPinnedApplication ? (
        <div className="relative border-b border-[#4a1d22]/50 bg-gradient-to-r from-[#1a080b]/95 to-[#120508]/95 px-5 py-3.5 sm:px-7">
          <div
            className={`relative flex items-start gap-3.5 overflow-hidden rounded-2xl border px-4 py-3.5 shadow-[0_8px_28px_rgba(0,0,0,0.2)] ${
              latestApplication?.status === "approved"
                ? "border-emerald-800/40 bg-gradient-to-br from-emerald-950/40 to-[#0c0406]/80"
                : latestApplication?.status === "rejected"
                  ? "border-red-800/40 bg-gradient-to-br from-red-950/40 to-[#0c0406]/80"
                  : "border-amber-800/40 bg-gradient-to-br from-amber-950/40 to-[#0c0406]/80"
            }`}
          >
            {/* Subtle corner glow */}
            <div
              className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-3xl ${
                latestApplication?.status === "approved"
                  ? "bg-emerald-600/10"
                  : latestApplication?.status === "rejected"
                    ? "bg-red-600/10"
                    : "bg-amber-600/10"
              }`}
            />

            <span
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                latestApplication?.status === "approved"
                  ? "bg-emerald-500/12 text-emerald-300"
                  : latestApplication?.status === "rejected"
                    ? "bg-red-500/12 text-red-300"
                    : "bg-amber-500/12 text-amber-300"
              }`}
            >
              <HiOutlineCheckCircle className="text-xl" />
            </span>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${pinnedBadgeColor}`}
                >
                  📌 Закреплено
                </span>
                {pinnedDecisionDate ? (
                  <span className="text-[11px] text-[#b9948d]">
                    {pinnedDecisionDate}
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-bold text-white">{pinnedTitle}</p>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#e2c3bc]/90">
                {pinnedMessage}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* ───── MESSAGES AREA ───── */}
      <section
        ref={messagesContainerRef}
        className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 sm:px-7 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#4a1d22]/40 [&::-webkit-scrollbar-thumb]:hover:bg-[#7a3944]/60 [&::-webkit-scrollbar-track]:bg-transparent"
      >
        {/* Loading skeleton */}
        {isLoading ? (
          <div className="flex flex-col gap-4 pt-4">
            {Array.from({ length: 5 }).map((_, index) => {
              const isMine = index % 2 === 0;
              return (
                <div
                  key={index}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`w-[72%] animate-pulse space-y-2.5 rounded-2xl p-4 sm:w-[60%] ${
                      isMine
                        ? "rounded-br-md bg-gradient-to-br from-[#b11f32]/30 to-[#dc4358]/20"
                        : "rounded-bl-md border border-[#3d171c]/60 bg-[#1a090c]/60"
                    }`}
                  >
                    <div
                      className={`h-3 w-full rounded-full ${
                        isMine ? "bg-white/15" : "bg-white/8"
                      }`}
                    />
                    <div
                      className={`h-3 w-3/4 rounded-full ${
                        isMine ? "bg-white/10" : "bg-white/6"
                      }`}
                    />
                    <div
                      className={`h-2 w-1/4 rounded-full pt-1 ${
                        isMine ? "bg-white/8" : "bg-white/5"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : messagesWithSeparators.length ? (
          <div className="flex flex-col gap-3">
            {messagesWithSeparators.map((item, idx) => {
              if (item.type === "separator") {
                return (
                  <div key={`sep-${item.date}`} className="flex items-center gap-3 py-1.5">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#4a1d22]/40 to-transparent" />
                    <span className="shrink-0 rounded-full border border-[#3d171c]/50 bg-[#14080a] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#b99089]">
                      {item.date}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#4a1d22]/40 to-transparent" />
                  </div>
                );
              }
              const mine = item.msg.sender_id === user?.id;
              return (
                <div
                  key={item.msg.id}
                  className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    mine ? "origin-bottom-right" : "origin-bottom-left"
                  }`}
                  style={{
                    animation: "fadeSlideIn 0.3s ease-out",
                    animationFillMode: "both",
                    animationDelay: `${Math.min(idx * 15, 200)}ms`,
                  }}
                >
                  <ChatMessageBubble
                    message={item.msg}
                    mine={mine}
                    showCheck
                  />
                </div>
              );
            })}

            {/* Admin typing indicator */}
            {adminTyping && (
              <div className="flex animate-fadeIn items-center gap-2.5 pl-1 pt-1">
                <div className="rounded-2xl rounded-bl-md border border-[#3d171c] bg-[#1a090c] px-4 py-3">
                  <TypingDots />
                </div>
                <span className="text-[10px] text-[#b9948d]">
                  Админ печатает...
                </span>
              </div>
            )}

            <div ref={bottomRef} className="h-1" />
          </div>
        ) : (
          /* ─── Empty State ─── */
          <div className="relative flex h-full min-h-[460px] flex-col items-center justify-center overflow-hidden text-center">
            {/* Floating decorative icons */}
            {floatIcons.map((icon, i) => (
              <span
                key={icon}
                className="pointer-events-none absolute select-none opacity-[0.04]"
                style={{
                  top: `${15 + (i * 17) % 70}%`,
                  left: `${5 + (i * 23) % 90}%`,
                  fontSize: `${1.8 + (i % 4) * 0.6}rem`,
                  transform: `rotate(${(i * 37) % 360}deg)`,
                }}
              >
                {icon}
              </span>
            ))}

            {/* Central icon with glow */}
            <span className="relative flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 rounded-2xl bg-[#b11f32]/10 blur-xl" />
              <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#4a1d22]/50 bg-gradient-to-br from-[#2d0e14] to-[#0f0507] shadow-[0_8px_32px_rgba(177,31,50,0.12)]">
                <HiOutlineChatBubbleLeftRight className="text-3xl text-[#ffb8c5]" />
              </span>
            </span>

            <h2 className="mt-6 font-cormorant text-[2.2rem] leading-tight text-white sm:text-[2.6rem]">
              Напишите первый вопрос
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#caa39b]/80">
              Администратор увидит ваше сообщение в разделе Chats и ответит
              здесь в реальном времени.
            </p>

            {/* Suggestive prompt */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {["Здравствуйте! 👋", "Есть вопрос ❓", "Помогите 🙏"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setMessage(suggestion)}
                    className="rounded-full border border-[#4a1d22]/50 bg-[#14080a] px-3.5 py-1.5 text-xs text-[#d8b7b0] transition hover:border-[#7a3944] hover:bg-[#1a080b] hover:text-white"
                  >
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </section>

      {/* ───── COMPOSER ───── */}
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
      />

      {/* Keyframes for animations (injected via style tag) */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}

export default OwnerSupport;