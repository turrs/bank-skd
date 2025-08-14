#!/bin/bash

# Script untuk deploy role tentor ke database
# Pastikan Supabase CLI sudah terinstall dan terkonfigurasi

echo "🚀 Deploying Tentor Role Migration..."

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

# Deploy the migration
echo "📦 Deploying migration: add_tentor_role.sql"
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration deployed successfully!"
    echo ""
    echo "🎯 What was added:"
    echo "   • Role field to users table (student, tentor, admin)"
    echo "   • Tentor profiles table with detailed information"
    echo "   • Tentor sessions table for tracking interactions"
    echo "   • Tentor availability table for scheduling"
    echo "   • Row Level Security (RLS) policies"
    echo "   • Proper indexes for performance"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Update your application code to use the new role system"
    echo "   2. Create tentor accounts through your admin panel"
    echo "   3. Test the new functionality"
    echo ""
    echo "📚 Documentation:"
    echo "   • Users can now have roles: student, tentor, or admin"
    echo "   • Tentors can create profiles with specializations"
    echo "   • Students can book sessions with tentors"
    echo "   • All data is protected with RLS policies"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
