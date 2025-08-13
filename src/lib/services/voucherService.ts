import { apiClient } from './supabaseClient'
import { Voucher, VoucherUsage, VoucherValidationResult } from '@/types/voucher'

export const voucherService = {
  // Get all vouchers (for admin)
  async getAllVouchers(): Promise<{ data: Voucher[]; error: any }> {
    try {
      const { data, error } = await apiClient.list('vouchers')
      
      if (error) throw error
      
      // Sort by created_at (newest first)
      const sortedVouchers = data?.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) || []
      
      return { data: sortedVouchers, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Get all active vouchers
  async getActiveVouchers(): Promise<{ data: Voucher[]; error: any }> {
    try {
      const { data, error } = await apiClient.list('vouchers')
      
      if (error) throw error
      
      // Filter active vouchers and sort by created_at
      const activeVouchers = data?.filter((v: any) => v.is_active === true) || []
      const sortedVouchers = activeVouchers.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      return { data: sortedVouchers, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Get voucher by code
  async getVoucherByCode(code: string): Promise<{ data: Voucher | null; error: any }> {
    try {
      const { data, error } = await apiClient.list('vouchers')
      
      if (error) throw error
      
      // Find voucher by code
      const voucher = data?.find((v: any) => v.code === code)
      
      return { data: voucher || null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Validate voucher for user
  async validateVoucher(code: string, userId: string, amount: number): Promise<VoucherValidationResult> {
    try {
      // Get voucher
      const { data: voucher, error } = await this.getVoucherByCode(code)
      
      if (error || !voucher) {
        return { valid: false, message: 'Voucher tidak ditemukan' }
      }

      // Check if voucher is active
      if (!voucher.is_active) {
        return { valid: false, message: 'Voucher tidak aktif' }
      }

      // Check if voucher has expired
      if (voucher.valid_until && new Date(voucher.valid_until) < new Date()) {
        return { valid: false, message: 'Voucher sudah expired' }
      }

      // Check usage limit
      if (voucher.used_count >= voucher.usage_limit) {
        return { valid: false, message: 'Voucher sudah habis digunakan' }
      }

      // Check minimum purchase
      if (amount < voucher.min_purchase_amount) {
        return { 
          valid: false, 
          message: `Minimal pembelian Rp ${voucher.min_purchase_amount.toLocaleString()}` 
        }
      }

      // Calculate discount
      let discount = 0
      if (voucher.discount_type === 'percentage') {
        discount = (amount * voucher.discount_value) / 100
      } else {
        discount = voucher.discount_value
      }

      // Ensure discount doesn't exceed amount
      if (discount > amount) {
        discount = amount
      }

      return {
        valid: true,
        voucher_id: voucher.id,
        voucher_name: voucher.name,
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
        discount_amount: discount,
        original_price: amount,
        final_price: amount - discount,
        message: `Voucher valid! Diskon Rp ${discount.toLocaleString()}`
      }
    } catch (error) {
      return { valid: false, message: 'Error validasi voucher' }
    }
  },

  // Use voucher
  async useVoucher(voucherId: string, userId: string, amount: number, discountApplied: number): Promise<{ 
    success: boolean; 
    error?: any 
  }> {
    try {
      // Start transaction
      const { data: vouchers, error: voucherError } = await apiClient.list('vouchers')
      const voucher = vouchers?.find((v: any) => v.id === voucherId)
      
      if (voucherError || !voucher) {
        throw new Error('Voucher tidak ditemukan')
      }

      const currentVoucher = voucher

      // Check if still valid
      if (currentVoucher.usage_count >= currentVoucher.max_usage) {
        throw new Error('Voucher sudah habis digunakan')
      }

      // Update voucher usage count
      const { error: updateError } = await apiClient.update('vouchers', 
        { usage_count: currentVoucher.usage_count + 1 },
        { column: 'id', value: voucherId }
      )
      
      if (updateError) throw updateError

      // Record voucher usage
      const { error: usageError } = await apiClient.insert('voucher_usages', {
        voucher_id: voucherId,
        user_id: userId,
        amount,
        discount_applied: discountApplied,
        used_at: new Date().toISOString()
      })
      
      if (usageError) throw usageError

      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  },

        // Get voucher usage history for user
      async getUserVoucherHistory(userId: string): Promise<{ data: VoucherUsage[]; error: any }> {
        try {
          const { data, error } = await apiClient.list('voucher_usages')
          
          if (error) throw error
          
          // Filter by user_id and sort by used_at
          const userUsages = data?.filter((usage: any) => usage.user_id === userId) || []
          const sortedUsages = userUsages.sort((a: any, b: any) => 
            new Date(b.used_at).getTime() - new Date(a.used_at).getTime()
          )
          
          return { data: sortedUsages, error: null }
        } catch (error) {
          return { data: [], error }
        }
      },

  // Create new voucher (admin only)
  async createVoucher(voucherData: Omit<Voucher, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<{ 
    data: Voucher | null; 
    error: any 
  }> {
    try {
      const { data, error } = await apiClient.insert('vouchers', {
        ...voucherData,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      if (error) throw error
      
      return { data: data?.[0] || null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update voucher (admin only)
  async updateVoucher(voucherId: string, updates: Partial<Voucher>): Promise<{ 
    data: Voucher | null; 
    error: any 
  }> {
    try {
      const { data, error } = await apiClient.update('vouchers', 
        { ...updates, updated_at: new Date().toISOString() },
        { column: 'id', value: voucherId }
      )
      
      if (error) throw error
      
      return { data: data?.[0] || null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete voucher (admin only)
  async deleteVoucher(voucherId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await apiClient.delete('vouchers', { column: 'id', value: voucherId })
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  },

  // Get voucher statistics
  async getVoucherStats(): Promise<{ 
    totalVouchers: number; 
    activeVouchers: number; 
    totalUsage: number; 
    totalDiscount: number 
  }> {
    try {
      // Get total vouchers
      const { data: totalVouchers } = await apiClient.list('vouchers')
      
      // Get active vouchers
      const { data: activeVouchers } = await apiClient.list('vouchers')
      const activeVouchersFiltered = activeVouchers?.filter((v: any) => v.is_active === true) || []
      
      // Get total usage and discount
      const { data: usages } = await apiClient.list('voucher_usages')
      
      const totalUsage = usages?.length || 0
      const totalDiscount = usages?.reduce((sum: number, usage: any) => sum + (usage.discount_applied || 0), 0) || 0
      
      return {
        totalVouchers: totalVouchers?.length || 0,
        activeVouchers: activeVouchersFiltered.length || 0,
        totalUsage,
        totalDiscount
      }
    } catch (error) {
      return {
        totalVouchers: 0,
        activeVouchers: 0,
        totalUsage: 0,
        totalDiscount: 0
      }
    }
  },

  // Get voucher usage statistics
  async getVoucherUsageStats(): Promise<{ data: any[]; error: any }> {
    try {
      console.log('🔍 Fetching voucher usage stats...');
      
      const { data, error } = await apiClient.list('voucher_usages')
      console.log('📊 Voucher usages raw data:', { data, error });
      
      if (error) throw error
      
      // Get voucher details for each usage
      const { data: vouchers, error: voucherError } = await apiClient.list('vouchers')
      console.log('🎫 Vouchers data:', { vouchers, voucherError });
      
      if (voucherError) throw voucherError
      
      // Get user details for each usage
      const { data: users, error: userError } = await apiClient.list('users')
      console.log('👥 Users data:', { users, userError });
      
      if (userError) throw userError
      
      const voucherMap = new Map(vouchers?.map((v: any) => [v.id, v]) || [])
      const userMap = new Map(users?.map((u: any) => [u.id, u]) || [])
      
      // Combine data
      const usageStats = data?.map((usage: any) => {
        const voucher = voucherMap.get(usage.voucher_id) as any
        const user = userMap.get(usage.user_id) as any
        
        return {
          ...usage,
          voucher_code: voucher?.code || 'Unknown',
          voucher_discount_type: voucher?.discount_type || 'Unknown',
          voucher_discount_value: voucher?.discount_value || 0,
          user_name: user?.full_name || user?.email || 'Unknown User',
          discount_amount: usage.discount_applied || 0
        }
      }) || []
      
      console.log('✅ Processed usage stats:', usageStats);
      return { data: usageStats, error: null }
    } catch (error) {
      console.error('❌ Error in getVoucherUsageStats:', error);
      return { data: [], error }
    }
  }
}
