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
          password_hash: string | null;
          is_active: boolean;
          last_login_at: string | null;
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
          password_hash?: string | null;
          is_active?: boolean;
          last_login_at?: string | null;
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
          phone: string | null;
          assigned_company_ids: string[] | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          vehicle?: string;
          phone?: string | null;
          assigned_company_ids?: string[] | null;
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
          symbol: string | null;
          multiplier: number;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          symbol?: string | null;
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
          assigned_delivery_man_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          area?: string;
          territory?: string;
          assigned_sr_id?: string | null;
          assigned_delivery_man_id?: string | null;
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
          custom_units: Json | null;
          damage_history: Json | null;
          carton_size: number;
          price_per_carton: number;
          price_per_piece: number;
          primary_unit: string;
          stock_alert_threshold: number;
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
          custom_units?: Json | null;
          damage_history?: Json | null;
          carton_size?: number;
          price_per_carton?: number;
          price_per_piece?: number;
          primary_unit?: string;
          stock_alert_threshold?: number;
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
          customer_id: string | null;
          customer_name: string | null;
          returned_cartons: number | null;
          returned_pcs: number | null;
          damaged_cartons: number | null;
          damaged_pcs: number | null;
          extra_profit_amount: number | null;
          selected_unit_name: string | null;
          sr_commission_type: string | null;
          sr_commission_value: number | null;
          sr_commission_amount: number | null;
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
          customer_id?: string | null;
          customer_name?: string | null;
          returned_cartons?: number | null;
          returned_pcs?: number | null;
          damaged_cartons?: number | null;
          damaged_pcs?: number | null;
          extra_profit_amount?: number | null;
          selected_unit_name?: string | null;
          sr_commission_type?: string | null;
          sr_commission_value?: number | null;
          sr_commission_amount?: number | null;
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
          email: string | null;
          address: string | null;
          market: string | null;
          assigned_sr: string | null;
          route_id: string | null;
          credit_limit: number | null;
          credit_days: number | null;
          due: number | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          market?: string | null;
          assigned_sr?: string | null;
          route_id?: string | null;
          credit_limit?: number | null;
          credit_days?: number | null;
          due?: number | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };

      claims: {
        Row: {
          id: string;
          owner_id: string;
          claim_date: string;
          company_id: string;
          company_name: string;
          sr_id: string;
          sr_name: string;
          product_id: string;
          product_name: string;
          qty: number;
          reason: string;
          notes: string | null;
          status: string;
          type: string;
          claim_value: number;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          claim_date: string;
          company_id: string;
          company_name: string;
          sr_id: string;
          sr_name: string;
          product_id: string;
          product_name: string;
          qty?: number;
          reason?: string;
          notes?: string | null;
          status?: string;
          type?: string;
          claim_value?: number;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['claims']['Insert']>;
      };

      claim_settlements: {
        Row: {
          id: string;
          owner_id: string;
          settlement_date: string;
          month_key: string;
          company_id: string;
          company_name: string;
          amount: number;
          payment_mode: string;
          reference_no: string;
          notes: string | null;
          recorded_at: string;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          settlement_date: string;
          month_key: string;
          company_id: string;
          company_name: string;
          amount?: number;
          payment_mode: string;
          reference_no?: string;
          notes?: string | null;
          recorded_at: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['claim_settlements']['Insert']>;
      };

      claim_reasons: {
        Row: {
          id: string;
          owner_id: string;
          label: string;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          label: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['claim_reasons']['Insert']>;
      };

      // ─── NEW PRODUCTION TABLES ───────────────────────────────────────────────

      suppliers: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          contact_person: string;
          phone: string;
          address: string;
          email: string;
          payable: number;
          total_purchases: number;
          total_paid: number;
          is_active: boolean;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          contact_person?: string;
          phone?: string;
          address?: string;
          email?: string;
          payable?: number;
          total_purchases?: number;
          total_paid?: number;
          is_active?: boolean;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>;
      };

      stock_ledger: {
        Row: {
          id: string;
          owner_id: string;
          product_id: string;
          product_name: string;
          transaction_type: string;
          reference_type: string;
          reference_id: string;
          quantity_in: number;
          quantity_out: number;
          balance_after: number;
          unit: string;
          notes: string | null;
          created_by: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          product_id: string;
          product_name?: string;
          transaction_type: string;
          reference_type?: string;
          reference_id?: string;
          quantity_in?: number;
          quantity_out?: number;
          balance_after?: number;
          unit?: string;
          notes?: string | null;
          created_by?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['stock_ledger']['Insert']>;
      };

      accounts: {
        Row: {
          id: string;
          owner_id: string;
          code: string;
          name: string;
          account_type: string;
          balance: number;
          is_system: boolean;
          is_active: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          code: string;
          name: string;
          account_type: string;
          balance?: number;
          is_system?: boolean;
          is_active?: boolean;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>;
      };

      journal_entries: {
        Row: {
          id: string;
          owner_id: string;
          entry_date: string;
          reference_type: string;
          reference_id: string;
          description: string;
          is_void: boolean;
          voided_at: string | null;
          voided_by: string | null;
          void_reason: string | null;
          created_by: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          entry_date?: string;
          reference_type?: string;
          reference_id?: string;
          description?: string;
          is_void?: boolean;
          voided_at?: string | null;
          voided_by?: string | null;
          void_reason?: string | null;
          created_by?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['journal_entries']['Insert']>;
      };

      journal_entry_lines: {
        Row: {
          id: string;
          journal_entry_id: string;
          owner_id: string;
          account_id: string;
          account_code: string;
          account_name: string;
          debit: number;
          credit: number;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          journal_entry_id: string;
          owner_id: string;
          account_id: string;
          account_code?: string;
          account_name?: string;
          debit?: number;
          credit?: number;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['journal_entry_lines']['Insert']>;
      };

      audit_logs: {
        Row: {
          id: string;
          owner_id: string;
          user_id: string;
          action: string;
          module: string;
          entity_type: string;
          entity_id: string;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string;
          user_agent: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          user_id?: string;
          action: string;
          module?: string;
          entity_type?: string;
          entity_id?: string;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string;
          user_agent?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };

      customer_payments: {
        Row: {
          id: string;
          owner_id: string;
          customer_id: string;
          amount: number;
          payment_date: string;
          payment_mode: string;
          reference_no: string | null;
          notes: string | null;
          created_by: string;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          customer_id: string;
          amount: number;
          payment_date?: string;
          payment_mode?: string;
          reference_no?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['customer_payments']['Insert']>;
      };

      supplier_payments: {
        Row: {
          id: string;
          owner_id: string;
          supplier_name: string;
          amount: number;
          payment_date: string;
          payment_mode: string;
          reference_no: string | null;
          notes: string | null;
          created_by: string;
          created_at: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          supplier_name?: string;
          amount: number;
          payment_date?: string;
          payment_mode?: string;
          reference_no?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['supplier_payments']['Insert']>;
      };

      transaction_idempotency: {
        Row: {
          idempotency_key: string;
          owner_id: string;
          result: Json;
          created_at: string | null;
        };
        Insert: {
          idempotency_key: string;
          owner_id: string;
          result: Json;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['transaction_idempotency']['Insert']>;
      };
    };

    Views: Record<string, never>;

    Functions: {
      initialize_default_accounts: {
        Args: { p_owner_id: string };
        Returns: void;
      };
      get_product_stock: {
        Args: { p_owner_id: string; p_product_id: string };
        Returns: number;
      };
      get_dashboard_stats: {
        Args: { p_owner_id: string; p_date?: string };
        Returns: {
          today_sales: number;
          today_purchases: number;
          today_expenses: number;
          today_profit: number;
          total_receivable: number;
          inventory_value_tp: number;
          pending_challans: number;
          shipped_challans: number;
          delivered_challans: number;
          month_sales: number;
          month_purchases: number;
          month_profit: number;
        };
      };
      process_challan_delivery: {
        Args: {
          p_challan_id: string;
          p_owner_id: string;
          p_user_id: string;
          p_settlement_status: string;
          p_returned_qty?: number;
          p_damaged_qty?: number;
          p_returned_cartons?: number;
          p_returned_pcs?: number;
          p_damaged_cartons?: number;
          p_damaged_pcs?: number;
          p_sr_commission_amount?: number;
          p_extra_profit_amount?: number;
          p_idempotency_key?: string;
        };
        Returns: {
          success: boolean;
          challan_id?: string;
          status?: string;
          error?: string;
          message?: string;
        };
      };
      process_procurement: {
        Args: {
          p_procurement_id: string;
          p_owner_id: string;
          p_user_id: string;
          p_supplier_name: string;
          p_procurement_name: string;
          p_invoice_ref: string;
          p_invoice_date: string;
          p_delivery_date: string;
          p_payment_status: string;
          p_additional_cost: number;
          p_global_total: number;
          p_items: unknown;
          p_idempotency_key?: string;
        };
        Returns: {
          success: boolean;
          procurement_id?: string;
          error?: string;
          message?: string;
        };
      };
      process_stock_adjustment: {
        Args: {
          p_adjustment_id: string;
          p_owner_id: string;
          p_user_id: string;
          p_product_id: string;
          p_product_name: string;
          p_old_qty: number;
          p_new_qty: number;
          p_reason: string;
          p_adjusted_by: string;
        };
        Returns: {
          success: boolean;
          adjustment_id?: string;
          old_qty?: number;
          new_qty?: number;
          qty_changed?: number;
          error?: string;
          message?: string;
        };
      };
    };

    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
