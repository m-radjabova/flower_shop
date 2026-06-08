import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  HiMiniPaperAirplane,
  HiMiniXMark,
  HiOutlineFaceSmile,
  HiOutlinePaperClip,
} from "react-icons/hi2";
import type { SupportAttachmentUpload } from "../../types/chat";

const emojis = [
  "😊", "😍", "🥰", "😇", "🙏", "🌸", "✨", "❤️", "🔥", "🎉",
  "👍", "💐", "🌷", "🌺", "🌹", "💖", "💕", "💗", "🫶", "😘",
  "💋", "😌", "🤗", "🥹", "😅", "😂", "🤣", "😭", "😤", "😎",
  "🤩", "😱", "🥺", "😴", "🤔", "🤫", "🫢", "😏", "🙄", "😒",
  "👀", "✨", "🌟", "⭐", "💫", "🌈", "☀️", "🌙", "🕊️", "🦋",
  "🌿", "🍃", "🌱", "🎀", "💝", "🩷", "💜", "💙", "💚", "💛",
  "🧡", "🤍", "🖤", "💌", "👑", "💎", "🌟", "🎯", "🎀", "🎈",
  "🎊", "🎄", "🌲", "🍀", "🌻", "🌼", "🌾", "🍂", "🍁", "☕",
  "🍰", "🥂", "🍷", "🎶", "🎵", "💃", "🕺", "🐱", "🐶", "🦋",
  "🐝", "🪷", "🌊", "⛰️", "🗻", "🏵️", "💮", "🪷", "💐", "💒",
];

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  uploadedAttachment: SupportAttachmentUpload | null;
  onClearFile: () => void;
  isSending?: boolean;
  isUploading?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChatComposer({
  value,
  onChange,
  onSend,
  onFileSelect,
  selectedFile,
  uploadedAttachment,
  onClearFile,
  isSending = false,
  isUploading = false,
  disabled = false,
  placeholder = "Напишите сообщение...",
}: ChatComposerProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const emojiPanelRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const canSend = Boolean(value.trim() || uploadedAttachment) && !isSending && !isUploading && !disabled;

  // Close emoji panel when clicking outside
  useEffect(() => {
    if (!emojiOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsidePanel = emojiPanelRef.current?.contains(target);
      const isInsideButton = emojiButtonRef.current?.contains(target);

      if (!isInsidePanel && !isInsideButton) {
        setEmojiOpen(false);
      }
    };

    // Delay adding listener to avoid the same click that opened it from closing it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (canSend) onSend();
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-[#361318] bg-[#130608] p-4 sm:p-5">
      {(selectedFile || uploadedAttachment) ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-[#4a1d22] bg-[#0d0305] px-4 py-3 text-sm text-[#f4d5ce]">
          <span className="min-w-0">
            <span className="block truncate font-semibold">
              {uploadedAttachment?.name ?? selectedFile?.name}
            </span>
            <span className="mt-0.5 block text-xs text-[#b9948d]">
              {isUploading ? "Yuklanmoqda..." : uploadedAttachment ? formatFileSize(uploadedAttachment.size) : selectedFile ? formatFileSize(selectedFile.size) : ""}
            </span>
          </span>
          <button
            type="button"
            onClick={onClearFile}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8 text-white hover:bg-white/12"
            aria-label="Faylni olib tashlash"
          >
            <HiMiniXMark className="text-xl" />
          </button>
        </div>
      ) : null}

      <div className="relative flex items-end gap-2 rounded-2xl border border-[#4a1d22] bg-[#0d0305] p-2 focus-within:border-[#b84a5b]">
        {emojiOpen ? (
          <div
            ref={emojiPanelRef}
            className="absolute bottom-[calc(100%+0.75rem)] left-2 z-20 grid max-h-64 w-72 grid-cols-5 gap-1 overflow-y-auto rounded-2xl border border-[#4a1d22] bg-[#160709] p-2.5 shadow-[0_18px_48px_rgba(0,0,0,0.36)] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#4a1d22]/50"
          >
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(`${value}${emoji}`);
                  setEmojiOpen(false);
                }}
                className="flex h-10 items-center justify-center rounded-xl text-xl transition hover:bg-white/8"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}

        <button
          ref={emojiButtonRef}
          type="button"
          onClick={() => setEmojiOpen((prev) => !prev)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#f3c4cb] transition hover:bg-white/8"
          aria-label="Emoji tanlash"
        >
          <HiOutlineFaceSmile className="text-xl" />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#f3c4cb] transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Fayl biriktirish"
        >
          <HiOutlinePaperClip className="text-xl" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,.doc,.docx,.xls,.xlsx"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onFileSelect(file);
          }}
        />

        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={1}
          className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-sm leading-5 text-white outline-none placeholder:text-[#8c6a65]"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (canSend) onSend();
            }
          }}
        />
        <button
          type="submit"
          disabled={!canSend}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d93d53] text-white transition hover:bg-[#ef5367] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Xabar yuborish"
        >
          {isSending || isUploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <HiMiniPaperAirplane className="text-xl" />
          )}
        </button>
      </div>
    </form>
  );
}