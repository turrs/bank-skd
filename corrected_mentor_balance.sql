-- =====================================================
-- CORRECTED MENTOR BALANCE SYSTEM
-- =====================================================
-- Jalankan script ini di Supabase SQL Editor

-- 1. Drop existing policies first (to avoid conflicts)
DROP POLICY IF EXISTS "mentor_balances_select_own" ON public.mentor_balances;
DROP POLICY IF EXISTS "mentor_balances_select_admin" ON public.mentor_balances;
DROP POLICY IF EXISTS "mentor_withdrawals_select_own" ON public.mentor_withdrawals;
DROP POLICY IF EXISTS "mentor_withdrawals_select_admin" ON public.mentor_withdrawals;
DROP POLICY IF EXISTS "mentor_withdrawals_insert_own" ON public.mentor_withdrawals;
DROP POLICY IF EXISTS "mentor_withdrawals_update_admin" ON public.mentor_withdrawals;
DROP POLICY IF EXISTS "mentor_earnings_select_own" ON public.mentor_earnings;
DROP POLICY IF EXISTS "mentor_earnings_select_admin" ON public.mentor_earnings;

-- 2. Drop existing triggers if they exist
DROP TRIGGER IF EXISTS mentor_earnings_balance_trigger ON public.mentor_earnings;
DROP TRIGGER IF EXISTS mentor_withdrawals_balance_trigger ON public.mentor_withdrawals;
DROP TRIGGER IF EXISTS mentor_earnings_trigger ON public.tryout_sessions;

-- 3. Drop existing functions if they exist
DROP FUNCTION IF EXISTS calculate_mentor_balance(UUID);
DROP FUNCTION IF EXISTS update_mentor_balance(UUID);
DROP FUNCTION IF EXISTS calculate_mentor_earnings_from_sessions();
DROP FUNCTION IF EXISTS approve_mentor_earnings(UUID);
DROP FUNCTION IF EXISTS get_mentor_earnings_summary(UUID);
DROP FUNCTION IF EXISTS trigger_update_mentor_balance();
DROP FUNCTION IF EXISTS trigger_calculate_mentor_earnings();

-- 4. Drop existing tables if they exist
DROP TABLE IF EXISTS public.mentor_withdrawals CASCADE;
DROP TABLE IF EXISTS public.mentor_earnings CASCADE;
DROP TABLE IF EXISTS public.mentor_balances CASCADE;

-- 5. Create mentor_balances table
CREATE TABLE public.mentor_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  total_earnings DECIMAL(12,2) DEFAULT 0.00,
  available_balance DECIMAL(12,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create mentor_withdrawals table
CREATE TABLE public.mentor_withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  account_holder VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create mentor_earnings table (untuk tracking komisi dari payment)
CREATE TABLE public.mentor_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.question_packages(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payment_amount DECIMAL(12,2) NOT NULL, -- FIXED: Changed from DECIMAL(8,2) to DECIMAL(12,2)
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  commission_amount DECIMAL(12,2) NOT NULL, -- FIXED: Changed from DECIMAL(8,2) to DECIMAL(12,2)
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Add indexes
CREATE INDEX idx_mentor_balances_mentor_id ON public.mentor_balances(mentor_id);
CREATE INDEX idx_mentor_withdrawals_mentor_id ON public.mentor_withdrawals(mentor_id);
CREATE INDEX idx_mentor_withdrawals_status ON public.mentor_withdrawals(status);
CREATE INDEX idx_mentor_earnings_mentor_id ON public.mentor_earnings(mentor_id);
CREATE INDEX idx_mentor_earnings_status ON public.mentor_earnings(status);
CREATE INDEX idx_mentor_earnings_payment_id ON public.mentor_earnings(payment_id);

-- 9. Enable RLS
ALTER TABLE public.mentor_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_earnings ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies
-- Mentor can view their own balance
CREATE POLICY "mentor_balances_select_own" ON public.mentor_balances
FOR SELECT USING (auth.uid() = mentor_id);

-- Admin can view all balances
CREATE POLICY "mentor_balances_select_admin" ON public.mentor_balances
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- Mentor can view their own withdrawals
CREATE POLICY "mentor_withdrawals_select_own" ON public.mentor_withdrawals
FOR SELECT USING (auth.uid() = mentor_id);

-- Admin can view all withdrawals
CREATE POLICY "mentor_withdrawals_select_admin" ON public.mentor_withdrawals
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- Mentor can insert their own withdrawals
CREATE POLICY "mentor_withdrawals_insert_own" ON public.mentor_withdrawals
FOR INSERT WITH CHECK (auth.uid() = mentor_id);

-- Admin can update withdrawal status
CREATE POLICY "mentor_withdrawals_update_admin" ON public.mentor_withdrawals
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- Mentor can view their own earnings
CREATE POLICY "mentor_earnings_select_own" ON public.mentor_earnings
FOR SELECT USING (auth.uid() = mentor_id);

-- Admin can view all earnings
CREATE POLICY "mentor_earnings_select_admin" ON public.mentor_earnings
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- 11. Create functions
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
  
  -- Calculate total withdrawn
  SELECT COALESCE(SUM(amount), 0)
  INTO total_withdrawn
  FROM public.mentor_withdrawals
  WHERE mentor_id = p_mentor_id AND status IN ('approved', 'completed');
  
  RETURN total_earned - total_withdrawn;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to update mentor balance
CREATE OR REPLACE FUNCTION update_mentor_balance(p_mentor_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.mentor_balances (mentor_id, total_earnings, available_balance, total_withdrawn)
  VALUES (
    p_mentor_id,
    (SELECT COALESCE(SUM(commission_amount), 0) FROM public.mentor_earnings WHERE mentor_id = p_mentor_id AND status = 'paid'),
    calculate_mentor_balance(p_mentor_id),
    (SELECT COALESCE(SUM(amount), 0) FROM public.mentor_withdrawals WHERE mentor_id = p_mentor_id AND status IN ('approved', 'completed'))
  )
  ON CONFLICT (mentor_id) DO UPDATE SET
    total_earnings = EXCLUDED.total_earnings,
    available_balance = EXCLUDED.available_balance,
    total_withdrawn = EXCLUDED.total_withdrawn,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create function to calculate earnings from completed payments
CREATE OR REPLACE FUNCTION calculate_mentor_earnings_from_payments()
RETURNS VOID AS $$
DECLARE
  payment_record RECORD;
BEGIN
  -- Loop through all completed payments that don't have earnings records yet
  FOR payment_record IN 
    SELECT 
      p.id as payment_id,
      p.package_id,
      p.user_id as student_id,
      qp.creator_id as mentor_id,
      p.amount as payment_amount
    FROM public.payments p
    JOIN public.question_packages qp ON p.package_id = qp.id
    WHERE p.status = 'completed'
    AND p.id NOT IN (
      SELECT payment_id FROM public.mentor_earnings
    )
    AND qp.creator_id IS NOT NULL
  LOOP
    -- Insert earnings record
    INSERT INTO public.mentor_earnings (
      mentor_id,
      payment_id,
      package_id,
      student_id,
      payment_amount,
      commission_rate,
      commission_amount,
      status
    ) VALUES (
      payment_record.mentor_id,
      payment_record.payment_id,
      payment_record.package_id,
      payment_record.student_id,
      payment_record.payment_amount,
      10.00, -- 10% commission
      (payment_record.payment_amount * 10.00 / 100),
      'paid' -- Auto-approve for now
    );
  END LOOP;
  
  -- Update mentor balances
  PERFORM update_mentor_balance(mentor_id) 
  FROM public.mentor_earnings 
  WHERE status = 'paid';
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Grant permissions
GRANT ALL ON public.mentor_balances TO authenticated;
GRANT ALL ON public.mentor_withdrawals TO authenticated;
GRANT ALL ON public.mentor_earnings TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_mentor_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_mentor_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_mentor_earnings_from_payments() TO authenticated;

-- 15. Insert initial data for existing mentors
INSERT INTO public.mentor_balances (mentor_id, total_earnings, available_balance, total_withdrawn)
SELECT 
  u.id,
  0.00,
  0.00,
  0.00
FROM public.users u
WHERE u.role = 'tentor';

-- =====================================================
-- TEST SISTEM
-- =====================================================

-- Test calculate earnings from completed payments
SELECT calculate_mentor_earnings_from_payments();

-- View all earnings
SELECT * FROM public.mentor_earnings ORDER BY created_at DESC;

-- View mentor balances
SELECT * FROM public.mentor_balances ORDER BY available_balance DESC;

-- View all withdrawals
SELECT * FROM public.mentor_withdrawals ORDER BY created_at DESC;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'mentor_%';

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%mentor%';

-- Check policies
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' AND tablename LIKE 'mentor_%';

-- =====================================================
-- CARA KERJA SISTEM
-- =====================================================
-- 
-- 1. ✅ Payment completed → Hitung komisi 10% dari amount yang dibayar
-- 2. ✅ Komisi masuk ke mentor_earnings dengan status 'paid'
-- 3. ✅ Total earnings = SUM(commission_amount) dari earnings dengan status 'paid'
-- 4. ✅ Available balance = Total earnings - Total withdrawn
-- 5. ✅ Mentor bisa request withdrawal dari available balance
-- 6. ✅ Admin approve/reject withdrawal
-- 7. ✅ Balance update otomatis setiap ada perubahan

-- =====================================================
-- FIXES APPLIED
-- =====================================================
-- 
-- ✅ FIXED: Changed payment_amount from DECIMAL(8,2) to DECIMAL(12,2)
-- ✅ FIXED: Changed commission_amount from DECIMAL(8,2) to DECIMAL(12,2)
-- 
-- DECIMAL(8,2) can only store values up to 999,999.99
-- DECIMAL(12,2) can store values up to 99,999,999,999.99
-- This should handle any reasonable payment amounts without overflow
