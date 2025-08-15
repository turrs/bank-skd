#!/bin/bash

# Deploy Tentor Role Migration
echo "🚀 Deploying Tentor Role Migration..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    echo "   Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory."
    echo "   Please run this script from your project root."
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo "🔧 Supabase project found"

# Deploy the migration
echo "📤 Deploying migration: add_tentor_role.sql"
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration deployed successfully!"
    
    echo ""
    echo "🔍 Next steps:"
    echo "1. Go to your Supabase Dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Run the fix_admin_rls_policy.sql script"
    echo "4. Test the admin dashboard mentor approval"
    
    echo ""
    echo "📝 Or run this SQL directly in Supabase SQL Editor:"
    echo "----------------------------------------"
    cat fix_admin_rls_policy.sql
    echo "----------------------------------------"
    
else
    echo "❌ Migration failed!"
    echo "Please check the error messages above."
    exit 1
fi
