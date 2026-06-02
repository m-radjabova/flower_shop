import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBouquet,
  createShopApplication,
  createOrder,
  createMyAddress,
  deleteBouquet,
  deleteMyAddress,
  createReview,
  getBouquet,
  getBouquetPage,
  getBouquets,
  getCategories,
  getAdminShops,
  getManagedBouquets,
  getManagedReviews,
  getShopApplications,
  getMyLatestShopApplication,
  getMyShops,
  getMyReferralSummary,
  getMyOrders,
  getMyAddresses,
  updateOrderStatus,
  getMyReviews,
  moderateReview,
  getReviews,
  getShopOrders,
  reviewShopApplication,
  setPrimaryAddress,
  getShop,
  updateBouquet,
  updateShop,
  updateMyAddress,
  uploadImage,
  type BouquetQueryParams,
} from "../api/catalog";
import type {
  AddressCreatePayload,
  AddressUpdatePayload,
  BouquetCreatePayload,
  BouquetUpdatePayload,
  OrderCreatePayload,
  OrderOut,
  ReviewCreatePayload,
  ReviewModerationPayload,
  ShopApplicationCreatePayload,
  ShopApplicationReviewPayload,
  ShopUpdatePayload,
} from "../types/catalog";

export const categoryQueryKey = ["categories"];

export function useCategories() {
  return useQuery({
    queryKey: categoryQueryKey,
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 45,
  });
}

export function useBouquets(params: BouquetQueryParams) {
  return useQuery({
    queryKey: ["bouquets", params],
    queryFn: () => getBouquets(params),
    placeholderData: (previousData) => previousData,
    refetchInterval: 1000 * 30,
  });
}

export function useInfiniteBouquets(params: Omit<BouquetQueryParams, "offset"> & { limit?: number }) {
  const limit = params.limit ?? 12;

  return useInfiniteQuery({
    queryKey: ["bouquets", "infinite", params],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getBouquetPage({
        ...params,
        limit,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.offset + lastPage.items.length : undefined,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}

export function useBouquet(bouquetId: string | undefined) {
  return useQuery({
    queryKey: ["bouquet", bouquetId],
    queryFn: () => getBouquet(bouquetId ?? ""),
    enabled: Boolean(bouquetId),
  });
}

export function useShop(slug: string | undefined) {
  return useQuery({
    queryKey: ["shop", slug],
    queryFn: () => getShop(slug ?? ""),
    enabled: Boolean(slug),
  });
}

export function useMyShops() {
  return useQuery({
    queryKey: ["shops", "me"],
    queryFn: getMyShops,
  });
}

export function useManagedBouquets(shopId: string | undefined) {
  return useQuery({
    queryKey: ["bouquets", "manage", shopId],
    queryFn: () => getManagedBouquets(shopId ?? ""),
    enabled: Boolean(shopId),
  });
}

export function useAdminShops() {
  return useQuery({
    queryKey: ["shops", "admin"],
    queryFn: getAdminShops,
  });
}

export function useShopApplications() {
  return useQuery({
    queryKey: ["shop-applications", "admin"],
    queryFn: getShopApplications,
    refetchInterval: 1000 * 20,
  });
}

export function useMyLatestShopApplication() {
  return useQuery({
    queryKey: ["shop-applications", "me", "latest"],
    queryFn: getMyLatestShopApplication,
  });
}

export function useShopOrders(shopId: string | undefined) {
  return useQuery({
    queryKey: ["orders", "shop", shopId],
    queryFn: () => getShopOrders(shopId ?? ""),
    enabled: Boolean(shopId),
    refetchInterval: 1000 * 20,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: { status: OrderOut["status"] } }) =>
      updateOrderStatus(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "shop"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] });
    },
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: ["orders", "me"],
    queryFn: getMyOrders,
    refetchInterval: 1000 * 20,
  });
}

export function useMyAddresses() {
  return useQuery({
    queryKey: ["addresses", "me"],
    queryFn: getMyAddresses,
  });
}

export function useReviews(params: { shopId?: string; bouquetId?: string }) {
  return useQuery({
    queryKey: ["reviews", params],
    queryFn: () => getReviews(params),
    enabled: Boolean(params.shopId || params.bouquetId),
  });
}

export function useManagedReviews(shopId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "manage", shopId],
    queryFn: () => getManagedReviews(shopId ?? ""),
    enabled: Boolean(shopId),
    refetchInterval: 1000 * 20,
  });
}

export function useMyReviews() {
  return useQuery({
    queryKey: ["reviews", "me"],
    queryFn: getMyReviews,
    refetchInterval: 1000 * 20,
  });
}

export function useMyReferralSummary() {
  return useQuery({
    queryKey: ["referrals", "me"],
    queryFn: getMyReferralSummary,
    refetchInterval: 1000 * 30,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReviewCreatePayload) => createReview(payload),
    onSuccess: (_review, payload) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["bouquet", payload.bouquet_id] });
      queryClient.invalidateQueries({ queryKey: ["bouquets"] });
      queryClient.invalidateQueries({ queryKey: ["shop"] });
    },
  });
}

export function useModerateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: string; payload: ReviewModerationPayload }) =>
      moderateReview(reviewId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "manage"] });
      queryClient.invalidateQueries({ queryKey: ["bouquets"] });
      queryClient.invalidateQueries({ queryKey: ["shop"] });
    },
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => uploadImage(file),
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (payload: OrderCreatePayload) => createOrder(payload),
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddressCreatePayload) => createMyAddress(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", "me"] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, payload }: { addressId: string; payload: AddressUpdatePayload }) =>
      updateMyAddress(addressId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", "me"] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => deleteMyAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", "me"] });
    },
  });
}

export function useSetPrimaryAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => setPrimaryAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", "me"] });
    },
  });
}

export function useUpdateShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shopId, payload }: { shopId: string; payload: ShopUpdatePayload }) =>
      updateShop(shopId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["shops", "me"] });
      queryClient.invalidateQueries({ queryKey: ["shop"] });
    },
  });
}

export function useCreateShopApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ShopApplicationCreatePayload) => createShopApplication(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-applications", "me", "latest"] });
    },
  });
}

export function useCreateBouquet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BouquetCreatePayload) => createBouquet(payload),
    onSuccess: (bouquet) => {
      queryClient.invalidateQueries({ queryKey: ["bouquets", "manage", bouquet.shop_id] });
      queryClient.invalidateQueries({ queryKey: ["bouquets"] });
    },
  });
}

export function useUpdateBouquet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bouquetId, payload }: { bouquetId: string; payload: BouquetUpdatePayload }) =>
      updateBouquet(bouquetId, payload),
    onSuccess: (bouquet) => {
      queryClient.invalidateQueries({ queryKey: ["bouquets", "manage", bouquet.shop_id] });
      queryClient.invalidateQueries({ queryKey: ["bouquets"] });
      queryClient.invalidateQueries({ queryKey: ["bouquet", bouquet.id] });
    },
  });
}

export function useDeleteBouquet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bouquetId }: { bouquetId: string; shopId: string }) => deleteBouquet(bouquetId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bouquets", "manage", variables.shopId] });
      queryClient.invalidateQueries({ queryKey: ["bouquets"] });
    },
  });
}

export function useReviewShopApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, payload }: { applicationId: string; payload: ShopApplicationReviewPayload }) =>
      reviewShopApplication(applicationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-applications", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["shop-applications", "me", "latest"] });
      queryClient.invalidateQueries({ queryKey: ["shops", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["shops", "me"] });
      queryClient.invalidateQueries({ queryKey: ["shop"] });
    },
  });
}
