/**
 * Bangla-Chain ERP — Supabase Database Type Definitions
 *
 * This file mirrors the schema in /supabase/schema.sql
 * Auto-generate anytime with:
 *   npx supabase gen types typescript --project-id rcxkszqimhxzcbiehbvx > src/lib/supabase.types.ts
 */

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
      settings: {
        Row: {
          id: string;
          owner_id: string;
          shop_name: string;
          shop_subbrand: string;
          shop_logo: string | null;
          language: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          shop_name?: string;
          shop_subbrand?: string;
          shop_logo?: string | null;
          language?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['settings']['Insert']>;
      };

      srs: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          phone: string;
          commission_rate: number;
          assigned_company_ids: string[];
          login_username: string | null;
          login_password: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          phone?: string;
          commission_rate?: number;
          assigned_company_ids?: string[];
          login_username?: string | null;
          login_password?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['srs']['Insert']>;
      };

      delivery_men: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          vehicle: string;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          vehicle?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['delivery_men']['Insert']>;
      };

      companies: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          contact_person: string | null;
          phone: string | null;
          address: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          contact_person?: string | null;
          phone?: string | null;
          address?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
      };

      product_categories: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          description?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['product_categories']['Insert']>;
      };

      units: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          multiplier: number;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          multiplier?: number;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['units']['Insert']>;
      };

      godowns: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          location: string | null;
          is_damage_godown: boolean;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          location?: string | null;
          is_damage_godown?: boolean;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['godowns']['Insert']>;
      };

      routes: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          area: string;
          territory: string;
          assigned_sr_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          area?: string;
          territory?: string;
          assigned_sr_id?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['routes']['Insert']>;
      };

      product_attributes: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          type: string;
          value: string;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          type?: string;
          value?: string;
          status?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['product_attributes']['Insert']>;
      };

      products: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          sku: string;
          company: string;
          category_id: string | null;
          uom_id: string | null;
          default_godown_id: string | null;
          default_pp: number;
          default_mrp: number;
          default_wsp: number;
          current_stock: number;
          damaged_stock: number;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          sku?: string;
          company?: string;
          category_id?: string | null;
          uom_id?: string | null;
          default_godown_id?: string | null;
          default_pp?: number;
          default_mrp?: number;
          default_wsp?: number;
          current_stock?: number;
          damaged_stock?: number;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };

      challans: {
        Row: {
          id: string;
          owner_id: string;
          product_name: string;
          company: string;
          attribute: string;
          qty: number;
          bonus_qty: number;
          total_qty: number;
          rate: number;
          total_amount: number;
          sr_name: string;
          route_name: string;
          delivery_man_name: string;
          status: string;
          returned_qty: number;
          damaged_qty: number;
          commission_amount: number;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          product_name?: string;
          company?: string;
          attribute?: string;
          qty?: number;
          bonus_qty?: number;
          total_qty?: number;
          rate?: number;
          total_amount?: number;
          sr_name?: string;
          route_name?: string;
          delivery_man_name?: string;
          status?: string;
          returned_qty?: number;
          damaged_qty?: number;
          commission_amount?: number;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['challans']['Insert']>;
      };

      procurements: {
        Row: {
          id: string;
          owner_id: string;
          supplier_name: string;
          procurement_name: string;
          invoice_ref: string;
          invoice_date: string;
          delivery_date: string;
          payment_status: string;
          additional_cost: number;
          global_total: number;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          supplier_name?: string;
          procurement_name?: string;
          invoice_ref?: string;
          invoice_date?: string;
          delivery_date?: string;
          payment_status?: string;
          additional_cost?: number;
          global_total?: number;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['procurements']['Insert']>;
      };

      procurement_items: {
        Row: {
          id: string;
          procurement_id: string;
          product_id: string;
          product_name: string;
          purchase_price: number;
          mrp: number;
          wsp: number;
          qty: number;
          bonus_qty: number;
          discount_type: string;
          discount_value: number;
          total_price: number;
          created_at: string | null;
        };
        Insert: {
          id: string;
          procurement_id: string;
          product_id?: string;
          product_name?: string;
          purchase_price?: number;
          mrp?: number;
          wsp?: number;
          qty?: number;
          bonus_qty?: number;
          discount_type?: string;
          discount_value?: number;
          total_price?: number;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['procurement_items']['Insert']>;
      };

      stock_adjustments: {
        Row: {
          id: string;
          owner_id: string;
          product_id: string;
          product_name: string;
          attribute_value: string;
          old_qty: number;
          new_qty: number;
          qty_changed: number;
          adjusted_by: string;
          reason: string;
          date: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          product_id?: string;
          product_name?: string;
          attribute_value?: string;
          old_qty?: number;
          new_qty?: number;
          qty_changed?: number;
          adjusted_by?: string;
          reason?: string;
          date?: string | null;
        };
        Update: Partial<Database['public']['Tables']['stock_adjustments']['Insert']>;
      };

      expense_categories: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          description?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['expense_categories']['Insert']>;
      };

      expenses: {
        Row: {
          id: string;
          owner_id: string;
          category_id: string;
          category_name: string;
          amount: number;
          expense_date: string;
          notes: string | null;
          paid_to: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          category_id?: string;
          category_name?: string;
          amount?: number;
          expense_date?: string;
          notes?: string | null;
          paid_to?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };

      customers: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          phone: string | null;
          address: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name?: string;
          phone?: string | null;
          address?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
