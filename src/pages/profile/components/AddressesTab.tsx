import { HiOutlineMapPin } from "react-icons/hi2";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(undefined, { keyPrefix: "profile" });
  const register = addressForm.register;
  const latitude = addressForm.watch("latitude");
  const longitude = addressForm.watch("longitude");

  return (
    <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="font-cormorant text-3xl text-white sm:text-4xl">{t("myAddresses")}</p>
          <p className="mt-1 max-w-2xl text-sm text-[#d8beb8] sm:mt-2">{t("addressesDesc")}</p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/8 bg-[#140709] px-3 py-2 sm:px-4 sm:py-3 sm:gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2a0f14] text-[#ffb1bd] sm:h-11 sm:w-11">
            <HiOutlineMapPin className="text-base sm:text-xl" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#b7918a] sm:text-xs">{t("savedAddresses")}</p>
            <p className="mt-0.5 text-xl font-semibold text-white sm:mt-1 sm:text-2xl">{addresses.length}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-5">
        <section className="rounded-[1.4rem] border border-white/8 bg-[#120607] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="font-cormorant text-2xl text-white sm:text-3xl">{editingAddressId ? t("editAddress") : t("newAddress")}</p>
              <p className="mt-0.5 text-xs text-[#cfafa8] sm:mt-1 sm:text-sm">{t("addressFormDesc")}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#2a1014] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[#ffb1bd] sm:px-3 sm:py-1 sm:text-xs">
              {editingAddressId ? t("editing") : t("creating")}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#f1d5cb] sm:mb-2 sm:text-sm">{t("title")}</span>
              <input
                {...register("title")}
                placeholder={t("titlePlaceholder")}
                className="h-11 w-full rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 text-sm text-white outline-none transition focus:border-[#b54b58] sm:h-12 sm:text-base"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#f1d5cb] sm:mb-2 sm:text-sm">{t("city")}</span>
              <input
                {...register("city")}
                placeholder={t("cityPlaceholder")}
                className="h-11 w-full rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 text-sm text-white outline-none transition focus:border-[#b54b58] sm:h-12 sm:text-base"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-[#f1d5cb] sm:mb-2 sm:text-sm">{t("addressLine")}</span>
              <input
                {...register("address_line")}
                placeholder={t("addressLinePlaceholder")}
                className="h-11 w-full rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 text-sm text-white outline-none transition focus:border-[#b54b58] sm:h-12 sm:text-base"
              />
            </label>
            <div className="sm:col-span-2 rounded-2xl border border-[#4b2326] bg-[#1a090c] px-3 py-2.5 sm:px-4 sm:py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#cda39c] sm:text-xs">{t("mapPinLabel")}</p>
              <p className="mt-1 text-xs text-[#f0d6d0] sm:mt-2 sm:text-sm">
                {latitude !== null && longitude !== null
                  ? `Pin: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                  : t("mapPinNotSelected")}
              </p>
            </div>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-[#f1d5cb] sm:mb-2 sm:text-sm">{t("notes")}</span>
              <textarea
                {...register("notes")}
                placeholder={t("notesPlaceholder")}
                className="min-h-24 w-full rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 py-3 text-sm text-white outline-none transition focus:border-[#b54b58] sm:min-h-28 sm:text-base"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
            <button
              type="button"
              onClick={onAddressSubmit}
              disabled={createPending || updatePending}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-4 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60 sm:h-11 sm:px-5"
            >
              {editingAddressId ? t("updateAddress") : t("addAddress")}
            </button>
            {editingAddressId ? (
              <button type="button" onClick={onResetAddressForm} className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2a0f12] px-4 text-sm font-semibold text-[#f3d6d0] transition hover:bg-[#381419] sm:h-11 sm:px-5">
                {t("cancel")}
              </button>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.4rem] border border-[#4b2326] bg-[#120607]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#4b2326] px-4 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0">
              <p className="font-cormorant text-2xl text-white sm:text-3xl">{t("addressPicker")}</p>
              <p className="text-xs text-[#cfafa8] sm:text-sm">{t("addressPickerDesc")}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#1d0d10] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[#e8c2ba] sm:px-3 sm:py-1 sm:text-xs">
              {isResolvingAddress ? t("locating") : t("liveMap")}
            </span>
          </div>
          <div ref={mapHostRef} className="h-[280px] w-full sm:h-[420px]" />
        </section>
      </div>

      <div className="mt-6 space-y-4">
        {isAddressesLoading ? <AddressCardsSkeleton /> : null}
        {!isAddressesLoading && !addresses.length ? <p className="text-[#d8beb8]">{t("noAddresses")}</p> : null}
        {!isAddressesLoading && addresses.map((address) => {
          const addressTitleMeta = getAddressTitleMeta(address.title);

          return (
            <article key={address.id} className="rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(20,7,9,0.96),rgba(14,4,6,0.98))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${addressTitleMeta.badgeClassName} sm:h-12 sm:w-12`}>
                      {addressTitleMeta.icon}
                    </span>
                    <p className="text-xl font-semibold text-white sm:text-2xl">{address.title}</p>
                    {address.is_primary ? (
                      <span className="rounded-full bg-[#3a1d0f] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[#ffd59a] sm:px-2.5 sm:py-1 sm:text-xs">{t("primaryLabel")}</span>
                    ) : null}
                    {isSameCheckoutAddress(address, preferredCheckoutAddress) ? (
                      <span className="rounded-full bg-[#10241a] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[#9ef0c2] sm:px-2.5 sm:py-1 sm:text-xs">{t("checkoutLabel")}</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[#f1d5cf] sm:mt-3 sm:text-base">{address.address_line}</p>
                  <p className="mt-0.5 text-xs text-[#c4a39b] sm:mt-1 sm:text-sm">{address.city ?? t("cityNotSet")}</p>
                  {address.notes ? (
                    <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 sm:mt-4 sm:px-4 sm:py-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#cda39c] sm:text-xs">{t("notes")}</p>
                      <p className="mt-1 text-xs text-[#e3c5bf] sm:mt-2 sm:text-sm">{address.notes}</p>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row xl:flex-col">
                  <button
                    type="button"
                    onClick={() => onEditAddress(address)}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2a0f12] px-3 text-xs font-medium text-[#f3d6d0] transition hover:bg-[#381419] sm:h-11 sm:px-4 sm:text-sm"
                  >
                    {t("edit")}
                  </button>
                  {!address.is_primary ? (
                    <button
                      type="button"
                      onClick={() => onSetPrimaryAddress(address.id)}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2a1b0f] px-3 text-xs font-medium text-[#ffd59a] transition hover:bg-[#3a2412] sm:h-11 sm:px-4 sm:text-sm"
                    >
                      {t("setAsPrimary")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onSetCheckoutAddress(address)}
                    className={`inline-flex h-10 items-center justify-center rounded-xl px-3 text-xs font-medium transition sm:h-11 sm:px-4 sm:text-sm ${
                      isSameCheckoutAddress(address, preferredCheckoutAddress)
                        ? "bg-[#1c5038] text-white"
                        : "bg-[#10241a] text-[#9ef0c2] hover:bg-[#143021]"
                    }`}
                  >
                    {isSameCheckoutAddress(address, preferredCheckoutAddress) ? t("selectedForCheckout") : t("useForCheckout")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAddress(address)}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#3a1116] px-3 text-xs font-medium text-[#ffb1bd] transition hover:bg-[#4a151d] sm:h-11 sm:px-4 sm:text-sm"
                  >
                    {t("delete")}
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
                  {t("noMapPin")}
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
