-- Calculate Mentor Earnings from Tryout Sessions
-- Jalankan script ini di Supabase SQL Editor untuk menghitung earnings mentor

-- 1. Function to calculate and insert mentor earnings from completed sessions
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

-- 2. Function to approve earnings for a specific mentor
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

-- 3. Function to get mentor earnings summary
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

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_mentor_earnings_from_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_mentor_earnings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mentor_earnings_summary(UUID) TO authenticated;

-- 5. Create trigger to automatically calculate earnings when session is completed
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

-- Create trigger
DROP TRIGGER IF EXISTS mentor_earnings_trigger ON public.tryout_sessions;
CREATE TRIGGER mentor_earnings_trigger
  AFTER INSERT OR UPDATE ON public.tryout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_mentor_earnings();

-- 6. Test the functions (optional - uncomment to test)
/*
-- Test calculate earnings from existing sessions
SELECT calculate_mentor_earnings_from_sessions();

-- Test get earnings summary for a specific mentor
SELECT get_mentor_earnings_summary('MENTOR_UUID_HERE');

-- View all earnings
SELECT * FROM public.mentor_earnings ORDER BY created_at DESC;

-- View mentor balances
SELECT * FROM public.mentor_balances ORDER BY available_balance DESC;
*/
