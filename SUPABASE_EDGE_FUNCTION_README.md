# 🚀 Supabase Edge Function untuk Midtrans

## **📋 Overview**
Edge Function ini menggantikan `server.js` lokal dan berjalan di Supabase untuk memproses pembayaran Midtrans.

## **🏗️ Struktur File**
```
supabase/functions/midtrans/
├── index.ts              # Main Edge Function code
├── config.toml           # Function configuration
├── import_map.json       # Import mappings
└── env.example           # Environment variables template
```

## **🔧 Setup dan Deploy**

### **1. Install Supabase CLI**
```bash
npm install -g supabase
```

### **2. Login ke Supabase**
```bash
supabase login
```

### **3. Link Project (jika belum)**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### **4. Set Environment Variables**
Di Supabase Dashboard → Settings → Edge Functions:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
NODE_ENV=development
```

### **5. Deploy Function**
```bash
# Deploy manual
supabase functions deploy midtrans --project-ref YOUR_PROJECT_REF

# Atau gunakan script
chmod +x deploy-edge-function.sh
./deploy-edge-function.sh
```

## **🌐 Endpoints**

### **POST /create-token**
Membuat transaksi Midtrans baru.

**Request Body:**
```json
{
  "payment_id": "uuid",
  "amount": 50000,
  "package_name": "Paket SKD CPNS 2024",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "08123456789"
}
```

**Response:**
```json
{
  "success": true,
  "token": "https://app.sandbox.midtrans.com/snap/v1/transactions/...",
  "order_id": "uuid",
  "redirect_url": "https://app.sandbox.midtrans.com/snap/v1/transactions/..."
}
```

### **POST /check-status**
Cek status transaksi Midtrans.

**Request Body:**
```json
{
  "order_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "order_id": "uuid",
  "status": "settlement",
  "payment_status": "completed",
  "amount": 50000
}
```

### **POST /webhook**
Handle notifikasi dari Midtrans.

**Request Body:**
```json
{
  "order_id": "uuid",
  "transaction_status": "settlement",
  "gross_amount": 50000
}
```

## **🔐 Security Features**

### **CORS Headers**
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`

### **JWT Verification**
- `verify_jwt = false` (untuk Midtrans webhook)
- Gunakan `SUPABASE_SERVICE_ROLE_KEY` untuk database access

### **Input Validation**
- Validasi semua required fields
- Sanitasi input data
- Error handling yang comprehensive

## **📊 Database Integration**

### **Tables Used**
- `payments` - Payment records
- `user_package_access` - Package access management

### **Automatic Updates**
- Update payment status dari Midtrans
- Grant package access otomatis setelah pembayaran berhasil
- Handle duplicate access prevention

## **🚀 Frontend Integration**

### **Update API Calls**
```typescript
// Sebelum (localhost)
const response = await fetch('http://localhost:3001/api/midtrans/create-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// Sesudah (Edge Function)
const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/midtrans/create-token`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
  },
  body: JSON.stringify(data)
});
```

### **Environment Variables**
```bash
# .env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## **🔍 Testing**

### **Local Testing**
```bash
# Start Supabase locally
supabase start

# Test function locally
supabase functions serve midtrans --env-file ./supabase/functions/midtrans/env.example

# Test endpoint
curl -X POST http://localhost:54321/functions/v1/midtrans/create-token \
  -H "Content-Type: application/json" \
  -d '{"payment_id":"test","amount":50000,"package_name":"Test","customer_name":"Test","customer_email":"test@test.com"}'
```

### **Production Testing**
```bash
# Deploy dan test
supabase functions deploy midtrans --project-ref YOUR_PROJECT_REF

# Test production endpoint
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/midtrans/create-token \
  -H "Content-Type: application/json" \
  -d '{"payment_id":"test","amount":50000,"package_name":"Test","customer_name":"Test","customer_email":"test@test.com"}'
```

## **📝 Logs dan Monitoring**

### **View Logs**
```bash
# Local logs
supabase functions logs midtrans

# Production logs
supabase functions logs midtrans --project-ref YOUR_PROJECT_REF
```

### **Real-time Logs**
```bash
# Follow logs
supabase functions logs midtrans --follow --project-ref YOUR_PROJECT_REF
```

## **🔄 Webhook Configuration**

### **Midtrans Dashboard**
1. Login ke Midtrans Dashboard
2. Go to Settings → Callbacks
3. Set Webhook URL:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/midtrans/webhook
   ```

### **Webhook Security**
- Implement signature verification (optional)
- Rate limiting
- IP whitelist (jika diperlukan)

## **🚨 Troubleshooting**

### **Common Issues**

#### **1. Function Not Deployed**
```bash
# Check function status
supabase functions list --project-ref YOUR_PROJECT_REF

# Redeploy
supabase functions deploy midtrans --project-ref YOUR_PROJECT_REF
```

#### **2. Environment Variables Not Set**
```bash
# Check current env vars
supabase functions list --project-ref YOUR_PROJECT_REF

# Set env vars
supabase secrets set --project-ref YOUR_PROJECT_REF MIDTRANS_SERVER_KEY=your_key
```

#### **3. CORS Issues**
- Pastikan `verify_jwt = false` di `config.toml`
- Check CORS headers di code

#### **4. Database Connection Issues**
- Verify `SUPABASE_SERVICE_ROLE_KEY`
- Check RLS policies
- Ensure tables exist

### **Debug Mode**
```typescript
// Tambahkan di index.ts untuk debug
console.log('Request body:', body)
console.log('Environment:', Deno.env.get('NODE_ENV'))
console.log('Supabase URL:', Deno.env.get('SUPABASE_URL'))
```

## **📈 Performance Tips**

### **Optimizations**
- Use connection pooling
- Implement caching untuk Midtrans responses
- Batch database operations
- Use proper indexes

### **Monitoring**
- Monitor function execution time
- Track database query performance
- Monitor Midtrans API response times

## **🔮 Future Enhancements**

### **Planned Features**
- [ ] Signature verification untuk webhooks
- [ ] Rate limiting
- [ ] Caching layer
- [ ] Metrics collection
- [ ] A/B testing support

### **Scalability**
- Horizontal scaling dengan multiple instances
- Database connection pooling
- CDN integration
- Load balancing

## **📚 Resources**

### **Documentation**
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Midtrans API Documentation](https://api-docs.midtrans.com/)
- [Deno Runtime](https://deno.land/manual)

### **Examples**
- [Supabase Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)
- [Midtrans Integration Examples](https://github.com/Midtrans/midtrans-nodejs-client)

---

**🎯 Goal:** Edge Function ini memberikan solusi serverless yang scalable dan reliable untuk integrasi Midtrans, menggantikan server lokal dengan infrastructure yang managed oleh Supabase.
