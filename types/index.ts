export type Modality = "sale" | "loan" | "both";
export type ListingStatus = "active" | "paused" | "completed";
export type BookCondition = "new" | "good" | "fair" | "poor";

export interface BookData {
  title: string;
  author: string;
  description?: string;
  cover_url?: string | null;
  genre?: string | null;
  published_year?: number | null;
  isbn?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_url: string | null;
  genre: string | null;
  published_year: number | null;
  isbn: string | null;
  created_by: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  city: string | null;
  phone: string | null;
  created_at: string;
}


export interface Listing {
  id: string;
  book_id: string;
  seller_id: string;
  modality: Modality;
  price: number | null;
  condition: BookCondition;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  cover_image_url: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

export interface ListingWithBook extends Listing {
  book: Book;
  seller?: Pick<UserProfile, "id" | "full_name" | "avatar_url" | "phone">;
}

/* ── Orders & Payments ── */

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export type ShippingSpeed = "standard" | "express";

export interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  book_price: number;
  shipping_cost: number;
  service_fee: number;
  total: number;
  status: OrderStatus;
  shipping_speed: ShippingSpeed;
  courier: string | null;
  tracking_code: string | null;
  mercadopago_preference_id: string | null;
  mercadopago_payment_id: string | null;
  buyer_address: string | null;
  buyer_latitude: number | null;
  buyer_longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithDetails extends Order {
  listing: ListingWithBook;
  buyer: Pick<UserProfile, "id" | "full_name" | "email" | "phone">;
}
