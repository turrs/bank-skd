-- Test Voucher Validation Function
-- This script will test the validate_and_apply_voucher function

-- 1. First, let's check what vouchers exist in the database
SELECT '=== EXISTING VOUCHERS ===' as info;
SELECT 
    code, 
    name, 
    discount_type, 
    discount_value, 
    min_purchase_amount,
    usage_limit,
    used_count,
    is_active,
    valid_until
FROM public.vouchers 
ORDER BY created_at DESC;

-- 2. Check what packages exist
SELECT '=== EXISTING PACKAGES ===' as info;
SELECT 
    id, 
    title, 
    price,
    is_active
FROM public.question_packages 
WHERE is_active = true
ORDER BY created_at DESC;

-- 3. Check what users exist (for testing)
SELECT '=== EXISTING USERS ===' as info;
SELECT 
    id, 
    email, 
    full_name,
    is_admin
FROM public.users 
LIMIT 5;

-- 4. Test the voucher validation function with sample data
SELECT '=== TESTING VOUCHER VALIDATION ===' as info;

-- Get sample data for testing
DO $$
DECLARE
    test_voucher_code VARCHAR(50) := 'WELCOME20';
    test_package_id UUID;
    test_user_id UUID;
    test_result JSON;
BEGIN
    -- Get a sample package ID
    SELECT id INTO test_package_id 
    FROM public.question_packages 
    WHERE is_active = true 
    LIMIT 1;
    
    -- Get a sample user ID
    SELECT id INTO test_user_id 
    FROM public.users 
    LIMIT 1;
    
    -- Display test parameters
    RAISE NOTICE 'Testing with:';
    RAISE NOTICE '  Voucher Code: %', test_voucher_code;
    RAISE NOTICE '  Package ID: %', test_package_id;
    RAISE NOTICE '  User ID: %', test_user_id;
    
    -- Test the function
    IF test_package_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        SELECT public.validate_and_apply_voucher(test_package_id, test_user_id, test_voucher_code) 
        INTO test_result;
        
        RAISE NOTICE 'Function Result: %', test_result;
        
        -- Parse and display the result
        IF test_result->>'valid' = 'true' THEN
            RAISE NOTICE '✅ Voucher validation SUCCESS!';
            RAISE NOTICE '  Discount Amount: %', test_result->>'discount_amount';
            RAISE NOTICE '  Final Price: %', test_result->>'final_price';
            RAISE NOTICE '  Message: %', test_result->>'message';
        ELSE
            RAISE NOTICE '❌ Voucher validation FAILED!';
            RAISE NOTICE '  Message: %', test_result->>'message';
        END IF;
    ELSE
        RAISE NOTICE '❌ Cannot test: Missing package or user data';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error testing function: % %', SQLERRM, SQLSTATE;
END $$;

-- 5. Test with invalid voucher code
SELECT '=== TESTING INVALID VOUCHER ===' as info;

DO $$
DECLARE
    test_package_id UUID;
    test_user_id UUID;
    test_result JSON;
BEGIN
    -- Get sample data
    SELECT id INTO test_package_id FROM public.question_packages WHERE is_active = true LIMIT 1;
    SELECT id INTO test_user_id FROM public.users LIMIT 1;
    
    IF test_package_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        -- Test with invalid voucher code
        SELECT public.validate_and_apply_voucher(test_package_id, test_user_id, 'INVALID123') 
        INTO test_result;
        
        RAISE NOTICE 'Invalid voucher test result: %', test_result;
        
        IF test_result->>'valid' = 'false' THEN
            RAISE NOTICE '✅ Invalid voucher correctly rejected: %', test_result->>'message';
        ELSE
            RAISE NOTICE '❌ Invalid voucher should have been rejected';
        END IF;
    END IF;
END $$;

-- 6. Test with empty parameters
SELECT '=== TESTING EMPTY PARAMETERS ===' as info;

DO $$
DECLARE
    test_result JSON;
BEGIN
    -- Test with NULL parameters
    SELECT public.validate_and_apply_voucher(NULL, NULL, NULL) INTO test_result;
    RAISE NOTICE 'NULL parameters test: %', test_result;
    
    -- Test with empty voucher code
    SELECT public.validate_and_apply_voucher('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '') INTO test_result;
    RAISE NOTICE 'Empty voucher code test: %', test_result;
END $$;

-- 7. Check function signature
SELECT '=== FUNCTION SIGNATURE ===' as info;
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p 
WHERE p.proname = 'validate_and_apply_voucher';

-- 8. Check function permissions
SELECT '=== FUNCTION PERMISSIONS ===' as info;
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    p.proacl as permissions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'validate_and_apply_voucher';

-- 9. Final summary
SELECT '=== TEST SUMMARY ===' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_and_apply_voucher') 
        THEN '✅ Function exists'
        ELSE '❌ Function missing'
    END as function_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.vouchers LIMIT 1) 
        THEN '✅ Vouchers exist'
        ELSE '❌ No vouchers found'
    END as vouchers_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.question_packages WHERE is_active = true LIMIT 1) 
        THEN '✅ Active packages exist'
        ELSE '❌ No active packages found'
    END as packages_status;
