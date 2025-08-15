-- =====================================================
-- FIX SISTEM MENTOR BALANCE YANG SUDAH ADA
-- =====================================================
-- Jalankan script ini di Supabase SQL Editor untuk memperbaiki sistem yang sudah ada

-- 1. Drop existing tables if they exist (optional - uncomment jika ingin reset)
-- DROP TABLE IF EXISTS public.mentor_withdrawals CASCADE;
-- DROP TABLE IF EXISTS public.mentor_earnings CASCADE;
-- DROP TABLE IF EXISTS public.mentor_balances CASCADE;

-- 2. Recreate tables with correct data types
CREATE TABLE IF NOT EXISTS public.mentor_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_earnings DECIMAL(12,2) DEFAULT 0.00,
  available_balance DECIMAL(12,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mentor_withdrawals (
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

CREATE TABLE IF NOT EXISTS public.mentor_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.tryout_sessions(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.question_packages(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(8,2) NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 10.00, -- 10% commission
  commission_amount DECIMAL(8,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mentor_balances_mentor_id ON public.mentor_balances(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_withdrawals_mentor_id ON public.mentor_withdrawals(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_withdrawals_status ON public.mentor_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_mentor_earnings_mentor_id ON public.mentor_earnings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_earnings_status ON public.mentor_earnings(status);

-- 4. Enable RLS
ALTER TABLE public.mentor_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_earnings ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist
DROP POLICY IF EXISTS "mentor_balances_select_own" ON public.mentor_balances;
DROP POLICY IF EXISTS "mentor_balances_select_admin" ON public.mentor_balances;
DROP POLICY IF EXISTS "mentor_withdrawals_select_own" ON public.mentor_withdrawals;
DROP POLICY IF EXISTS "mentor_withdrawals_select_admin" ON public.mentor_withdrawals;
DROP POLICY IF EXISTS "mentor_withdrawals_insert_own" ON public.mentor_withdrawals;
DROP POLICY IF EXISTS "mentor_withdrawals_update_admin" ON public.mentor_withdrawals;
DROP POLICY IF EXISTS "mentor_earnings_select_own" ON public.mentor_earnings;
DROP POLICY IF EXISTS "mentor_earnings_select_admin" ON public.mentor_earnings;

-- 6. Create RLS policies
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

-- 7. Create functions for automatic balance calculation
CREATE OR REPLACE FUNCTION calculate_mentor_balance(p_mentor_id UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  total_earned DECIMAL(12,2);
  total_withdrawn DECIMAL(12,2);
BEGIN
  -- Calculate total earnings from approved sessions
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

-- 8. Create function to update mentor balance
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

-- 9. Create trigger to automatically update balance when earnings change
CREATE OR REPLACE FUNCTION trigger_update_mentor_balance()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_mentor_balance(NEW.mentor_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS mentor_earnings_balance_trigger ON public.mentor_earnings;
DROP TRIGGER IF EXISTS mentor_withdrawals_balance_trigger ON public.mentor_withdrawals;

-- Create triggers
CREATE TRIGGER mentor_earnings_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.mentor_earnings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_mentor_balance();

CREATE TRIGGER mentor_withdrawals_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.mentor_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_mentor_balance();

-- 10. Create function to calculate and insert mentor earnings from completed sessions
CREATE OR REPLACE FUNCTION calculate_mentor_earnings_from_sessions()
RETURNS VOID AS $$
DECLARE
  session_record RECORD;
  mentor_id UUID;
  commission_rate DECIMAL(5,2) := 10.00; -- 10% commission rate
BEGIN
  -- Loop through all completed tryout sessions that don't have earnings records yet
  FOR session_record IN 
    SELECT 
      ts.id as session_id,
      ts.package_id,
      ts.user_id as student_id,
      qp.creator_id as mentor_id,
      qp.price as package_price
    FROM public.tryout_sessions ts
    JOIN public.question_packages qp ON ts.package_id = qp.id
    WHERE ts.status = 'completed'
    AND ts.id NOT IN (
      SELECT session_id FROM public.mentor_earnings
    )
    AND qp.creator_id IS NOT NULL
  LOOP
    -- Insert earnings record
    INSERT INTO public.mentor_earnings (
      mentor_id,
      session_id,
      package_id,
      student_id,
      amount,
      commission_rate,
      commission_amount,
      status
    ) VALUES (
      session_record.mentor_id,
      session_record.session_id,
      session_record.package_id,
      session_record.student_id,
      session_record.package_price,
      commission_rate,
      (session_record.package_price * commission_rate / 100),
      'pending'
    );
  END LOOP;
  
  -- Update all pending earnings to 'paid' status (auto-approve for now)
  UPDATE public.mentor_earnings 
  SET status = 'paid', updated_at = NOW()
  WHERE status = 'pending';
  
  -- Update mentor balances
  PERFORM update_mentor_balance(mentor_id) 
  FROM public.mentor_earnings 
  WHERE status = 'paid';
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to approve earnings for a specific mentor
CREATE OR REPLACE FUNCTION approve_mentor_earnings(p_mentor_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  earnings_count INTEGER;
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admin users can approve mentor earnings';
  END IF;
  
  -- Update earnings status to paid
  UPDATE public.mentor_earnings 
  SET status = 'paid', updated_at = NOW()
  WHERE mentor_id = p_mentor_id AND status = 'pending';
  
  GET DIAGNOSTICS earnings_count = ROW_COUNT;
  
  -- Update mentor balance
  PERFORM update_mentor_balance(p_mentor_id);
  
  -- Return result
  result := json_build_object(
    'success', true,
    'message', 'Earnings approved successfully',
    'mentor_id', p_mentor_id,
    'earnings_approved', earnings_count,
    'updated_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to get mentor earnings summary
CREATE OR REPLACE FUNCTION get_mentor_earnings_summary(p_mentor_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_earnings DECIMAL(12,2);
  pending_earnings DECIMAL(12,2);
  paid_earnings DECIMAL(12,2);
  total_sessions INTEGER;
BEGIN
  -- Calculate total earnings
  SELECT COALESCE(SUM(commission_amount), 0)
  INTO total_earnings
  FROM public.mentor_earnings
  WHERE mentor_id = p_mentor_id;
  
  -- Calculate pending earnings
  SELECT COALESCE(SUM(commission_amount), 0)
  INTO pending_earnings
  FROM public.mentor_earnings
  WHERE mentor_id = p_mentor_id AND status = 'pending';
  
  -- Calculate paid earnings
  SELECT COALESCE(SUM(commission_amount), 0)
  INTO paid_earnings
  FROM public.mentor_earnings
  WHERE mentor_id = p_mentor_id AND status = 'paid';
  
  -- Count total sessions
  SELECT COUNT(*)
  INTO total_sessions
  FROM public.mentor_earnings
  WHERE mentor_id = p_mentor_id;
  
  -- Return result
  result := json_build_object(
    'mentor_id', p_mentor_id,
    'total_earnings', total_earnings,
    'pending_earnings', pending_earnings,
    'paid_earnings', paid_earnings,
    'total_sessions', total_sessions,
    'calculated_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create trigger to automatically calculate earnings when session is completed
CREATE OR REPLACE FUNCTION trigger_calculate_mentor_earnings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate earnings when session status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Check if this session already has earnings record
    IF NOT EXISTS (
      SELECT 1 FROM public.mentor_earnings WHERE session_id = NEW.id
    ) THEN
      -- Insert earnings record
      INSERT INTO public.mentor_earnings (
        mentor_id,
        session_id,
        package_id,
        student_id,
        amount,
        commission_rate,
        commission_amount,
        status
      )
      SELECT 
        qp.creator_id,
        NEW.id,
        NEW.package_id,
        NEW.user_id,
        qp.price,
        10.00, -- 10% commission
        (qp.price * 10.00 / 100),
        'pending'
      FROM public.question_packages qp
      WHERE qp.id = NEW.package_id
      AND qp.creator_id IS NOT NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS mentor_earnings_trigger ON public.tryout_sessions;

-- Create trigger
CREATE TRIGGER mentor_earnings_trigger
  AFTER INSERT OR UPDATE ON public.tryout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_mentor_earnings();

-- 14. Grant permissions
GRANT ALL ON public.mentor_balances TO authenticated;
GRANT ALL ON public.mentor_withdrawals TO authenticated;
GRANT ALL ON public.mentor_earnings TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_mentor_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_mentor_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_mentor_earnings_from_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_mentor_earnings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mentor_earnings_summary(UUID) TO authenticated;

-- 15. Insert sample data for existing mentors (optional)
INSERT INTO public.mentor_balances (mentor_id, total_earnings, available_balance, total_withdrawn)
SELECT 
  u.id,
  0.00,
  0.00,
  0.00
FROM public.users u
WHERE u.role = 'tentor'
ON CONFLICT (mentor_id) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'mentor_%'
ORDER BY table_name;

-- Check if functions were created
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%mentor%'
ORDER BY routine_name;

-- Check if triggers were created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%mentor%'
ORDER BY trigger_name;

-- Check if policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'mentor_%'
ORDER BY tablename, policyname;

-- =====================================================
-- TEST SISTEM
-- =====================================================

-- Test calculate earnings from existing sessions
SELECT calculate_mentor_earnings_from_sessions();

-- View all earnings
SELECT * FROM public.mentor_earnings ORDER BY created_at DESC;

-- View mentor balances
SELECT * FROM public.mentor_balances ORDER BY available_balance DESC;

-- View all withdrawals
SELECT * FROM public.mentor_withdrawals ORDER BY created_at DESC;

-- =====================================================
-- SISTEM SUDAH DIPERBAIKI!
-- =====================================================
-- 
-- Fitur yang tersedia:
-- 1. ✅ Tabel mentor_balances - untuk menyimpan balance mentor
-- 2. ✅ Tabel mentor_withdrawals - untuk request withdrawal
-- 3. ✅ Tabel mentor_earnings - untuk tracking penghasilan
-- 4. ✅ RLS policies - untuk security
-- 5. ✅ Functions - untuk kalkulasi otomatis
-- 6. ✅ Triggers - untuk real-time updates
-- 7. ✅ Admin approval system - untuk withdrawal
-- 8. ✅ Commission calculation - 10% dari harga paket
--
-- Langkah selanjutnya:
-- 1. Test komponen frontend
-- 2. Monitor balance dan withdrawal
-- 3. Process withdrawal requests
