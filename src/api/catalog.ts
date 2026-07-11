import apiClient from "../apiClient/apiClient";
import axios from "axios";
import type {
  Bouquet,
  BouquetPage,
  Category,
  ImageUploadResponse,
  ReferralSummary,
  OrderCreatePayload,
  OrderOut,
  AddressCreatePayload,
  AddressOut,
  AddressUpdatePayload,
  BouquetCreatePayload,
  BouquetUpdatePayload,
  Review,
  ReviewCreatePayload,
  ReviewModerationPayload,
  ShopApplication,
  ShopApplicationCreatePayload,
  ShopApplicationReviewPayload,
  ShopApplicationSubmitResponse,
  ShopApplicationWithUser,
  Shop,
  ShopUpdatePayload,
} from "../types/catalog";

export interface CategoryCreatePayload {
  name: string;
  slug?: string;
  description?: string | null;
  image?: string;
  is_active?: boolean;
}

export interface CategoryUpdatePayload {
  name?: string;
  slug?: string;
  description?: string | null;
  image?: string;
  is_active?: boolean;
}

export interface BouquetQueryParams {
  shopId?: string;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

function normalizeSearchParam(search?: string) {
  const normalized = search?.trim();
  return normalized ? { search: normalized } : {};
}

export async function getCategories() {
  const { data } = await apiClient.get<Category[]>("/categories", {
    params: { active_only: true },
  });
  return data;
}

export async function getAdminCategories() {
  const { data } = await apiClient.get<Category[]>("/categories", {
    params: { active_only: false },
  });
  return data;
}

export async function getBouquets(params: BouquetQueryParams = {}) {
  const { data } = await apiClient.get<Bouquet[]>("/bouquets", {
    params: {
      ...(params.shopId ? { shop_id: params.shopId } : {}),
      ...(params.categoryId ? { category_id: params.categoryId } : {}),
      ...normalizeSearchParam(params.search),
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
      ...normalizeSearchParam(params.search),
      limit: params.limit ?? 12,
      offset: params.offset ?? 0,
    },
  });
  return data;
}

export async function getBouquet(bouquetId: string) {
  try {
    const { data } = await apiClient.get<Bouquet>(`/bouquets/${bouquetId}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && [400, 404, 422].includes(error.response?.status ?? 0)) {
      const bouquets = await getBouquets({ search: bouquetId, limit: 50 });
      const match = bouquets.find((bouquet) => bouquet.slug === bouquetId || bouquet.id === bouquetId);

      if (match) {
        return match;
      }
    }

    throw error;
  }
}

export async function getManagedBouquets(shopId: string) {
  const { data } = await apiClient.get<Bouquet[]>(`/bouquets/manage/shop/${shopId}`);
  return data;
}

export async function getShop(slug: string) {
  const { data } = await apiClient.get<Shop>(`/shops/${slug}`);
  return data;
}

export async function getShops() {
  const { data } = await apiClient.get<Shop[]>("/shops");
  return data;
}

export async function getAdminShops() {
  const { data } = await apiClient.get<Shop[]>("/shops", {
    params: { include_inactive: true },
  });
  return data;
}

export async function getMyShops() {
  const { data } = await apiClient.get<Shop[]>("/shops/me");
  return data;
}

export async function getShopApplications() {
  const { data } = await apiClient.get<ShopApplicationWithUser[]>("/shop-applications");
  return data;
}

export async function getMyLatestShopApplication() {
  const { data } = await apiClient.get<ShopApplication | null>("/shop-applications/me/latest");
  return data;
}

export async function createShopApplication(payload: ShopApplicationCreatePayload) {
  const { data } = await apiClient.post<ShopApplicationSubmitResponse>("/shop-applications", payload);
  return data;
}

export async function reviewShopApplication(applicationId: string, payload: ShopApplicationReviewPayload) {
  const { data } = await apiClient.patch<ShopApplicationWithUser>(`/shop-applications/${applicationId}/review`, payload);
  return data;
}

export async function updateShop(shopId: string, payload: ShopUpdatePayload) {
  const { data } = await apiClient.patch<Shop>(`/shops/${shopId}`, payload);
  return data;
}

export async function createCategory(payload: CategoryCreatePayload) {
  const { data } = await apiClient.post<Category>("/categories", payload);
  return data;
}

export async function updateCategory(categoryId: string, payload: CategoryUpdatePayload) {
  const { data } = await apiClient.patch<Category>(`/categories/${categoryId}`, payload);
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

export async function getManagedReviews(shopId: string) {
  const { data } = await apiClient.get<Review[]>(`/reviews/manage/shop/${shopId}`);
  return data;
}

export async function moderateReview(reviewId: string, payload: ReviewModerationPayload) {
  const { data } = await apiClient.patch<Review>(`/reviews/${reviewId}/moderate`, payload);
  return data;
}

export async function createBouquet(payload: BouquetCreatePayload) {
  const { data } = await apiClient.post<Bouquet>("/bouquets", payload);
  return data;
}

export async function updateBouquet(bouquetId: string, payload: BouquetUpdatePayload) {
  const { data } = await apiClient.patch<Bouquet>(`/bouquets/${bouquetId}`, payload);
  return data;
}

export async function deleteBouquet(bouquetId: string) {
  await apiClient.delete(`/bouquets/${bouquetId}`);
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

export async function updateOrderStatus(orderId: string, payload: { status: OrderOut["status"] }) {
  const { data } = await apiClient.patch<OrderOut>(`/orders/${orderId}/status`, payload);
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

export async function getMyReferralSummary() {
  const { data } = await apiClient.get<ReferralSummary>("/referrals/me");
  return data;
}
