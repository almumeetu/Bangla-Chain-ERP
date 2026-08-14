/**
 * Bangla-Chain ERP — Supabase Database Layer
 *
 * This replaces the localStorage shim (db.ts) with real Supabase calls.
 * All functions require the user to be authenticated (owner_id = auth.uid()).
 *
 * Usage:
 *   import { db } from '@/lib/supabase-db';
 *   const products = await db.products.getAll();
 */

import { supabase } from './supabase';
import type { Database } from './supabase.types';

type Tables = Database['public']['Tables'];

// ── Generic CRUD factory ───────────────────────────────────────────────────────

function makeTable<TRow extends { id: string }, TInsert extends object>(
  tableName: keyof Tables
) {
  const table = () => supabase.from(tableName as string);

  return {
    /** Fetch all rows for the current user (RLS auto-filters by owner_id) */
    async getAll(): Promise<TRow[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (table() as any).select('*').order('created_at', { ascending: false });

      if (error) {
        console.error(`[supabase-db] ${tableName}.getAll error:`, error.message);
        return [];
      }
      return (data ?? []) as TRow[];
    },

    /** Upsert a single row (insert or update based on id) */
    async upsert(row: TInsert & { id: string }): Promise<{ error: string | null }> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (table() as any).upsert(row);
      if (error) {
        console.error(`[supabase-db] ${tableName}.upsert error:`, error.message);
        return { error: error.message };
      }
      return { error: null };
    },

    /** Delete a row by id */
    async delete(id: string): Promise<{ error: string | null }> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (table() as any).delete().eq('id', id);
      if (error) {
        console.error(`[supabase-db] ${tableName}.delete error:`, error.message);
        return { error: error.message };
      }
      return { error: null };
    },

    /** Fetch a single row by id */
    async getById(id: string): Promise<TRow | null> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (table() as any).select('*').eq('id', id).single();

      if (error) {
        console.error(`[supabase-db] ${tableName}.getById error:`, error.message);
        return null;
      }
      return data as TRow;
    },
  };
}

// ── Database namespace ─────────────────────────────────────────────────────────

export const db = {
  /** Shop settings (one per admin user) */
  settings: {
    async get(): Promise<Tables['settings']['Row'] | null> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('settings') as any).select('*').single();

      if (error) {
        if (error.code !== 'PGRST116') {
          // PGRST116 = no rows found (expected for new users)
          console.error('[supabase-db] settings.get error:', error.message);
        }
        return null;
      }
      return data as Tables['settings']['Row'];
    },

    async upsert(row: Tables['settings']['Insert']): Promise<{ error: string | null }> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('settings') as any).upsert(row);
      if (error) return { error: error.message };
      return { error: null };
    },
  },

  /** Sales Representatives */
  srs: makeTable<Tables['srs']['Row'], Tables['srs']['Insert']>('srs'),

  /** Delivery Men */
  deliveryMen: makeTable<Tables['delivery_men']['Row'], Tables['delivery_men']['Insert']>(
    'delivery_men'
  ),

  /** Companies / Brands */
  companies: makeTable<Tables['companies']['Row'], Tables['companies']['Insert']>('companies'),

  /** Product Categories */
  productCategories: makeTable<
    Tables['product_categories']['Row'],
    Tables['product_categories']['Insert']
  >('product_categories'),

  /** Units of Measure */
  units: makeTable<Tables['units']['Row'], Tables['units']['Insert']>('units'),

  /** Godowns / Warehouses */
  godowns: makeTable<Tables['godowns']['Row'], Tables['godowns']['Insert']>('godowns'),

  /** Routes */
  routes: makeTable<Tables['routes']['Row'], Tables['routes']['Insert']>('routes'),

  /** Product Attributes */
  productAttributes: makeTable<
    Tables['product_attributes']['Row'],
    Tables['product_attributes']['Insert']
  >('product_attributes'),

  /** Products */
  products: makeTable<Tables['products']['Row'], Tables['products']['Insert']>('products'),

  /** Challans (Delivery Challans) */
  challans: makeTable<Tables['challans']['Row'], Tables['challans']['Insert']>('challans'),

  /** Procurements */
  procurements: makeTable<Tables['procurements']['Row'], Tables['procurements']['Insert']>(
    'procurements'
  ),

  /** Procurement Items */
  procurementItems: makeTable<
    Tables['procurement_items']['Row'],
    Tables['procurement_items']['Insert']
  >('procurement_items'),

  /** Stock Adjustments */
  stockAdjustments: {
    /** Get all adjustments (newest first) */
    async getAll(): Promise<Tables['stock_adjustments']['Row'][]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('stock_adjustments') as any)
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('[supabase-db] stockAdjustments.getAll error:', error.message);
        return [];
      }
      return (data ?? []) as Tables['stock_adjustments']['Row'][];
    },

    /** Insert a new stock adjustment record */
    async insert(
      row: Tables['stock_adjustments']['Insert']
    ): Promise<{ error: string | null }> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('stock_adjustments') as any).insert(row);
      if (error) return { error: error.message };
      return { error: null };
    },
  },

  /** Expense Categories */
  expenseCategories: makeTable<
    Tables['expense_categories']['Row'],
    Tables['expense_categories']['Insert']
  >('expense_categories'),

  /** Expenses */
  expenses: makeTable<Tables['expenses']['Row'], Tables['expenses']['Insert']>('expenses'),

  /** Customers */
  customers: makeTable<Tables['customers']['Row'], Tables['customers']['Insert']>('customers'),

  /** Claims */
  claims: makeTable<Tables['claims']['Row'], Tables['claims']['Insert']>('claims'),

  /** Claim Settlements */
  claimSettlements: makeTable<
    Tables['claim_settlements']['Row'],
    Tables['claim_settlements']['Insert']
  >('claim_settlements'),

  /** Claim Reasons */
  claimReasons: makeTable<
    Tables['claim_reasons']['Row'],
    Tables['claim_reasons']['Insert']
  >('claim_reasons'),
};

// ── SR Login (username/password — not Supabase Auth) ──────────────────────────

/**
 * SR users log in with username + password (stored in the srs table).
 * This is separate from Supabase Auth (which is for admin users only).
 */
export async function srLogin(
  username: string,
  password: string
): Promise<Tables['srs']['Row'] | null> {
  const { data, error } = await supabase
    .from('srs')
    .select('*')
    .eq('login_username', username)
    .eq('login_password', password)
    .single();

  if (error || !data) {
    return null;
  }
  return data;
}

// ── Real-time subscriptions ────────────────────────────────────────────────────

/**
 * Subscribe to real-time changes on any table.
 *
 * @example
 * const unsubscribe = subscribeToTable('products', (payload) => {
 *   console.log('Product changed:', payload);
 *   refetchProducts();
 * });
 * // Cleanup:
 * unsubscribe();
 */
export function subscribeToTable(
  tableName: keyof Tables,
  callback: (payload: unknown) => void
): () => void {
  const channel = supabase
    .channel(`realtime:${tableName}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName as string },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ── Storage Helpers ────────────────────────────────────────────────────────────

/**
 * Upload a file to Supabase Storage.
 *
 * @example
 * const url = await uploadFile('logos', file, `${userId}/logo.png`);
 */
export async function uploadFile(
  bucket: string,
  file: File,
  path: string
): Promise<string | null> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    console.error('[supabase-db] uploadFile error:', error.message);
    return null;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
