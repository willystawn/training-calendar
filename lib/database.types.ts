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
      events: {
        Row: {
          id: number;
          shortName: string;
          fullName: string;
          trainer: string;
          startDate: string;
          endDate: string;
          color: string;
          textColor: string;
          created_at: string;
          category: string;
        };
        Insert: {
          id?: number;
          shortName: string;
          fullName: string;
          trainer: string;
          startDate: string;
          endDate: string;
          color: string;
          textColor: string;
          created_at?: string;
          category: string;
        };
        Update: {
          id?: number;
          shortName?: string;
          fullName?: string;
          trainer?: string;
          startDate?: string;
          endDate?: string;
          color?: string;
          textColor?: string;
          created_at?: string;
          category?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
