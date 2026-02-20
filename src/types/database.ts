export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.1" };
  public: {
    Tables: {
      likes: {
        Row: {
          created_at: string | null;
          title_id: string;
          title_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          title_id: string;
          title_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          title_id?: string;
          title_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      list_items: {
        Row: {
          added_at: string | null;
          id: string;
          list_id: string;
          title_id: string;
          title_type: string;
        };
        Insert: {
          added_at?: string | null;
          id?: string;
          list_id: string;
          title_id: string;
          title_type: string;
        };
        Update: {
          added_at?: string | null;
          id?: string;
          list_id?: string;
          title_id?: string;
          title_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey";
            columns: ["list_id"];
            isOneToOne: false;
            referencedRelation: "lists";
            referencedColumns: ["id"];
          }
        ];
      };
      lists: {
        Row: {
          created_at: string | null;
          id: string;
          is_public: boolean | null;
          name: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_public?: boolean | null;
          name: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_public?: boolean | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lists_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          country_code: string | null;
          created_at: string | null;
          display_name: string | null;
          email: string | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          country_code?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          id: string;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          country_code?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_providers: {
        Row: {
          created_at: string | null;
          id: string;
          provider_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          provider_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          provider_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_providers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type DefaultSchema = Database["public"];

export type Tables<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Row"];
export type TablesInsert<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Insert"];
export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Update"];
