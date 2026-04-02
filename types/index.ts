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
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

export interface ListingWithBook extends Listing {
  book: Book;
  seller?: Pick<UserProfile, "id" | "full_name" | "avatar_url" | "phone">;
}
