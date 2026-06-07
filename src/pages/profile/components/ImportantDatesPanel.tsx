import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  HiCalendarDays,
  HiOutlineBellAlert,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { getErrorMessage } from "../../../api/auth";
import {
  useCreateImportantDate,
  useDeleteImportantDate,
  useUpdateImportantDate,
} from "../../../hooks/useImportantDates";
import type {
  ImportantDate,
  ImportantDateCreatePayload,
} from "../../../types/types";
import {
  formatImportantDate,
  getDaysUntilImportantDate,
  getImportantDateMeta,
  sortImportantDatesByUpcoming,
} from "../../../utils/importantDates";

type ImportantDateFormValues = ImportantDateCreatePayload;

interface ImportantDatesPanelProps {
  dates: ImportantDate[];
  isLoading?: boolean;
}

function ImportantDatesPanel({ dates, isLoading = false }: ImportantDatesPanelProps) {
  const { t, i18n } = useTranslation(undefined, { keyPrefix: "profile" });
  const createMutation = useCreateImportantDate();
  const updateMutation = useUpdateImportantDate();
  const deleteMutation = useDeleteImportantDate();
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<ImportantDateFormValues>({
    defaultValues: {
      title: "",
      event_type: "birthday",
      event_date: "",
      note: "",
    },
  });

  const orderedDates = useMemo(() => sortImportantDatesByUpcoming(dates), [dates]);
  const upcomingDates = useMemo(
    () => orderedDates.filter((item) => {
      const daysUntil = getDaysUntilImportantDate(item.event_date);
      return daysUntil !== null && daysUntil <= 30;
    }).slice(0, 3),
    [orderedDates],
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setEditingId(null);
    form.reset({
      title: "",
      event_type: "birthday",
      event_date: "",
      note: "",
    });
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: ImportantDateCreatePayload = {
      title: values.title.trim(),
      event_type: values.event_type,
      event_date: values.event_date,
      note: values.note?.trim() ? values.note.trim() : null,
    };

    if (!payload.title || !payload.event_date) {
      toast.error(t("importantDatesRequired"));
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ importantDateId: editingId, payload });
        toast.success(t("importantDateUpdated"));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t("importantDateSaved"));
      }
      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error, t("importantDateSaveError")));
    }
  });

  const handleEdit = (item: ImportantDate) => {
    setEditingId(item.id);
    form.reset({
      title: item.title,
      event_type: item.event_type,
      event_date: item.event_date,
      note: item.note ?? "",
    });
  };

  const handleDelete = async (importantDateId: string) => {
    try {
      await deleteMutation.mutateAsync(importantDateId);
      if (editingId === importantDateId) {
        resetForm();
      }
      toast.success(t("importantDateDeleted"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("importantDateDeleteError")));
    }
  };

  return (
    <section className="rounded-[1.4rem] border border-white/8 bg-[#120607] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2a1014] text-[#ffb1bd]">
            <HiOutlineBellAlert className="text-xl" />
          </span>
          <div>
            <p className="text-2xl font-semibold text-white">{t("saveImportantDates")}</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#c9aba4]">{t("importantDatesDesc")}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-[#3e1c22] bg-[#1a090c] px-4 py-3 text-right">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#b7918a]">{t("upcomingReminders")}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{upcomingDates.length}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="rounded-[1.3rem] border border-white/8 bg-[#17080b] p-4">
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">{t("eventLabel")}</span>
              <input
                {...form.register("title")}
                placeholder={t("eventTitlePlaceholder")}
                className="h-12 w-full rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 text-white outline-none transition placeholder:text-[#8f6d68] focus:border-[#b54b58] focus:bg-[#210c10]"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">{t("eventType")}</span>
                <select
                  {...form.register("event_type")}
                  className="h-12 w-full rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 text-white outline-none transition focus:border-[#b54b58] focus:bg-[#210c10]"
                >
                  <option value="birthday">{t("eventTypeBirthday")}</option>
                  <option value="anniversary">{t("eventTypeAnniversary")}</option>
                  <option value="custom">{t("eventTypeCustom")}</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">{t("eventDate")}</span>
                <input
                  type="date"
                  {...form.register("event_date")}
                  className="h-12 w-full rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 text-white outline-none transition focus:border-[#b54b58] focus:bg-[#210c10]"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">{t("notesOptional")}</span>
              <textarea
                {...form.register("note")}
                rows={4}
                placeholder={t("importantDateNotePlaceholder")}
                className="w-full rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 py-3 text-white outline-none transition placeholder:text-[#8f6d68] focus:border-[#b54b58] focus:bg-[#210c10]"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 min-w-[170px] items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-5 font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {editingId ? t("updateImportantDate") : t("saveImportantDate")}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl border border-white/8 bg-[#2a0f12] px-5 font-semibold text-[#f3d6d0] transition hover:bg-[#381419]"
              >
                {t("cancel")}
              </button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3">
          {isLoading ? (
            <div className="rounded-[1.3rem] border border-white/8 bg-[#17080b] p-5 text-sm text-[#c9aba4]">
              {t("loadingImportantDates")}
            </div>
          ) : null}

          {!isLoading && !orderedDates.length ? (
            <div className="rounded-[1.3rem] border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
              <p className="text-lg font-semibold text-white">{t("noImportantDates")}</p>
              <p className="mt-2 text-sm text-[#b7938b]">{t("importantDatesEmptyDesc")}</p>
            </div>
          ) : null}

          {!isLoading && orderedDates.map((item) => {
            const daysUntil = getDaysUntilImportantDate(item.event_date);
            const meta = getImportantDateMeta(item.event_type);

            return (
              <article
                key={item.id}
                className={`overflow-hidden rounded-[1.3rem] border border-white/8 bg-gradient-to-br ${meta.gradientClassName} p-4`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffd8d0]">
                        {meta.emoji} {t(`eventTypeBadge.${item.event_type}`)}
                      </span>
                      <span className="rounded-full bg-[#0f1114]/25 px-3 py-1 text-xs font-semibold text-[#ffe9e4]">
                        {getReminderLabel(daysUntil, t)}
                      </span>
                    </div>
                    <p className="mt-3 text-xl font-semibold text-white">{item.title}</p>
                    <p className="mt-1 inline-flex items-center gap-2 text-sm text-[#e6c3bb]">
                      <HiCalendarDays className="text-base" />
                      {formatImportantDate(item.event_date, i18n.language)}
                    </p>
                    {item.note ? (
                      <p className="mt-3 rounded-2xl bg-black/15 px-4 py-3 text-sm leading-6 text-[#ffe5df]">{item.note}</p>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
                      aria-label={t("editImportantDate")}
                    >
                      <HiOutlinePencilSquare />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-[#7d1f2c]"
                      aria-label={t("deleteImportantDate")}
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface UpcomingImportantDatesCardProps {
  dates: ImportantDate[];
  onManageClick: () => void;
}

export function UpcomingImportantDatesCard({ dates, onManageClick }: UpcomingImportantDatesCardProps) {
  const { t, i18n } = useTranslation(undefined, { keyPrefix: "profile" });
  const orderedDates = useMemo(() => sortImportantDatesByUpcoming(dates), [dates]);
  const items = orderedDates.slice(0, 3);

  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#18090d] via-[#1f0b11] to-[#110608] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎂</span>
            <div>
              <h2 className="font-cormorant text-3xl text-white">{t("upcomingReminders")}</h2>
              <p className="mt-1 text-sm text-[#b7928a]">{t("upcomingRemindersDesc")}</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onManageClick}
          className="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-[#ffb1bd] transition hover:bg-white/10"
        >
          {t("manageImportantDates")}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {!items.length ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-[#c7a39a]">
            {t("noUpcomingReminders")}
          </div>
        ) : null}

        {items.map((item) => {
          const daysUntil = getDaysUntilImportantDate(item.event_date);
          const meta = getImportantDateMeta(item.event_type);

          return (
            <article key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm text-[#ffd7ce]">
                  <span>{meta.emoji}</span>
                  <span>{t(`eventTypeBadge.${item.event_type}`)}</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-[#b7928a]">{formatImportantDate(item.event_date, i18n.language)}</p>
              </div>
              <div className="shrink-0 rounded-2xl bg-[#2a1014] px-4 py-3 text-right">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#b7928a]">{t("reminder")}</p>
                <p className="mt-1 text-sm font-semibold text-white">{getReminderLabel(daysUntil, t)}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function getReminderLabel(daysUntil: number | null, t: (key: string, options?: Record<string, unknown>) => string) {
  if (daysUntil === null) return t("dateUnknown");
  if (daysUntil === 0) return t("today");
  if (daysUntil === 1) return t("tomorrow");
  return t("inDays", { count: daysUntil });
}

export default ImportantDatesPanel;
