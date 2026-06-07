import {
  HiCheck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiTruck,
} from "react-icons/hi2";
import type { OrderOut } from "../../types/catalog";

export type OrderJourneyStep = {
  key: Exclude<OrderOut["status"], "cancelled">;
  label: string;
  icon?: React.ReactNode;
};

interface OrderProgressProps {
  status: OrderOut["status"];
  steps: ReadonlyArray<OrderJourneyStep>;
  compact?: boolean;
  className?: string;
}

const stepIcons: Record<string, React.ReactNode> = {
  new: <HiOutlineClock className="h-4 w-4" />,
  accepted: <HiCheck className="h-4 w-4" />,
  preparing: <HiOutlineCheckCircle className="h-4 w-4" />,
  delivering: <HiTruck className="h-4 w-4" />,
  delivered: <HiCheck className="h-4 w-4" />,
};

function OrderProgress({ status, steps, compact = false, className }: OrderProgressProps) {
  if (status === "cancelled") {
    return (
      <div className={className}>
        <div className="flex items-center gap-3 rounded-2xl border border-[#7a3542] bg-gradient-to-r from-[#2a0f14] to-[#1f0a0e] px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3d1520]">
            <HiOutlineXCircle className="text-xl text-[#ff7a8a]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#ff9eae]">Buyurtma bekor qilingan</p>
            <p className="text-xs text-[#b0666f]">Bu buyurtma bekor qilingan yoki rad etilgan</p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = Math.max(
    steps.findIndex((step) => step.key === status),
    0,
  );
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 1 ? (currentIndex / (totalSteps - 1)) * 100 : 0;

  if (compact) {
    return (
      <div className={className}>
        <div className="flex items-center gap-1.5">
          {steps.map((step, index) => {
            const isDone = index <= currentIndex;
            const isCurrent = index === currentIndex;
            return (
              <div key={step.key} className="flex items-center gap-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
                    isCurrent
                      ? "bg-gradient-to-br from-[#ff8ea3] to-[#d94b63] text-white shadow-[0_0_12px_rgba(255,142,163,0.4)]"
                      : isDone
                        ? "bg-[#ff8ea3]/20 text-[#ff8ea3]"
                        : "bg-white/5 text-[#5a3840]"
                  }`}
                >
                  {isDone && !isCurrent ? (
                    <HiCheck className="h-3.5 w-3.5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className="h-0.5 w-4 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-[#ff8ea3] transition-all duration-700"
                      style={{ width: index < currentIndex ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop: full stepper */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Background line */}
          <div className="absolute top-[18px] left-0 right-0 h-0.5 bg-white/[0.06]" />
          {/* Active line */}
          <div
            className="absolute top-[18px] left-0 h-0.5 rounded-full bg-gradient-to-r from-[#ff8ea3] via-[#ff8ea3] to-[#f7cf9d] transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isDone = index < currentIndex;
              const isCurrent = index === currentIndex;
              const icon = stepIcons[step.key] ?? <span className="text-xs font-bold">{index + 1}</span>;

              return (
                <div key={step.key} className="flex flex-1 flex-col items-center">
                  {/* Circle */}
                  <div
                    className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                      isCurrent
                        ? "border-[#ff8ea3] bg-gradient-to-br from-[#ff8ea3] to-[#d94b63] text-white shadow-[0_0_20px_rgba(255,142,163,0.35)]"
                        : isDone
                          ? "border-[#ff8ea3]/40 bg-[#ff8ea3]/15 text-[#ff8ea3]"
                          : "border-white/10 bg-[#140809] text-[#5a3840]"
                    }`}
                  >
                    {isDone && !isCurrent ? <HiCheck className="h-4 w-4" /> : icon}
                    {isCurrent && (
                      <span className="absolute -inset-1 animate-ping rounded-full bg-[#ff8ea3]/20" />
                    )}
                  </div>

                  {/* Label */}
                  <p
                    className={`mt-3 text-center text-xs font-medium transition-colors duration-300 ${
                      isCurrent
                        ? "text-white"
                        : isDone
                          ? "text-[#d4a39c]"
                          : "text-[#6a4a46]"
                    }`}
                  >
                    {step.label}
                  </p>

                  {/* Active indicator dot */}
                  {isCurrent && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-[#ff8ea3]" />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-[#ff8ea3]/80">
                        Joriy
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: vertical stepper */}
      <div className="md:hidden">
        <div className="space-y-0">
          {steps.map((step, index) => {
            const isDone = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.key} className="flex gap-3">
                {/* Timeline column */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                      isCurrent
                        ? "border-[#ff8ea3] bg-gradient-to-br from-[#ff8ea3] to-[#d94b63] text-white shadow-[0_0_12px_rgba(255,142,163,0.3)]"
                        : isDone
                          ? "border-[#ff8ea3]/30 bg-[#ff8ea3]/10 text-[#ff8ea3]"
                          : "border-white/10 bg-[#140809] text-[#5a3840]"
                    }`}
                  >
                    {isDone && !isCurrent ? (
                      <HiCheck className="h-3.5 w-3.5" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 transition-colors duration-500 ${
                        isDone || isCurrent ? "bg-[#ff8ea3]/30" : "bg-white/5"
                      }`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
                  <p
                    className={`text-sm font-medium transition-colors ${
                      isCurrent ? "text-white" : isDone ? "text-[#c49590]" : "text-[#5a3840]"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="mt-0.5 text-xs text-[#ff8ea3]/80">Joriy bosqich</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current stage label */}
      {!compact && (
        <div className="mt-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff8ea3]" />
          <p className="text-xs uppercase tracking-[0.18em] text-[#b0807a]">
            Joriy bosqich:{" "}
            <span className="font-semibold text-[#e8b5ad]">
              {steps[currentIndex]?.label ?? steps[0]?.label}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export default OrderProgress;
