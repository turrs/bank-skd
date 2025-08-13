-- Simple Voucher Function Test
-- This will test if the function exists and can be called

-- 1. Check if function exists
SELECT 'Function exists?' as test, 
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_and_apply_voucher') 
            THEN 'YES' ELSE 'NO' END as result;

-- 2. Check function signature
SELECT 'Function signature' as test, 
       pg_get_function_arguments(oid) as signature
FROM pg_proc 
WHERE proname = 'validate_and_apply_voucher';

-- 3. Test with sample data (if available)
DO $$
DECLARE
    test_package_id UUID;
    test_user_id UUID;
    test_result JSON;
BEGIN
    -- Get first available package
    SELECT id INTO test_package_id FROM public.question_packages LIMIT 1;
    
    -- Get first available user
    SELECT id INTO test_user_id FROM public.users LIMIT 1;
    
    IF test_package_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with package_id: % and user_id: %', test_package_id, test_user_id;
        
        -- Test the function
        SELECT public.validate_and_apply_voucher(test_package_id, test_user_id, 'WELCOME20') 
        INTO test_result;
        
        RAISE NOTICE 'Function result: %', test_result;
        
        IF test_result IS NOT NULL THEN
            RAISE NOTICE '✅ Function is working!';
        ELSE
            RAISE NOTICE '❌ Function returned NULL';
        END IF;
    ELSE
        RAISE NOTICE '❌ Cannot test: Missing package or user data';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Function test failed: % %', SQLERRM, SQLSTATE;
END $$;

-- 4. Check vouchers table
SELECT 'Vouchers count' as test, COUNT(*) as result FROM public.vouchers;

-- 5. Check packages table  
SELECT 'Active packages count' as test, COUNT(*) as result 
FROM public.question_packages 
WHERE is_active = true;
