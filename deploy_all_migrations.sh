#!/bin/bash

# Script untuk deploy semua migration termasuk role tentor dan creator_id
# Pastikan Supabase CLI sudah terinstall dan terkonfigurasi

echo "🚀 Deploying All Migrations..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    echo "   Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in Supabase project directory. Please run this from the project root."
    exit 1
fi

# Deploy all migrations
echo "📦 Deploying all migrations..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ All migrations deployed successfully!"
    echo ""
    echo "🎯 What was added:"
    echo "   • Role-based access control (student, tentor, admin)"
    echo "   • Tentor profiles table with detailed information"
    echo "   • Tentor sessions table for tracking interactions"
    echo "   • Tentor availability table for scheduling"
    echo "   • Creator ID field in question_packages table"
    echo "   • Row Level Security (RLS) policies"
    echo "   • Proper indexes for performance"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Test the new mentor functionality"
    echo "   2. Create mentor accounts through /mentor/register"
    echo "   3. Test mentor dashboard at /mentor"
    echo "   4. Verify package creation with creator_id"
    echo ""
    echo "📚 New Routes:"
    echo "   • /mentor - Mentor dashboard (for verified tentors)"
    echo "   • /mentor/register - Mentor registration form"
    echo ""
    echo "🔐 Security Features:"
    echo "   • Only tentors can access /mentor"
    • Only tentors can create packages with their creator_id
    echo "   • RLS policies protect all data"
    echo ""
    echo "🧪 Testing:"
    echo "   1. Register as mentor: /mentor/register"
    echo "   2. Access mentor dashboard: /mentor"
    echo "   3. Create test packages"
    echo "   4. Verify creator_id is set correctly"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
