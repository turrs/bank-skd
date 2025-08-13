#!/bin/bash

# Deploy Supabase Edge Function
echo "🚀 Deploying Midtrans Edge Function to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if logged in to Supabase
if ! supabase status &> /dev/null; then
    echo "🔐 Please login to Supabase first:"
    echo "supabase login"
    exit 1
fi

# Deploy the function
echo "📦 Deploying midtrans function..."
supabase functions deploy midtrans --project-ref YOUR_PROJECT_REF

if [ $? -eq 0 ]; then
    echo "✅ Edge Function deployed successfully!"
    echo ""
    echo "🌐 Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/midtrans"
    echo ""
    echo "📋 Available endpoints:"
    echo "  POST /create-token     - Create Midtrans transaction"
    echo "  POST /check-status     - Check transaction status"
    echo "  POST /webhook          - Handle Midtrans webhooks"
    echo ""
    echo "🔧 Don't forget to:"
    echo "  1. Set environment variables in Supabase dashboard"
    echo "  2. Update frontend API calls to use Edge Function URL"
    echo "  3. Configure Midtrans webhook URL"
else
    echo "❌ Deployment failed!"
    exit 1
fi
