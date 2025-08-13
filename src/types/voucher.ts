export interface Voucher {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount?: number;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
  applicable_packages?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VoucherUsage {
  id: string;
  voucher_id: string;
  user_id: string;
  package_id: string;
  payment_id?: string;
  discount_amount: number;
  original_price: number;
  final_price: number;
  used_at: string;
}

export interface VoucherValidationResult {
  valid: boolean;
  message: string;
  voucher_id?: string;
  voucher_name?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  discount_amount?: number;
  original_price?: number;
  final_price?: number;
}

export interface CreateVoucherData {
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  valid_from?: string;
  valid_until?: string;
  applicable_packages?: string[];
}

export interface UpdateVoucherData extends Partial<CreateVoucherData> {
  is_active?: boolean;
}
