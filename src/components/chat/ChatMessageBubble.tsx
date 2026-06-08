import {
  HiOutlineArrowDownTray,
  HiOutlineCheckCircle,
  HiOutlineDocument,
  HiOutlinePhoto,
} from "react-icons/hi2";
import type { SupportMessage } from "../../types/chat";

function formatFileSize(size: number | null) {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(contentType: string | null) {
  return Boolean(contentType?.startsWith("image/"));
}

function formatTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  // If less than 1 minute ago
  if (diffMins < 1) return "только что";
  // If less than 1 hour ago
  if (diffMins < 60) return `${diffMins} мин. назад`;
  // If today
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return new Intl.DateTimeFormat("ru", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }
  // Otherwise show date and time
  return new Intl.DateTimeFormat("ru", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(date);
}

type ChatMessageBubbleProps = {
  message: SupportMessage;
  mine: boolean;
  showCheck?: boolean;
  showSender?: boolean;
};

export default function ChatMessageBubble({
  message,
  mine,
  showCheck = false,
  showSender = false,
}: ChatMessageBubbleProps) {
  const hasAttachment = Boolean(message.attachment_url);
  const attachmentIsImage = isImage(message.attachment_content_type);
  const attachmentName = message.attachment_name || "Attachment";
  const senderName =
    message.sender?.full_name || (mine ? "Вы" : "Пользователь");
  const senderInitials = senderName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[82%] flex-col sm:max-w-[70%] ${mine ? "items-end" : "items-start"}`}>
        {/* Sender name shown above message for non-mine messages */}
        {!mine && showSender && (
          <div className="mb-1.5 flex items-center gap-2 px-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#b11f32] to-[#dc4358] text-[9px] font-bold text-white shadow-[0_2px_8px_rgba(177,31,50,0.25)]">
              {senderInitials}
            </div>
            <span className="text-[11px] font-semibold tracking-wide text-[#b99089]">
              {senderName}
            </span>
          </div>
        )}

        <div
          className={`relative w-full ${
            mine
              ? "rounded-2xl rounded-br-md bg-gradient-to-br from-[#b81f34] via-[#c9253c] to-[#dc4358] text-white shadow-[0_4px_20px_rgba(177,31,50,0.25)]"
              : "rounded-2xl rounded-bl-md border border-[#3d171c]/80 bg-gradient-to-br from-[#1f0b0e] via-[#1a090c] to-[#14070a] text-[#f8e9e5] shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          }`}
        >
          {/* My-message tail (right-pointing) */}
          {mine && (
            <div className="absolute -bottom-px right-[-7px] z-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M14 0C13 4 10 7 5 9.5C2.5 10.8 0.5 12 0 14C-0.2 10.5 1 6 4 3C6.5 0.5 10 0 14 0Z"
                  fill="#dc4358"
                />
              </svg>
            </div>
          )}

          {/* Their-message tail (left-pointing) */}
          {!mine && (
            <div className="absolute -bottom-px left-[-7px] z-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0 0C1 4 4 7 9 9.5C11.5 10.8 13.5 12 14 14C14.2 10.5 13 6 10 3C7.5 0.5 4 0 0 0Z"
                  fill="#1f0b0e"
                />
              </svg>
            </div>
          )}

          {/* Attachment: Image */}
          {hasAttachment && message.attachment_url ? (
            attachmentIsImage ? (
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noreferrer"
                className={`group/img relative mb-2 block overflow-hidden ${
                  mine ? "rounded-xl" : "rounded-xl"
                } ${message.body ? "border-b border-white/8" : ""}`}
              >
                <img
                  src={message.attachment_url}
                  alt={attachmentName}
                  className="max-h-72 w-full min-w-48 object-cover transition duration-500 group-hover/img:scale-[1.04]"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover/img:bg-black/30 group-hover/img:opacity-100">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <HiOutlineArrowDownTray className="text-xl text-white" />
                  </span>
                </div>
              </a>
            ) : (
              /* Attachment: File */
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noreferrer"
                className={`flex min-w-56 items-center gap-3 rounded-xl border px-3 py-3.5 transition-all duration-300 ${
                  mine
                    ? "mx-2 mt-2 border-white/12 bg-white/8 hover:border-white/25 hover:bg-white/12"
                    : "mx-2 mt-2 border-[#4a1d22]/70 bg-black/20 hover:border-[#7a3944] hover:bg-black/30"
                } ${message.body ? "mb-2" : "mb-2"}`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    mine ? "bg-white/10" : "bg-[#4a1d22]/30"
                  }`}
                >
                  {message.attachment_content_type === "application/pdf" ? (
                    <HiOutlineDocument
                      className={`text-xl ${mine ? "text-white" : "text-[#f3c4cb]"}`}
                    />
                  ) : (
                    <HiOutlinePhoto
                      className={`text-xl ${mine ? "text-white" : "text-[#f3c4cb]"}`}
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {attachmentName}
                  </span>
                  <span
                    className={`mt-0.5 block text-xs ${
                      mine ? "text-white/65" : "text-[#b9948d]"
                    }`}
                  >
                    {message.attachment_content_type || "file"}{" "}
                    {formatFileSize(message.attachment_size)}
                  </span>
                </span>
                <HiOutlineArrowDownTray
                  className={`shrink-0 text-xl opacity-60 transition-opacity group-hover:opacity-100 ${
                    mine ? "text-white" : "text-[#f3c4cb]"
                  }`}
                />
              </a>
            )
          ) : null}

          {/* Message body */}
          {message.body ? (
            <div className={`px-4 pt-1 ${hasAttachment ? "pb-1" : "py-2.5"}`}>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 tracking-wide">
                {message.body}
              </p>
            </div>
          ) : null}

          {/* Footer: time + status */}
          <div
            className={`flex items-center justify-end gap-1.5 px-4 pb-2 pt-1 ${
              message.body || hasAttachment ? "" : ""
            } ${mine ? "text-white/65" : "text-[#b9948d]"}`}
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.04em]">
              {formatTime(message.created_at)}
            </span>
            {mine && showCheck ? (
              <span className="relative flex items-center">
                <HiOutlineCheckCircle className="text-[13px] transition-colors duration-300" />
              </span>
            ) : null}
          </div>

          {/* Hover glass shine effect */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -inset-full top-0 h-full w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/4 to-transparent opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:animate-[shimmer_1.5s_ease-in-out]" />
          </div>
        </div>
      </div>
    </div>
  );
}