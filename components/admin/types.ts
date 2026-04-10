export interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  role: string;
  created_at: string;
}

export interface AdminBook {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  isbn: string | null;
  cover_url: string | null;
}

export interface AdminListing {
  id: string;
  book_id: string;
  seller_id: string;
  modality: string;
  price: number | null;
  condition: string;
  notes: string | null;
  address: string | null;
  cover_image_url: string | null;
  status: string;
  featured: boolean;
  created_at: string;
  book: AdminBook;
  seller: { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
}

export interface AdminOrder {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  book_price: number;
  shipping_cost: number;
  service_fee: number;
  total: number;
  status: string;
  shipping_speed: string;
  courier: string | null;
  tracking_code: string | null;
  buyer_address: string | null;
  mercadopago_payment_id: string | null;
  created_at: string;
  listing: AdminListing;
  buyer: { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
}
