export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          updated_at?: string;
        };
      };
      books: {
        Row: {
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
        };
        Insert: {
          id?: string;
          title: string;
          author: string;
          description?: string | null;
          cover_url?: string | null;
          genre?: string | null;
          published_year?: number | null;
          isbn?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          author?: string;
          description?: string | null;
          cover_url?: string | null;
          genre?: string | null;
          published_year?: number | null;
          isbn?: string | null;
        };
      };
      listings: {
        Row: {
          id: string;
          book_id: string;
          seller_id: string;
          modality: "sale" | "loan" | "both";
          price: number | null;
          condition: "new" | "good" | "fair" | "poor";
          notes: string | null;
          latitude: number | null;
          longitude: number | null;
          address: string | null;
          status: "active" | "paused" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          seller_id: string;
          modality: "sale" | "loan" | "both";
          price?: number | null;
          condition: "new" | "good" | "fair" | "poor";
          notes?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          status?: "active" | "paused" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          modality?: "sale" | "loan" | "both";
          price?: number | null;
          condition?: "new" | "good" | "fair" | "poor";
          notes?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          status?: "active" | "paused" | "completed";
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      modality: "sale" | "loan" | "both";
      listing_status: "active" | "paused" | "completed";
      book_condition: "new" | "good" | "fair" | "poor";
    };
  };
}
