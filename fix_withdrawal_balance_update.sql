-- =====================================================
-- FIX WITHDRAWAL BALANCE UPDATE SYSTEM
-- =====================================================
-- Script ini memperbaiki sistem agar available balance berkurang
-- ketika withdrawal status berubah menjadi 'completed'

-- 1. Drop existing functions
DROP FUNCTION IF EXISTS calculate_mentor_balance(UUID);
DROP FUNCTION IF EXISTS update_mentor_balance(UUID);

-- 2. Recreate calculate_mentor_balance function with better logic
CREATE OR REPLACE FUNCTION calculate_mentor_balance(p_mentor_id UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  total_earned DECIMAL(12,2);
  total_withdrawn DECIMAL(12,2);
BEGIN
  -- Calculate total earnings from approved payments
  SELECT COALESCE(SUM(commission_amount), 0)
  INTO total_earned
  FROM public.mentor_earnings
  WHERE mentor_id = p_mentor_id AND status = 'paid';
  
  -- Calculate total withdrawn (only completed withdrawals reduce available balance)
  SELECT COALESCE(SUM(amount), 0)
  INTO total_withdrawn
  FROM public.mentor_withdrawals
  WHERE mentor_id = p_mentor_id AND status = 'completed';
  
  RETURN total_earned - total_withdrawn;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate update_mentor_balance function
CREATE OR REPLACE FUNCTION update_mentor_balance(p_mentor_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.mentor_balances (mentor_id, total_earnings, available_balance, total_withdrawn)
  VALUES (
    p_mentor_id,
    (SELECT COALESCE(SUM(commission_amount), 0) FROM public.mentor_earnings WHERE mentor_id = p_mentor_id AND status = 'paid'),
    calculate_mentor_balance(p_mentor_id),
    (SELECT COALESCE(SUM(amount), 0) FROM public.mentor_withdrawals WHERE mentor_id = p_mentor_id AND status = 'completed')
  )
  ON CONFLICT (mentor_id) DO UPDATE SET
    total_earnings = EXCLUDED.total_earnings,
    available_balance = EXCLUDED.available_balance,
    total_withdrawn = EXCLUDED.total_withdrawn,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger function to automatically update balance when withdrawal status changes
CREATE OR REPLACE FUNCTION trigger_update_mentor_balance_on_withdrawal_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update balance when withdrawal status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM update_mentor_balance(NEW.mentor_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for mentor_withdrawals table
DROP TRIGGER IF EXISTS mentor_withdrawals_balance_update_trigger ON public.mentor_withdrawals;
CREATE TRIGGER mentor_withdrawals_balance_update_trigger
  AFTER UPDATE ON public.mentor_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_mentor_balance_on_withdrawal_change();

-- 6. Create trigger function to automatically update balance when earnings change
CREATE OR REPLACE FUNCTION trigger_update_mentor_balance_on_earnings_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update balance when earnings status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM update_mentor_balance(NEW.mentor_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for mentor_earnings table
DROP TRIGGER IF EXISTS mentor_earnings_balance_update_trigger ON public.mentor_earnings;
CREATE TRIGGER mentor_earnings_balance_update_trigger
  AFTER UPDATE ON public.mentor_earnings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_mentor_balance_on_earnings_change();

-- 8. Create trigger function to automatically update balance when new earnings are inserted
CREATE OR REPLACE FUNCTION trigger_update_mentor_balance_on_earnings_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Update balance when new earnings are inserted
  PERFORM update_mentor_balance(NEW.mentor_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger for mentor_earnings table insert
DROP TRIGGER IF EXISTS mentor_earnings_balance_insert_trigger ON public.mentor_earnings;
CREATE TRIGGER mentor_earnings_balance_insert_trigger
  AFTER INSERT ON public.mentor_earnings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_mentor_balance_on_earnings_insert();

-- 10. Create trigger function to automatically update balance when new withdrawals are inserted
CREATE OR REPLACE FUNCTION trigger_update_mentor_balance_on_withdrawal_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Update balance when new withdrawals are inserted
  PERFORM update_mentor_balance(NEW.mentor_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger for mentor_withdrawals table insert
DROP TRIGGER IF EXISTS mentor_withdrawals_balance_insert_trigger ON public.mentor_withdrawals;
CREATE TRIGGER mentor_withdrawals_balance_insert_trigger
  AFTER INSERT ON public.mentor_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_mentor_balance_on_withdrawal_insert();

-- 12. Grant permissions
GRANT EXECUTE ON FUNCTION calculate_mentor_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_mentor_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_update_mentor_balance_on_withdrawal_change() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_update_mentor_balance_on_earnings_change() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_update_mentor_balance_on_earnings_insert() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_update_mentor_balance_on_withdrawal_insert() TO authenticated;

-- 13. Update existing balances to reflect new logic
SELECT update_mentor_balance(mentor_id) FROM public.mentor_balances;

-- =====================================================
-- TEST SISTEM
-- =====================================================

-- Test 1: Check current balances
SELECT 
  mb.id,
  mb.mentor_id,
  u.full_name as mentor_name,
  mb.total_earnings,
  mb.available_balance,
  mb.total_withdrawn,
  mb.created_at,
  mb.updated_at
FROM public.mentor_balances mb
LEFT JOIN public.users u ON mb.mentor_id = u.id
ORDER BY mb.available_balance DESC;

-- Test 2: Check withdrawal statuses
SELECT 
  mw.id,
  mw.mentor_id,
  u.full_name as mentor_name,
  mw.amount,
  mw.status,
  mw.created_at
FROM public.mentor_withdrawals mw
LEFT JOIN public.users u ON mw.mentor_id = u.id
ORDER BY mw.created_at DESC;

-- Test 3: Check earnings
SELECT 
  me.id,
  me.mentor_id,
  u.full_name as mentor_name,
  me.payment_amount,
  me.commission_amount,
  me.status,
  me.created_at
FROM public.mentor_earnings me
LEFT JOIN public.users u ON me.mentor_id = u.id
ORDER BY me.created_at DESC;

-- =====================================================
-- CARA KERJA SISTEM YANG DIPERBAIKI
-- =====================================================
-- 
-- 1. ✅ Payment completed → Hitung komisi 10% → Insert ke mentor_earnings
-- 2. ✅ Total earnings = SUM(commission_amount) dari earnings dengan status 'paid'
-- 3. ✅ Available balance = Total earnings - Total withdrawn (HANYA status 'completed')
-- 4. ✅ Total withdrawn = SUM(amount) dari withdrawals dengan status 'completed'
-- 5. ✅ Ketika withdrawal status berubah dari 'approved' ke 'completed':
--      - Available balance berkurang
--      - Total withdrawn bertambah
-- 6. ✅ Balance update otomatis setiap ada perubahan status

-- =====================================================
-- STATUS WITHDRAWAL
-- =====================================================
-- 
-- pending: Permintaan baru, tidak mempengaruhi balance
-- approved: Disetujui admin, tidak mempengaruhi balance
-- completed: Selesai diproses, MENGURANGI available balance
-- rejected: Ditolak, tidak mempengaruhi balance

-- =====================================================
-- CONTOH PERHITUNGAN
-- =====================================================
-- 
-- Mentor A:
-- - Total earnings: Rp 100,000 (dari 2 payment completed)
-- - Withdrawal 1: Rp 30,000 (status: completed) → Available: Rp 70,000
-- - Withdrawal 2: Rp 20,000 (status: approved) → Available: Rp 70,000 (tidak berubah)
-- - Withdrawal 3: Rp 15,000 (status: pending) → Available: Rp 70,000 (tidak berubah)
-- 
-- Ketika Withdrawal 2 berubah ke 'completed':
-- - Available balance: Rp 70,000 - Rp 20,000 = Rp 50,000
-- - Total withdrawn: Rp 30,000 + Rp 20,000 = Rp 50,000
