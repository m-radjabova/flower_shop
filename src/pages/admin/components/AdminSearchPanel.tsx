import { useState, type ReactNode } from "react";
import { HiMiniChevronDown, HiMiniChevronUp, HiOutlineMagnifyingGlass } from "react-icons/hi2";

type AdminSearchPanelProps = {
  title?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

function AdminSearchPanel({ title = "Search & Filters", defaultOpen = false, children }: AdminSearchPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-6 flex flex-col items-center">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-12 items-center gap-2 rounded-2xl border border-[#6b2a35] bg-[linear-gradient(180deg,#2a0d14,#220b11)] px-6 text-[1.95rem] font-cormorant font-semibold text-[#f7ddd7] shadow-[0_12px_28px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-[#c66377]"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#36121a] text-base">
          <HiOutlineMagnifyingGlass />
        </span>
        {title}
        {open ? <HiMiniChevronUp className="text-lg" /> : <HiMiniChevronDown className="text-lg" />}
      </button>

      {open ? (
        <div className="mt-4 w-full max-w-4xl rounded-[1.6rem] border border-[#4a1d22]/70 bg-[linear-gradient(180deg,rgba(30,10,14,0.96),rgba(18,6,9,0.94))] p-4 sm:p-5">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default AdminSearchPanel;
