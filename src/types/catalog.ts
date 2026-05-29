export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopSummary {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  city: string | null;
  rating: string;
  reviews_count: number;
  status: "pending" | "active" | "blocked";
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface Bouquet {
  id: string;
  shop_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  compound: string | null;
  price: string;
  old_price: string | null;
  image: string;
  images: string[];
  size: string | null;
  stock: number;
  status: "active" | "inactive" | "sold_out";
  rating: string;
  reviews_count: number;
  created_at: string;
  updated_at: string;
  shop: ShopSummary;
  category: CategorySummary | null;
}

export interface BouquetPage {
  items: Bouquet[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface ShopOwnerSummary {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  phone: string;
  address: string;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  working_hours: string | null;
  rating: string;
  reviews_count: number;
  status: "pending" | "active" | "blocked";
  created_at: string;
  updated_at: string;
  owner: ShopOwnerSummary;
}

export interface ReviewUserSummary {
  id: string;
  full_name: string;
}

export interface Review {
  id: string;
  user_id: string;
  shop_id: string;
  bouquet_id: string | null;
  order_id: string | null;
  rating: number;
  text: string | null;
  image: string | null;
  is_approved: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  user: ReviewUserSummary;
}

export interface ReviewCreatePayload {
  shop_id: string;
  bouquet_id?: string;
  order_id?: string;
  rating: number;
  text?: string;
  image?: string;
}

export interface ImageUploadResponse {
  url: string;
  file_id: string;
  name: string;
  thumbnail_url: string | null;
}

export interface OrderItemCreatePayload {
  bouquet_id: string;
  bouquet_name: string;
  bouquet_image?: string;
  price: string;
  quantity: number;
}

export interface OrderCreatePayload {
  shop_id: string;
  customer_name: string;
  phone: string;
  email?: string;
  delivery_method: string;
  address?: string;
  payment_method: string;
  note?: string;
  items: OrderItemCreatePayload[];
}

export interface OrderItemOut {
  id: string;
  order_id: string;
  bouquet_id: string | null;
  bouquet_name: string;
  bouquet_image: string | null;
  price: string;
  quantity: number;
  total_price: string;
}

export interface OrderOut {
  id: string;
  user_id: string | null;
  shop_id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  delivery_method: string;
  address: string | null;
  payment_method: string;
  payment_status: "pending" | "paid" | "failed";
  status: "new" | "accepted" | "preparing" | "delivering" | "delivered" | "cancelled";
  total_price: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItemOut[];
}

export interface AddressOut {
  id: string;
  user_id: string;
  title: string;
  address_line: string;
  city: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressCreatePayload {
  title: string;
  address_line: string;
  city?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  is_primary?: boolean;
}

export interface AddressUpdatePayload {
  title?: string;
  address_line?: string;
  city?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  is_primary?: boolean;
}

export interface ReferralFriend {
  id: string;
  full_name: string;
  email: string;
  reward_granted: boolean;
}

export interface ReferralSummary {
  referral_code: string;
  invite_count: number;
  pending_referrals: number;
  successful_referrals: number;
  bonus_balance: string;
  reward_amount: string;
  referred_friends: ReferralFriend[];
}
