import { HiOutlineMapPin } from "react-icons/hi2";
import type { UseFormReturn } from "react-hook-form";
import { AddressCardsSkeleton } from "../../../components/PageSkeletons";
import type { AddressOut } from "../../../types/catalog";
import type { StoredCheckoutAddress } from "../../../utils/address";
import { getAddressTitleMeta } from "./profileHelpers";

interface AddressFormState {
  title: string;
  address_line: string;
  city: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
}

interface AddressesTabProps {
  addressForm: UseFormReturn<AddressFormState>;
  addresses: AddressOut[];
  editingAddressId: string | null;
  isAddressesLoading: boolean;
  isResolvingAddress: boolean;
  mapHostRef: React.RefObject<HTMLDivElement | null>;
  onAddressSubmit: () => void;
  onDeleteAddress: (address: AddressOut) => Promise<void>;
  onEditAddress: (address: AddressOut) => void;
  onResetAddressForm: () => void;
  onSetCheckoutAddress: (address: AddressOut) => void;
  onSetPrimaryAddress: (addressId: string) => Promise<void>;
  preferredCheckoutAddress: StoredCheckoutAddress | null;
  isSameCheckoutAddress: (address: AddressOut, preferred: StoredCheckoutAddress | null) => boolean;
  createPending: boolean;
  updatePending: boolean;
}

function AddressesTab({
  addressForm,
  addresses,
  editingAddressId,
  isAddressesLoading,
  isResolvingAddress,
  mapHostRef,
  onAddressSubmit,
  onDeleteAddress,
  onEditAddress,
  onResetAddressForm,
  onSetCheckoutAddress,
  onSetPrimaryAddress,
  preferredCheckoutAddress,
  isSameCheckoutAddress,
  createPending,
  updatePending,
}: AddressesTabProps) {
  const register = addressForm.register;
  const latitude = addressForm.watch("latitude");
  const longitude = addressForm.watch("longitude");

  return (
    <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-cormorant text-4xl text-white">My Addresses</p>
          <p className="mt-2 max-w-2xl text-[#d8beb8]">Address qo'shing, tahrirlang, o'chiring va primary qilib belgilang.</p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/8 bg-[#140709] px-4 py-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2a0f14] text-[#ffb1bd]">
            <HiOutlineMapPin className="text-xl" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#b7918a]">Saved addresses</p>
            <p className="mt-1 text-2xl font-semibold text-white">{addresses.length}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        <section className="rounded-[1.4rem] border border-white/8 bg-[#120607] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-cormorant text-3xl text-white">{editingAddressId ? "Edit Address" : "New Address"}</p>
              <p className="mt-1 text-sm text-[#cfafa8]">Title, city, full address va note kiriting.</p>
            </div>
            <span className="rounded-full bg-[#2a1014] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#ffb1bd]">
              {editingAddressId ? "Editing" : "Create"}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">Title</span>
              <input
                {...register("title")}
                placeholder="Home, Office..."
                className="h-12 w-full rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 text-white outline-none transition focus:border-[#b54b58]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">City</span>
              <input
                {...register("city")}
                placeholder="Tashkent"
                className="h-12 w-full rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 text-white outline-none transition focus:border-[#b54b58]"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">Address line</span>
              <input
                {...register("address_line")}
                placeholder="Street, house, apartment..."
                className="h-12 w-full rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 text-white outline-none transition focus:border-[#b54b58]"
              />
            </label>
            <div className="sm:col-span-2 rounded-2xl border border-[#4b2326] bg-[#1a090c] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[#cda39c]">Selected map pin</p>
              <p className="mt-2 text-sm text-[#f0d6d0]">
                {latitude !== null && longitude !== null
                  ? `Pin: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                  : "Map pin tanlanmagan"}
              </p>
            </div>
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">Notes</span>
              <textarea
                {...register("notes")}
                placeholder="Entrance, floor, nearby landmark..."
                className="min-h-28 w-full rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 py-3 text-white outline-none transition focus:border-[#b54b58]"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onAddressSubmit}
              disabled={createPending || updatePending}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-5 font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
            >
              {editingAddressId ? "Update Address" : "Add Address"}
            </button>
            {editingAddressId ? (
              <button type="button" onClick={onResetAddressForm} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2a0f12] px-5 font-semibold text-[#f3d6d0] transition hover:bg-[#381419]">
                Cancel
              </button>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.4rem] border border-[#4b2326] bg-[#120607]">
          <div className="flex items-center justify-between gap-3 border-b border-[#4b2326] px-5 py-4">
            <div>
              <p className="font-cormorant text-3xl text-white">Address Picker</p>
              <p className="text-sm text-[#cfafa8]">Xaritada bosib manzil tanlang.</p>
            </div>
            <span className="rounded-full bg-[#1d0d10] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#e8c2ba]">
              {isResolvingAddress ? "Locating..." : "Live map"}
            </span>
          </div>
          <div ref={mapHostRef} className="h-[420px] w-full" />
        </section>
      </div>

      <div className="mt-6 space-y-4">
        {isAddressesLoading ? <AddressCardsSkeleton /> : null}
        {!isAddressesLoading && !addresses.length ? <p className="text-[#d8beb8]">Hozircha address yo'q.</p> : null}
        {!isAddressesLoading && addresses.map((address) => {
          const addressTitleMeta = getAddressTitleMeta(address.title);

          return (
            <article key={address.id} className="rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(20,7,9,0.96),rgba(14,4,6,0.98))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${addressTitleMeta.badgeClassName}`}>
                      {addressTitleMeta.icon}
                    </span>
                    <p className="text-2xl font-semibold text-white">{address.title}</p>
                    {address.is_primary ? (
                      <span className="rounded-full bg-[#3a1d0f] px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-[#ffd59a]">Primary</span>
                    ) : null}
                    {isSameCheckoutAddress(address, preferredCheckoutAddress) ? (
                      <span className="rounded-full bg-[#10241a] px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-[#9ef0c2]">Checkout</span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-base text-[#f1d5cf]">{address.address_line}</p>
                  <p className="mt-1 text-sm text-[#c4a39b]">{address.city ?? "City not set"}</p>
                  {address.notes ? (
                    <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#cda39c]">Notes</p>
                      <p className="mt-2 text-sm text-[#e3c5bf]">{address.notes}</p>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                  <button
                    type="button"
                    onClick={() => onEditAddress(address)}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2a0f12] px-4 text-sm font-medium text-[#f3d6d0] transition hover:bg-[#381419]"
                  >
                    Edit
                  </button>
                  {!address.is_primary ? (
                    <button
                      type="button"
                      onClick={() => onSetPrimaryAddress(address.id)}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2a1b0f] px-4 text-sm font-medium text-[#ffd59a] transition hover:bg-[#3a2412]"
                    >
                      Set Primary
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onSetCheckoutAddress(address)}
                    className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium transition ${
                      isSameCheckoutAddress(address, preferredCheckoutAddress)
                        ? "bg-[#1c5038] text-white"
                        : "bg-[#10241a] text-[#9ef0c2] hover:bg-[#143021]"
                    }`}
                  >
                    {isSameCheckoutAddress(address, preferredCheckoutAddress) ? "Selected for checkout" : "Use for checkout"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAddress(address)}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#3a1116] px-4 text-sm font-medium text-[#ffb1bd] transition hover:bg-[#4a151d]"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {address.latitude !== null && address.longitude !== null ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#4b2326]">
                  <iframe
                    title={`${address.title} map preview`}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${address.longitude - 0.01}%2C${address.latitude - 0.01}%2C${address.longitude + 0.01}%2C${address.latitude + 0.01}&layer=mapnik&marker=${address.latitude}%2C${address.longitude}`}
                    className="h-40 w-full"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[#4b2326] bg-[#120607] px-4 py-4 text-sm text-[#c4a39b]">
                  Map pin hali qo'yilmagan.
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default AddressesTab;
