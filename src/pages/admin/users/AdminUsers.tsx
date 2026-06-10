import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineUser,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import type { UserRole } from "../../../types/types";
import { useAdminUsers, useUpdateAdminUser } from "../../../hooks/useAdmin";
import AdminSearchPanel from "../components/AdminSearchPanel";
import { useDebounce } from "../../../hooks/useDebounce";
import bow from "../../../assets/bow.png";

const roleOptions: Array<{ role: UserRole; label: string; icon: React.ReactNode }> = [
  { role: "admin", label: "Admin", icon: <HiOutlineShieldCheck /> },
  { role: "owner", label: "Owner", icon: <HiOutlineUserGroup /> },
  { role: "courier", label: "Courier", icon: <HiOutlineTruck /> },
  { role: "customer", label: "Customer", icon: <HiOutlineUser /> },
];

function AdminUsers() {
  const pageSize = 15;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 450);
  const [submittingActions, setSubmittingActions] = useState<Record<string, boolean>>({});
  const { data: usersPage, isLoading } = useAdminUsers({
    limit: pageSize,
    offset: (page - 1) * pageSize,
    search: debouncedSearch || undefined,
  });
  const updateUserMutation = useUpdateAdminUser();
  const users = usersPage?.items ?? [];
  const totalUsers = usersPage?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const pageNumbers = useMemo(() => {
    const spread = 2;
    const from = Math.max(1, page - spread);
    const to = Math.min(totalPages, page + spread);
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  }, [page, totalPages]);

  const changeRole = async (userId: string, currentRole: UserRole, role: UserRole) => {
    const actionKey = `role:${userId}:${role}`;
    if (submittingActions[actionKey]) return;
    if (currentRole === role) return;

    try {
      setSubmittingActions((prev) => ({ ...prev, [actionKey]: true }));
      await updateUserMutation.mutateAsync({ userId, payload: { role } });
      toast.success("User role yangilandi");
    } catch {
      toast.error("User rolini yangilab bo'lmadi");
    } finally {
      setSubmittingActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    const actionKey = `active:${userId}`;
    if (submittingActions[actionKey]) return;
    try {
      setSubmittingActions((prev) => ({ ...prev, [actionKey]: true }));
      await updateUserMutation.mutateAsync({ userId, payload: { is_active: !isActive } });
      toast.success(isActive ? "User bloklandi" : "User aktiv qilindi");
    } catch {
      toast.error("User statusini yangilab bo'lmadi");
    } finally {
      setSubmittingActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(31,8,11,0.9),rgba(17,4,6,0.94))] p-6 sm:p-8">
        <img loading="lazy" decoding="async"
          src={bow}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1 hidden w-45 rotate-35 opacity-35 lg:block"
           />
        <div className="mt-3 flex justify-center">
          <h1 className="font-great-vibes text-[4rem] leading-[0.9] text-[#ff8ea3] sm:text-[5rem]">Users Control</h1>
        </div>
        <AdminSearchPanel defaultOpen={Boolean(search)}>
          <label className="flex h-12 w-full items-center gap-3 rounded-2xl border border-[#4a1d22] bg-[#180709] px-4">
            <HiOutlineMagnifyingGlass className="text-xl text-[#d3a49d]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, role..."
              className="w-full bg-transparent text-white outline-none placeholder:text-[#8e6d68]"
            />
          </label>
        </AdminSearchPanel>
      </section>

      <section className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-[1.6rem] border border-[#3d171c] bg-[#160709]" />
          ))
        ) : users.map((user) => (
          <article key={user.id} className="rounded-[1.7rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-cormorant text-4xl text-white">{user.full_name}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${user.is_active ? "bg-[#10241a] text-[#9ef0c2]" : "bg-[#321116] text-[#ffb1bd]"}`}>
                    {user.is_active ? "Active" : "Blocked"}
                  </span>
                </div>
                <p className="mt-2 text-[#e7d2cc]">{user.email}</p>
                <p className="mt-1 text-sm text-[#caa59f]">{user.phone ?? "No phone number"}</p>
              </div>

              <button
                type="button"
                onClick={() => toggleActive(user.id, user.is_active)}
                disabled={Boolean(submittingActions[`active:${user.id}`])}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#6d3740] bg-[#220c10] px-5 text-sm font-semibold text-[#f6d7d1] transition hover:border-[#b45c69] disabled:opacity-60"
              >
                {submittingActions[`active:${user.id}`]
                  ? "Saving..."
                  : user.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {roleOptions.map((option) => {
                const active = user.role === option.role;
                return (
                  <button
                    key={option.role}
                    type="button"
                    onClick={() => changeRole(user.id, user.role, option.role)}
                    disabled={Boolean(submittingActions[`role:${user.id}:${option.role}`])}
                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition disabled:opacity-60 ${
                      active
                        ? "border border-[#b45c69] bg-[#4a151d] text-white"
                        : "border border-[#4a1d22] bg-[#180709] text-[#d8b1aa] hover:border-[#84515a]"
                    }`}
                  >
                    {option.icon}
                    {submittingActions[`role:${user.id}:${option.role}`] ? "Saving..." : option.label}
                  </button>
                );
              })}
            </div>
          </article>
        ))}

        {!isLoading ? (
          <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-[#3d171c] bg-[#160709] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#d5b1aa]">
              {totalUsers} users, page {page}/{totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#4a1d22] bg-[#180709] px-3 text-sm text-[#f6d7d1] disabled:opacity-50"
              >
                <HiOutlineArrowLeft />
                Prev
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm ${
                    pageNumber === page
                      ? "border-[#b45c69] bg-[#4a151d] text-white"
                      : "border-[#4a1d22] bg-[#180709] text-[#f6d7d1]"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#4a1d22] bg-[#180709] px-3 text-sm text-[#f6d7d1] disabled:opacity-50"
              >
                Next
                <HiOutlineArrowRight />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default AdminUsers;
