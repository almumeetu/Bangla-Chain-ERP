'use client';

/**
 * Bangla-Chain ERP — useAtomicMutation Hook
 *
 * A type-safe wrapper for calling Supabase RPC functions that:
 *  1. Generates an idempotency key to prevent duplicate submissions
 *  2. Shows loading state during the call
 *  3. Returns structured success/error results
 *  4. Prevents concurrent duplicate calls (button double-click protection)
 *
 * Usage:
 *   const { mutate, isLoading, error } = useAtomicMutation('process_challan_delivery');
 *   const result = await mutate({ p_challan_id: '...', ... });
 */

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AtomicResult<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UseAtomicMutationOptions {
  /** 
   * If true, generates a new idempotency key on each call.
   * Set to false for operations that can safely be retried (e.g., reads).
   * Default: true
   */
  useIdempotency?: boolean;

  /**
   * Callback invoked after a successful mutation.
   */
  onSuccess?: (result: AtomicResult) => void;

  /**
   * Callback invoked after a failed mutation.
   */
  onError?: (error: string) => void;
}

// ── Idempotency Key Generator ──────────────────────────────────────────────────

function generateIdempotencyKey(rpcName: string, args: Record<string, any>): string {
  // Create a stable key from: function name + critical args + timestamp
  // This prevents duplicate submissions within the same ~hour
  const timestamp = Math.floor(Date.now() / 3_600_000); // Hourly bucket
  const primaryKey = args.p_challan_id || args.p_procurement_id || args.p_adjustment_id || '';
  return `${rpcName}:${primaryKey}:${timestamp}`;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAtomicMutation<TArgs extends Record<string, any> = Record<string, any>>(
  rpcName: string,
  options: UseAtomicMutationOptions = {}
) {
  const { useIdempotency = true, onSuccess, onError } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AtomicResult | null>(null);

  // Prevents concurrent calls — ref to avoid stale closures
  const isInFlight = useRef(false);

  const mutate = useCallback(
    async (args: TArgs): Promise<AtomicResult> => {
      // ── Prevent double-click / concurrent calls ─────────────────────────────
      if (isInFlight.current) {
        return {
          success: false,
          error: 'IN_FLIGHT',
          message: 'একটি অপারেশন ইতোমধ্যে চলছে। অনুগ্রহ করে অপেক্ষা করুন।',
        };
      }

      isInFlight.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // ── Attach idempotency key ────────────────────────────────────────────
        const rpcArgs = useIdempotency
          ? { ...args, p_idempotency_key: generateIdempotencyKey(rpcName, args as Record<string, unknown>) }
          : args;

        const { data, error: rpcError } = await (supabase.rpc as any)(rpcName, rpcArgs);

        if (rpcError) {
          const errorMessage = rpcError.message || 'Database operation failed.';
          setError(errorMessage);
          onError?.(errorMessage);
          const failResult: AtomicResult = { success: false, error: 'RPC_ERROR', message: errorMessage };
          setLastResult(failResult);
          return failResult;
        }

        // ── Handle RPC-returned error (structured JSONB response) ─────────────
        const result = data as AtomicResult;
        if (!result?.success) {
          const errorMessage = result?.message || 'অপারেশন সফল হয়নি।';
          setError(errorMessage);
          onError?.(errorMessage);
          setLastResult(result);
          return result;
        }

        // ── Success ───────────────────────────────────────────────────────────
        setLastResult(result);
        onSuccess?.(result);
        return result;

      } catch (err) {
        const message = err instanceof Error
          ? err.message
          : 'নেটওয়ার্ক ত্রুটি। ইন্টারনেট সংযোগ পরীক্ষা করুন।';
        setError(message);
        onError?.(message);
        const failResult: AtomicResult = { success: false, error: 'NETWORK_ERROR', message };
        setLastResult(failResult);
        return failResult;
      } finally {
        isInFlight.current = false;
        setIsLoading(false);
      }
    },
    [rpcName, useIdempotency, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setError(null);
    setLastResult(null);
  }, []);

  return {
    mutate,
    isLoading,
    error,
    lastResult,
    reset,
  };
}

// ── Pre-built Mutation Hooks ───────────────────────────────────────────────────
// These are convenience wrappers with correct argument types.

export interface ChallanDeliveryArgs {
  p_challan_id: string;
  p_owner_id: string;
  p_user_id: string;
  p_settlement_status: 'Delivered' | 'Shipped';
  p_returned_qty?: number;
  p_damaged_qty?: number;
  p_returned_cartons?: number;
  p_returned_pcs?: number;
  p_damaged_cartons?: number;
  p_damaged_pcs?: number;
  p_sr_commission_amount?: number;
  p_extra_profit_amount?: number;
}

export function useChallanDelivery(options?: UseAtomicMutationOptions) {
  return useAtomicMutation<ChallanDeliveryArgs>('process_challan_delivery', options);
}

export interface ProcurementArgs {
  p_procurement_id: string;
  p_owner_id: string;
  p_user_id: string;
  p_supplier_name: string;
  p_procurement_name: string;
  p_invoice_ref: string;
  p_invoice_date: string;
  p_delivery_date: string;
  p_payment_status: 'Paid' | 'Pending' | 'Partial';
  p_additional_cost: number;
  p_global_total: number;
  p_items: unknown[];
}

export function useProcurement(options?: UseAtomicMutationOptions) {
  return useAtomicMutation<ProcurementArgs>('process_procurement', options);
}

export interface StockAdjustmentArgs {
  p_adjustment_id: string;
  p_owner_id: string;
  p_user_id: string;
  p_product_id: string;
  p_product_name: string;
  p_old_qty: number;
  p_new_qty: number;
  p_reason: string;
  p_adjusted_by: string;
}

export function useStockAdjustment(options?: UseAtomicMutationOptions) {
  return useAtomicMutation<StockAdjustmentArgs>('process_stock_adjustment', options);
}
