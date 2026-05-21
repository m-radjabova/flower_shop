import apiClient from "../apiClient/apiClient";
import type {
  Bouquet,
  BouquetPage,
  Category,
  ImageUploadResponse,
  OrderCreatePayload,
  OrderOut,
  AddressCreatePayload,
  AddressOut,
  AddressUpdatePayload,
  Review,
  ReviewCreatePayload,
  Shop,
} from "../types/catalog";

export interface BouquetQueryParams {
  shopId?: string;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getCategories() {
  const { data } = await apiClient.get<Category[]>("/categories", {
    params: { active_only: true },
  });
  return data;
}

export async function getBouquets(params: BouquetQueryParams = {}) {
  const { data } = await apiClient.get<Bouquet[]>("/bouquets", {
    params: {
      ...(params.shopId ? { shop_id: params.shopId } : {}),
      ...(params.categoryId ? { category_id: params.categoryId } : {}),
      ...(params.search ? { search: params.search } : {}),
      ...(params.limit ? { limit: params.limit } : {}),
      ...(params.offset ? { offset: params.offset } : {}),
    },
  });
  return data;
}

export async function getBouquetPage(params: BouquetQueryParams = {}) {
  const { data } = await apiClient.get<BouquetPage>("/bouquets/page", {
    params: {
      ...(params.shopId ? { shop_id: params.shopId } : {}),
      ...(params.categoryId ? { category_id: params.categoryId } : {}),
      ...(params.search ? { search: params.search } : {}),
      limit: params.limit ?? 12,
      offset: params.offset ?? 0,
    },
  });
  return data;
}

export async function getBouquet(bouquetId: string) {
  const { data } = await apiClient.get<Bouquet>(`/bouquets/${bouquetId}`);
  return data;
}

export async function getShop(slug: string) {
  const { data } = await apiClient.get<Shop>(`/shops/${slug}`);
  return data;
}

export async function getMyShops() {
  const { data } = await apiClient.get<Shop[]>("/shops/me");
  return data;
}

export async function getReviews(params: { shopId?: string; bouquetId?: string } = {}) {
  const { data } = await apiClient.get<Review[]>("/reviews", {
    params: {
      ...(params.shopId ? { shop_id: params.shopId } : {}),
      ...(params.bouquetId ? { bouquet_id: params.bouquetId } : {}),
    },
  });
  return data;
}

export async function getMyReviews() {
  const { data } = await apiClient.get<Review[]>("/reviews/me");
  return data;
}

export async function createReview(payload: ReviewCreatePayload) {
  const { data } = await apiClient.post<Review>("/reviews", payload);
  return data;
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<ImageUploadResponse>("/uploads/image", formData);
  return data;
}

export async function createOrder(payload: OrderCreatePayload) {
  const { data } = await apiClient.post<OrderOut>("/orders", payload);
  return data;
}

export async function getShopOrders(shopId: string) {
  const { data } = await apiClient.get<OrderOut[]>(`/orders/shop/${shopId}`);
  return data;
}

export async function getMyOrders() {
  const { data } = await apiClient.get<OrderOut[]>("/orders/me");
  return data;
}

export async function getMyAddresses() {
  const { data } = await apiClient.get<AddressOut[]>("/addresses/me");
  return data;
}

export async function createMyAddress(payload: AddressCreatePayload) {
  const { data } = await apiClient.post<AddressOut>("/addresses/me", payload);
  return data;
}

export async function updateMyAddress(addressId: string, payload: AddressUpdatePayload) {
  const { data } = await apiClient.patch<AddressOut>(`/addresses/me/${addressId}`, payload);
  return data;
}

export async function deleteMyAddress(addressId: string) {
  await apiClient.delete(`/addresses/me/${addressId}`);
}

export async function setPrimaryAddress(addressId: string) {
  const { data } = await apiClient.patch<AddressOut>(`/addresses/me/${addressId}/primary`);
  return data;
}
