-- Test the voucher function to ensure it's working correctly
-- This will help identify any remaining issues

-- First, let's check if the function exists and what its signature is
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p 
WHERE p.proname = 'validate_and_apply_voucher';

-- Now let's test the function with a simple call
-- We'll use one of the sample vouchers that should exist
DO $$
DECLARE
    test_result JSON;
    test_voucher_code VARCHAR(50) := 'WELCOME20';
    test_package_id UUID;
    test_user_id UUID;
BEGIN
    -- Get a sample package ID
    SELECT id INTO test_package_id FROM public.question_packages LIMIT 1;
    
    -- Get a sample user ID
    SELECT id INTO test_user_id FROM public.users LIMIT 1;
    
    IF test_package_id IS NULL THEN
        RAISE NOTICE 'No question packages found in database';
        RETURN;
    END IF;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found in database';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing with: voucher_code=%, package_id=%, user_id=%', 
        test_voucher_code, test_package_id, test_user_id;
    
    -- Test the function
    SELECT public.validate_and_apply_voucher(test_voucher_code, test_package_id, test_user_id) 
    INTO test_result;
    
    RAISE NOTICE 'Function result: %', test_result;
    
    -- Check if result is valid JSON
    IF test_result IS NOT NULL THEN
        RAISE NOTICE 'Function executed successfully!';
    ELSE
        RAISE NOTICE 'Function returned NULL';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error testing function: % %', SQLERRM, SQLSTATE;
END $$;

-- Let's also check what vouchers exist
SELECT code, name, is_active, valid_until, used_count, usage_limit 
FROM public.vouchers 
LIMIT 5;

-- And check what packages exist
SELECT id, title, price 
FROM public.question_packages 
LIMIT 5;
