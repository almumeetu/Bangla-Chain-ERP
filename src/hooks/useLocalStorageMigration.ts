import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useLocalStorageMigration() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const migrate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated with Supabase. Please sign in first.');
      const ownerId = user.id;

      // Helper function to read from localStorage
      const readLocal = <T>(key: string): T[] => {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
      };

      // Helper for generic tables
      const uploadTable = async (localKey: string, dbTable: string, mapper: (item: any) => any) => {
        const items = readLocal(localKey);
        if (items.length === 0) return;
        
        setProgress(`Migrating ${dbTable} (${items.length} records)...`);
        const formatted = items.map(item => ({ ...mapper(item), owner_id: ownerId }));
        
        const { error: uploadError } = await (supabase.from(dbTable as any) as any).upsert(formatted);
        if (uploadError) throw new Error(`Error uploading ${dbTable}: ${uploadError.message}`);
      };

      // 2. Begin migration sequence
      
      // Branding Settings
      setProgress('Migrating Settings...');
      if (typeof window !== 'undefined') {
        const localSettings = localStorage.getItem('erp_settings');
        if (localSettings) {
          const s = JSON.parse(localSettings);
          await (supabase.from('settings' as any) as any).upsert({
            owner_id: ownerId,
            shop_name: s.shopName || 'Samir Enterprise',
            shop_subbrand: s.shopSubBrand || 'Dhaka & Chittagong Regional Hub',
            shop_logo: s.shopLogo || '',
            language: s.language || 'en',
          });
        }
      }

      // Migrate Base Entities
      await uploadTable('erp_companies', 'companies', item => ({
        id: item.id,
        name: item.name,
        contact_person: item.contactPerson || '',
        phone: item.phone || '',
        address: item.address || '',
      }));

      await uploadTable('erp_product_categories', 'product_categories', item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
      }));

      await uploadTable('erp_units', 'units', item => ({
        id: item.id,
        name: item.name,
        symbol: item.symbol || 'PCS',
        multiplier: Number(item.multiplier || 1),
      }));

      await uploadTable('erp_godowns', 'godowns', item => ({
        id: item.id,
        name: item.name,
        location: item.location || '',
        is_damage_godown: !!item.isDamageGodown,
      }));

      await uploadTable('erp_attributes', 'product_attributes', item => ({
        id: item.id,
        name: item.name,
        type: item.type || '',
        value: item.value || '',
        status: item.status || 'Active',
      }));

      await uploadTable('erp_delivery_men', 'delivery_men', item => ({
        id: item.id,
        name: item.name,
        vehicle: item.vehicle || '',
        phone: item.phone || '',
        assigned_company_ids: item.assignedCompanyIds || [],
      }));

      await uploadTable('erp_expense_categories', 'expense_categories', item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
      }));

      await uploadTable('erp_customers', 'customers', item => ({
        id: item.id,
        name: item.name || '',
        phone: item.phone || '',
        address: item.address || '',
        market: item.market || '',
        assigned_sr: item.assignedSR || '',
        route_id: item.routeId || null,
        credit_limit: Number(item.creditLimit || 0),
        credit_days: Number(item.creditDays || 30),
        due: Number(item.due || 0),
      }));

      // Sales Officers (SRs)
      await uploadTable('erp_srs', 'srs', item => ({
        id: item.id,
        name: item.name,
        phone: item.phone || '',
        commission_rate: Number(item.commissionRate || 5),
        assigned_company_ids: item.assignedCompanyIds || [],
        login_username: item.loginUsername || null,
        login_password: item.loginPassword || null,
      }));

      // Routes
      await uploadTable('erp_routes', 'routes', item => ({
        id: item.id,
        name: item.name,
        area: item.area || '',
        territory: item.territory || '',
        assigned_sr_id: item.assignedSRId || null,
        assigned_delivery_man_id: item.assignedDeliveryManId || null,
      }));

      // Products
      await uploadTable('erp_products', 'products', item => ({
        id: item.id,
        name: item.name,
        sku: item.sku || '',
        company: item.company || '',
        category_id: item.categoryId || null,
        default_godown_id: item.defaultGodownId || null,
        default_pp: Number(item.defaultPP || 0),
        default_mrp: Number(item.defaultMRP || 0),
        default_wsp: Number(item.defaultWSP || 0),
        current_stock: Number(item.currentStock || 0),
        damaged_stock: Number(item.damagedStock || 0),
        custom_units: item.customUnits || [],
        damage_history: item.damageHistory || [],
        carton_size: Number(item.cartonSize || 1),
        price_per_carton: Number(item.pricePerCarton || 0),
        price_per_piece: Number(item.pricePerPiece || 0),
        primary_unit: item.primaryUnit || 'Piece',
        stock_alert_threshold: Number(item.stockAlertThreshold || 10),
      }));

      // Challans
      await uploadTable('erp_challans', 'challans', item => ({
        id: item.id,
        product_name: item.productName || '',
        company: item.company || '',
        attribute: item.attribute || '',
        qty: Number(item.qty || 0),
        bonus_qty: Number(item.bonusQty || 0),
        total_qty: Number(item.totalQty || 0),
        rate: Number(item.rate || 0),
        total_amount: Number(item.totalAmount || 0),
        sr_name: item.srName || '',
        route_name: item.routeName || '',
        delivery_man_name: item.deliveryManName || '',
        status: item.status || 'Pending',
        returned_qty: Number(item.returnedQty || 0),
        damaged_qty: Number(item.damagedQty || 0),
        commission_amount: Number(item.commissionAmount || 0),
        customer_id: item.customerId || null,
        customer_name: item.customerName || null,
        returned_cartons: Number(item.returnedCartons || 0),
        returned_pcs: Number(item.returnedPcs || 0),
        damaged_cartons: Number(item.damagedCartons || 0),
        damaged_pcs: Number(item.damagedPcs || 0),
        extra_profit_amount: Number(item.extraProfitAmount || 0),
        selected_unit_name: item.selectedUnitName || 'Piece',
        sr_commission_type: item.srCommissionType || 'Percentage',
        sr_commission_value: Number(item.srCommissionValue || 0),
        sr_commission_amount: Number(item.srCommissionAmount || 0),
        created_at: item.createdAt || new Date().toISOString(),
      }));

      // Procurements & Items
      setProgress('Migrating Procurements & Items...');
      const procurements = readLocal<any>('erp_procurements');
      for (const p of procurements) {
        // Insert parent
        await (supabase.from('procurements' as any) as any).upsert({
          id: p.id,
          owner_id: ownerId,
          supplier_name: p.supplierName || '',
          procurement_name: p.procurementName || '',
          invoice_ref: p.invoiceRef || '',
          invoice_date: p.invoiceDate || '',
          delivery_date: p.deliveryDate || '',
          payment_status: p.paymentStatus || 'Pending',
          additional_cost: Number(p.additionalCost || 0),
          global_total: Number(p.globalTotal || 0),
          created_at: p.createdAt || new Date().toISOString(),
        });

        // Insert children items
        if (p.items && p.items.length > 0) {
          const items = p.items.map((item: any) => ({
            id: item.id,
            procurement_id: p.id,
            product_id: item.productId || '',
            product_name: item.productName || '',
            purchase_price: Number(item.purchasePrice || 0),
            mrp: Number(item.mrp || 0),
            wsp: Number(item.wsp || 0),
            qty: Number(item.qty || 0),
            bonus_qty: Number(item.bonusQty || 0),
            discount_type: item.discountType || 'Flat',
            discount_value: Number(item.discountValue || 0),
            total_price: Number(item.totalPrice || 0),
          }));
          await (supabase.from('procurement_items' as any) as any).upsert(items);
        }
      }

      // Stock Adjustments
      await uploadTable('erp_adjustments', 'stock_adjustments', item => ({
        id: item.id,
        product_id: item.productId || '',
        product_name: item.productName || '',
        attribute_value: item.attributeValue || '',
        old_qty: Number(item.oldQty || 0),
        new_qty: Number(item.newQty || 0),
        qty_changed: Number(item.qtyChanged || 0),
        adjusted_by: item.adjustedBy || '',
        reason: item.reason || '',
        date: item.date || new Date().toISOString(),
      }));

      // Expenses
      await uploadTable('erp_expenses', 'expenses', item => ({
        id: item.id,
        category_id: item.categoryId || '',
        category_name: item.categoryName || '',
        amount: Number(item.amount || 0),
        expense_date: item.expenseDate || '',
        notes: item.notes || '',
        paid_to: item.paidTo || '',
        created_at: item.createdAt || new Date().toISOString(),
      }));

      // Claims
      await uploadTable('erp_claims', 'claims', item => ({
        id: item.id,
        claim_date: item.claimDate || '',
        company_id: item.companyId || '',
        company_name: item.companyName || '',
        sr_id: item.srId || '',
        sr_name: item.srName || '',
        product_id: item.productId || '',
        product_name: item.productName || '',
        qty: Number(item.qty || 0),
        reason: item.reason || '',
        notes: item.notes || '',
        status: item.status || 'Pending',
        type: item.type || 'Claim',
        claim_value: Number(item.claimValue || 0),
      }));

      // Claim Settlements
      await uploadTable('erp_claim_settlements', 'claim_settlements', item => ({
        id: item.id,
        settlement_date: item.settlementDate || '',
        month_key: item.monthKey || '',
        company_id: item.companyId || '',
        company_name: item.companyName || '',
        amount: Number(item.amount || 0),
        payment_mode: item.paymentMode || '',
        reference_no: item.referenceNo || '',
        notes: item.notes || '',
        recorded_at: item.recordedAt || '',
      }));

      // Claim Reasons
      await uploadTable('erp_claim_reasons', 'claim_reasons', item => ({
        id: item.id,
        label: item.label || '',
      }));

      setProgress('Migration complete! Updating offline indicators...');
      if (typeof window !== 'undefined') {
        localStorage.setItem('erp_seeded', 'cleared'); // prevent re-seeding local storage mock data
      }
      setSuccess(true);
    } catch (e: any) {
      console.error('[Migration] Failed:', e);
      setError(e.message || 'An error occurred during data migration.');
    } finally {
      setLoading(false);
    }
  };

  return { migrate, loading, progress, error, success };
}
