-- Create Mentor Balance and Withdrawal System
-- Jalankan script ini di Supabase SQL Editor

-- 1. Create mentor_balances table
CREATE TABLE IF NOT EXISTS public.mentor_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_earnings DECIMAL(12,2) DEFAULT 0.00,
  available_balance DECIMAL(12,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create mentor_withdrawals table
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

-- 3. Create mentor_earnings table to track earnings from sessions
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

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mentor_balances_mentor_id ON public.mentor_balances(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_withdrawals_mentor_id ON public.mentor_withdrawals(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_withdrawals_status ON public.mentor_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_mentor_earnings_mentor_id ON public.mentor_earnings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_earnings_status ON public.mentor_earnings(status);

-- 5. Enable RLS
ALTER TABLE public.mentor_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_earnings ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER mentor_earnings_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.mentor_earnings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_mentor_balance();

CREATE TRIGGER mentor_withdrawals_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.mentor_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_mentor_balance();

-- 10. Grant permissions
GRANT ALL ON public.mentor_balances TO authenticated;
GRANT ALL ON public.mentor_withdrawals TO authenticated;
GRANT ALL ON public.mentor_earnings TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_mentor_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_mentor_balance(UUID) TO authenticated;

-- 11. Insert sample data for existing mentors (optional)
INSERT INTO public.mentor_balances (mentor_id, total_earnings, available_balance, total_withdrawn)
SELECT 
  u.id,
  0.00,
  0.00,
  0.00
FROM public.users u
WHERE u.role = 'tentor' AND u.is_verified = true
ON CONFLICT (mentor_id) DO NOTHING;
