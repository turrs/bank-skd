# 🚀 Deploy Midtrans Edge Function

## **Masalah yang Ditemukan:**
- Error: `payment_type is required` - karena menggunakan Core API bukan Snap API
- CORS error saat memanggil edge function
- Edge function belum di-deploy

## **Solusi yang Diterapkan:**

### 1. **Perbaikan Edge Function**
- ✅ Menggunakan Midtrans Snap API (`/v2/snap`)
- ✅ Menambahkan `payment_type` untuk payment methods
- ✅ CORS headers lengkap
- ✅ Logging untuk debugging

### 2. **Perbaikan Frontend**
- ✅ Menggunakan Snap token dengan benar
- ✅ Error handling yang lebih baik
- ✅ Logging untuk debugging

## **Langkah Deployment:**

### **Option 1: Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Login ke Supabase
supabase login

# Link project
supabase link --project-ref xpnsemqhnuuwwgatxqxk

# Deploy function
supabase functions deploy midtrans
```

### **Option 2: Manual via Dashboard**
1. Buka [supabase.com](https://supabase.com)
2. Pilih project `xpnsemqhnuuwwgatxqxk`
3. Buka **Edge Functions**
4. **Create new function** dengan nama `midtrans`
5. Upload kode dari `supabase/functions/midtrans/index.ts`

## **Environment Variables yang Harus Diset:**

### **Di Supabase Dashboard:**
```
MIDTRANS_SERVER_KEY=SB-Mid-server-YourServerKeyHere
MIDTRANS_CLIENT_KEY=SB-Mid-client-YourClientKeyHere
NODE_ENV=development
```

### **Di Frontend (.env):**
```
VITE_SUPABASE_URL=https://xpnsemqhnuuwwgatxqxk.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## **Test Edge Function:**

### **Test CORS:**
```bash
curl -X OPTIONS https://xpnsemqhnuuwwgatxqxk.supabase.co/functions/v1/midtrans/create-token
```

### **Test Create Token:**
```bash
curl -X POST https://xpnsemqhnuuwwgatxqxk.supabase.co/functions/v1/midtrans/create-token \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "test-123",
    "amount": 50000,
    "package_name": "Test Package",
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "customer_phone": "08123456789"
  }'
```

### **Test dengan File Payload:**
```bash
curl -X POST https://xpnsemqhnuuwwgatxqxk.supabase.co/functions/v1/midtrans/create-token \
  -H "Content-Type: application/json" \
  -d @test_midtrans_payload.json
```

## **Struktur Response yang Diharapkan:**

### **Success Response:**
```json
{
  "success": true,
  "token": "snap_token_here",
  "order_id": "order_id_here",
  "snap_token": "snap_token_here"
}
```

### **Error Response:**
```json
{
  "error": true,
  "message": "Error description",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## **Payment Flow:**

1. **Frontend** → Buat payment record di database
2. **Frontend** → Panggil edge function `/create-token`
3. **Edge Function** → Panggil Midtrans Snap API (`/v2/snap`)
4. **Edge Function** → Return Snap token
5. **Frontend** → Buka Snap popup dengan token
6. **User** → Pilih payment method dan bayar
7. **Midtrans** → Callback ke webhook

## **API Endpoints:**

### **Midtrans Snap API:**
- **Endpoint**: `/v2/snap`
- **Field Required**: `payment_type` (array of payment methods)
- **Response**: Snap token untuk popup

### **Midtrans Core API:**
- **Endpoint**: `/v2/charge`
- **Field Required**: `payment_type` (single payment method)
- **Response**: Direct payment processing

## **Troubleshooting:**

### **CORS Error:**
- Pastikan edge function sudah di-deploy
- Check CORS headers di response
- Verify URL endpoint benar

### **Midtrans Error:**
- Check server key dan client key
- Verify payload format
- Check Midtrans sandbox/production mode
- **Error 500**: Biasanya karena payload format salah atau environment variables tidak set
- **Error 400**: Field required tidak lengkap atau format salah

### **Function Not Found:**
- Deploy ulang edge function
- Check function name di dashboard
- Verify project reference

## **Monitoring:**

### **Logs:**
- Edge function logs ada di Supabase Dashboard
- Frontend logs ada di browser console
- Midtrans logs ada di Midtrans Dashboard

### **Status Check:**
- Test endpoint dengan Postman/curl
- Monitor network tab di browser
- Check Supabase realtime logs

## **Next Steps:**

1. ✅ Deploy edge function
2. ✅ Set environment variables
3. ✅ Test endpoint
4. ✅ Test payment flow
5. ✅ Monitor logs dan errors
6. ✅ Handle edge cases

---

**Note:** Linter errors di `index.ts` adalah normal untuk Deno edge function dan tidak mempengaruhi runtime.
