import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrder,
  createMyAddress,
  deleteMyAddress,
  createReview,
  getBouquet,
  getBouquetPage,
  getBouquets,
  getCategories,
  getMyShops,
  getMyOrders,
  getMyAddresses,
  getMyReviews,
  getReviews,
  getShopOrders,
  setPrimaryAddress,
  getShop,
  updateMyAddress,
  uploadImage,
  type BouquetQueryParams,
} from "../api/catalog";
import type { AddressCreatePayload, AddressUpdatePayload, OrderCreatePayload, ReviewCreatePayload } from "../types/catalog";

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

export function useShopOrders(shopId: string | undefined) {
  return useQuery({
    queryKey: ["orders", "shop", shopId],
    queryFn: () => getShopOrders(shopId ?? ""),
    enabled: Boolean(shopId),
    refetchInterval: 1000 * 20,
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

export function useMyReviews() {
  return useQuery({
    queryKey: ["reviews", "me"],
    queryFn: getMyReviews,
    refetchInterval: 1000 * 20,
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
