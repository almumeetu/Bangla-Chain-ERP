/**
 * Bangla-Chain ERP — Centralized Zod Validation Schemas
 *
 * All API inputs MUST be validated against one of these schemas
 * before being processed. Never trust client-supplied data.
 *
 * Pattern: validate → sanitize → process
 */

import { z } from 'zod';

// ── Primitives ─────────────────────────────────────────────────────────────────

/** Non-empty text, trimmed */
const NonEmptyStr = z.string().min(1).trim();

/** Positive number (price, qty) */
const PositiveNum = z.number().min(0);

/** Valid UUID */
const UUID = z.string().uuid();

/** Valid date string (YYYY-MM-DD) */
const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD.');

/** Amount > 0 */
const PositiveAmount = z.number().positive('Amount must be greater than zero.');

// ── SR Authentication ──────────────────────────────────────────────────────────

export const SrLoginSchema = z.object({
  username: NonEmptyStr.max(100),
  password: NonEmptyStr.max(200),
  owner_id: z.string().uuid('Invalid owner ID.').optional(),
});

export type SrLoginInput = z.infer<typeof SrLoginSchema>;

// ── Send Invoice ───────────────────────────────────────────────────────────────

export const InvoiceItemSchema = z.object({
  productName: NonEmptyStr.max(300),
  company: z.string().max(200).optional().default(''),
  attribute: z.string().max(200).optional().default(''),
  qty: z.number().min(0),
  bonusQty: z.number().min(0).default(0),
  totalQty: z.number().min(0).default(0),
  rate: z.number().min(0),
  totalAmount: z.number(),
  returnedQty: z.number().min(0).default(0),
  damagedQty: z.number().min(0).default(0),
  selectedUnitName: z.string().max(50).optional().default('Pcs'),
});

export const SendInvoiceSchema = z.object({
  challanId: NonEmptyStr,
  companyName: z.string().max(200).optional().default(''),
  srName: z.string().max(200).optional().default(''),
  deliveryManName: z.string().max(200).optional().default(''),
  routeName: z.string().max(200).optional().default(''),
  customerName: z.string().max(200).default('Valued Customer'),
  customerEmail: z.string().email('Invalid customer email.').optional().or(z.literal('')).or(z.null()),
  deliveryDate: z.string().optional(),
  orderDate: z.string().optional(),
  status: z.string().max(50).optional().default('Delivered'),
  shopName: z.string().max(200).default('Bangla Chain ERP'),
  shopSubBrand: z.string().max(200).default(''),
  totalAmount: z.number(),
  grossAmount: z.number().optional(),
  commissionAmount: z.number().optional(),
  extraProfitAmount: z.number().optional(),
  items: z.array(InvoiceItemSchema).optional(),
  // Single-item fallback fields for backwards compatibility
  productName: z.string().max(300).optional(),
  qty: z.number().min(0).optional(),
  bonusQty: z.number().min(0).default(0),
  totalQty: z.number().min(0).optional(),
  rate: z.number().min(0).optional(),
  selectedUnitName: z.string().max(50).optional(),
  returnedQty: z.number().min(0).default(0),
  damagedQty: z.number().min(0).default(0),
});

export type SendInvoiceInput = z.infer<typeof SendInvoiceSchema>;

// ── Challan Creation ───────────────────────────────────────────────────────────

export const CreateChallanSchema = z.object({
  id: NonEmptyStr,
  product_id: z.string().max(100).optional(),
  product_name: NonEmptyStr.max(300),
  company: z.string().max(200).default(''),
  attribute: z.string().max(200).default(''),
  qty: PositiveNum,
  bonus_qty: z.number().min(0).default(0),
  total_qty: PositiveNum,
  rate: PositiveNum,
  total_amount: PositiveNum,
  sr_name: NonEmptyStr.max(200),
  route_name: z.string().max(200).default(''),
  delivery_man_name: z.string().max(200).default(''),
  customer_id: z.string().max(100).optional(),
  customer_name: z.string().max(200).optional(),
  selected_unit_name: z.string().max(50).optional(),
  sr_commission_type: z.string().max(50).optional(),
  sr_commission_value: z.number().min(0).optional(),
  purchase_price: z.number().min(0).default(0),
  cartons_qty: z.number().min(0).default(0),
  pcs_qty: z.number().min(0).default(0),
});

export type CreateChallanInput = z.infer<typeof CreateChallanSchema>;

// ── Challan Delivery Settlement ────────────────────────────────────────────────

export const DeliverChallanSchema = z.object({
  challan_id: NonEmptyStr,
  settlement_status: z.enum(['Delivered', 'Shipped']),
  returned_qty: z.number().min(0).default(0),
  damaged_qty: z.number().min(0).default(0),
  returned_cartons: z.number().min(0).default(0),
  returned_pcs: z.number().min(0).default(0),
  damaged_cartons: z.number().min(0).default(0),
  damaged_pcs: z.number().min(0).default(0),
  sr_commission_amount: z.number().min(0).default(0),
  extra_profit_amount: z.number().min(0).default(0),
  idempotency_key: z.string().max(100).optional(),
});

export type DeliverChallanInput = z.infer<typeof DeliverChallanSchema>;

// ── Procurement ────────────────────────────────────────────────────────────────

export const ProcurementItemSchema = z.object({
  product_id: NonEmptyStr,
  product_name: z.string().max(300).default(''),
  purchase_price: PositiveNum,
  mrp: PositiveNum,
  wsp: PositiveNum,
  qty: z.number().positive('Quantity must be greater than zero.'),
  bonus_qty: z.number().min(0).default(0),
  discount_type: z.enum(['Flat', 'Percent']).default('Flat'),
  discount_value: z.number().min(0).default(0),
  total_price: PositiveNum,
});

export const CreateProcurementSchema = z.object({
  id: NonEmptyStr,
  supplier_name: NonEmptyStr.max(200),
  procurement_name: z.string().max(200).default(''),
  invoice_ref: z.string().max(100).default(''),
  invoice_date: DateStr,
  delivery_date: DateStr,
  payment_status: z.enum(['Paid', 'Pending', 'Partial']),
  additional_cost: z.number().min(0).default(0),
  global_total: PositiveAmount,
  items: z.array(ProcurementItemSchema).min(1, 'At least one item is required.'),
  idempotency_key: z.string().max(100).optional(),
});

export type CreateProcurementInput = z.infer<typeof CreateProcurementSchema>;

// ── Stock Adjustment ───────────────────────────────────────────────────────────

export const StockAdjustmentSchema = z.object({
  id: NonEmptyStr,
  product_id: NonEmptyStr,
  product_name: NonEmptyStr.max(300),
  new_qty: z.number().min(0, 'স্টক ০ এর নিচে যেতে পারবে না।'),
  reason: NonEmptyStr.max(500),
  adjusted_by: z.string().max(200).default('Admin'),
});

export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;

// ── Customer ───────────────────────────────────────────────────────────────────

export const CreateCustomerSchema = z.object({
  id: NonEmptyStr,
  name: NonEmptyStr.max(200),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  market: z.string().max(200).optional(),
  assigned_sr: z.string().max(200).optional(),
  route_id: z.string().max(100).optional(),
  credit_limit: z.number().min(0).optional(),
  credit_days: z.number().min(0).int().optional(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

// ── Expense ────────────────────────────────────────────────────────────────────

export const CreateExpenseSchema = z.object({
  id: NonEmptyStr,
  category_id: NonEmptyStr,
  category_name: NonEmptyStr.max(200),
  amount: PositiveAmount,
  expense_date: DateStr,
  notes: z.string().max(1000).optional(),
  paid_to: z.string().max(200).optional(),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

// ── Product ────────────────────────────────────────────────────────────────────

export const CreateProductSchema = z.object({
  id: NonEmptyStr,
  name: NonEmptyStr.max(300),
  sku: z.string().max(100).default(''),
  company: z.string().max(200).default(''),
  category_id: z.string().max(100).optional(),
  uom_id: z.string().max(100).optional(),
  default_godown_id: z.string().max(100).optional(),
  default_pp: z.number().min(0).default(0),
  default_mrp: z.number().min(0).default(0),
  default_wsp: z.number().min(0).default(0),
  current_stock: z.number().min(0).default(0),
  carton_size: z.number().min(1).int().default(1),
  price_per_carton: z.number().min(0).default(0),
  price_per_piece: z.number().min(0).default(0),
  primary_unit: z.enum(['Carton', 'Pcs', 'Custom']).default('Pcs'),
  stock_alert_threshold: z.number().min(0).default(0),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

// ── Claim ──────────────────────────────────────────────────────────────────────

export const CreateClaimSchema = z.object({
  id: NonEmptyStr,
  claim_date: DateStr,
  company_id: NonEmptyStr,
  company_name: NonEmptyStr.max(200),
  sr_id: NonEmptyStr,
  sr_name: NonEmptyStr.max(200),
  product_id: NonEmptyStr,
  product_name: NonEmptyStr.max(300),
  qty: z.number().positive(),
  reason: NonEmptyStr.max(500),
  notes: z.string().max(1000).optional(),
  type: z.enum(['Damage', 'Expiry', 'Shortage', 'Return', 'Other']).default('Damage'),
  claim_value: z.number().min(0).default(0),
});

export type CreateClaimInput = z.infer<typeof CreateClaimSchema>;

// ── Claim Settlement ───────────────────────────────────────────────────────────

export const ClaimSettlementSchema = z.object({
  id: NonEmptyStr,
  settlement_date: DateStr,
  month_key: z.string().max(7),
  company_id: NonEmptyStr,
  company_name: NonEmptyStr.max(200),
  amount: PositiveAmount,
  payment_mode: z.enum(['Cash', 'Bank Transfer', 'Cheque', 'Mobile Banking']),
  reference_no: z.string().max(100).default(''),
  notes: z.string().max(1000).optional(),
  recorded_at: z.string(),
});

export type ClaimSettlementInput = z.infer<typeof ClaimSettlementSchema>;

// ── SR Management ──────────────────────────────────────────────────────────────

export const CreateSrSchema = z.object({
  id: NonEmptyStr,
  name: NonEmptyStr.max(200),
  phone: z.string().max(20).default(''),
  commission_rate: z.number().min(0).max(100).default(0),
  assigned_company_ids: z.array(z.string()).default([]),
  login_username: z.string().max(100).optional(),
  login_password: z.string().min(8, 'Password must be at least 8 characters.').max(200).optional(),
});

export type CreateSrInput = z.infer<typeof CreateSrSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Parse and return typed data, or throw a descriptive validation error.
 * Use in API routes:
 *   const data = parseOrThrow(SrLoginSchema, await request.json());
 */
export function parseOrThrow<TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema,
  input: unknown
): z.output<TSchema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const firstError = Object.entries(errors)
      .map(([field, msgs]) => `${field}: ${((msgs as string[]) || []).join(', ')}`)
      .join('; ');
    throw new ValidationError(firstError || 'Validation failed.', errors as Record<string, string[] | undefined>);
  }
  return result.data;
}

/**
 * Custom validation error class for structured error responses.
 */
export class ValidationError extends Error {
  public readonly fieldErrors: Record<string, string[] | undefined>;

  constructor(message: string, fieldErrors: Record<string, string[] | undefined> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}
