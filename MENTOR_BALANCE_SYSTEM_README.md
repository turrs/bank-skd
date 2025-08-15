# 🏦 Sistem Mentor Balance & Withdrawal

## 📋 Overview
Sistem ini memungkinkan mentor untuk melihat balance mereka, request withdrawal, dan admin untuk mengelola permintaan withdrawal. Balance dihitung dari komisi 10% dari payment yang completed.

## 🗄️ Database Schema

### 1. `mentor_balances` Table
```sql
CREATE TABLE public.mentor_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  total_earnings DECIMAL(12,2) DEFAULT 0.00,
  available_balance DECIMAL(12,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. `mentor_withdrawals` Table
```sql
CREATE TABLE public.mentor_withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  account_holder VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. `mentor_earnings` Table
```sql
CREATE TABLE public.mentor_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.question_packages(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payment_amount DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  commission_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Setup Database

### Langkah 1: Jalankan Script SQL
1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy dan paste seluruh isi file `corrected_mentor_balance.sql`
3. Klik **Run**

### Langkah 2: Test Sistem
```sql
-- Test calculate earnings from completed payments
SELECT calculate_mentor_earnings_from_payments();

-- View all earnings
SELECT * FROM public.mentor_earnings ORDER BY created_at DESC;

-- View mentor balances
SELECT * FROM public.mentor_balances ORDER BY available_balance DESC;

-- View all withdrawals
SELECT * FROM public.mentor_withdrawals ORDER BY created_at DESC;
```

## 📊 Cara Kerja Sistem

### 1. **Payment Completed** → Hitung Komisi
- Ketika payment status = 'completed'
- Ambil amount yang dibayar
- Hitung komisi 10%: `amount * 10 / 100`
- Insert ke `mentor_earnings` dengan status 'paid'

### 2. **Balance Calculation**
- **Total Earnings** = SUM(commission_amount) dari earnings dengan status 'paid'
- **Available Balance** = Total Earnings - Total Withdrawn
- **Total Withdrawn** = SUM(amount) dari withdrawals dengan status 'approved' atau 'completed'

### 3. **Withdrawal Process**
- Mentor request withdrawal dari available balance
- Admin approve/reject withdrawal
- Status: pending → approved → completed

## 🎯 Frontend Components

### 1. **MentorBalance.tsx** (untuk Mentor)
- Tampilkan balance overview (Total Earnings, Available Balance, Total Withdrawn)
- Form request withdrawal
- History earnings dan withdrawals
- Tab: Withdrawal History & Earnings History

### 2. **AdminWithdrawalManagement.tsx** (untuk Admin)
- Overview statistik withdrawal
- Kelola withdrawal requests (approve/reject/complete)
- Lihat balance semua mentor
- Tab: Withdrawal Requests & Mentor Balances

## 🔐 Security Features

### RLS Policies
- **Mentor**: Hanya bisa lihat data sendiri
- **Admin**: Bisa lihat semua data
- **Functions**: Menggunakan `SECURITY DEFINER` untuk bypass RLS

### Data Validation
- Amount withdrawal tidak boleh melebihi available balance
- Status withdrawal: pending → approved → completed
- Commission rate default 10%

## 🚀 Functions & Triggers

### 1. **calculate_mentor_balance(UUID)**
- Hitung available balance mentor
- Return: total_earned - total_withdrawn

### 2. **update_mentor_balance(UUID)**
- Update atau insert balance mentor
- Menggunakan `ON CONFLICT` untuk upsert

### 3. **calculate_mentor_earnings_from_payments()**
- Hitung earnings dari payment yang completed
- Auto-insert ke `mentor_earnings`
- Update balance mentor

## 📱 Integration

### 1. **MentorPage.tsx**
```typescript
<TabsTrigger value="balance" className="flex items-center gap-2">
  <Wallet className="w-4 h-4" />
  Balance & Withdrawal
</TabsTrigger>

<TabsContent value="balance" className="space-y-6">
  <MentorBalance mentorId={user.id} />
</TabsContent>
```

### 2. **AdminDashboard.tsx**
```typescript
<TabsTrigger value="withdrawal-management" className="flex items-center space-x-2">
  <Wallet className="w-4 h-4" />
  <span className="text-blue-900">Withdrawal</span>
</TabsTrigger>

<TabsContent value="withdrawal-management" className="mt-6">
  <AdminWithdrawalManagement />
</TabsContent>
```

## 🐛 Troubleshooting

### Error: "Cannot read properties of undefined (reading 'toLocaleString')"
**Penyebab**: Nilai balance/amount undefined saat dipanggil `toLocaleString()`

**Solusi**: Gunakan null coalescing operator
```typescript
// ❌ Salah
Rp {balance?.total_earnings?.toLocaleString() || '0'}

// ✅ Benar
Rp {(balance?.total_earnings || 0).toLocaleString()}
```

### Error: "numeric field overflow"
**Penyebab**: Data type `DECIMAL(8,2)` terlalu kecil

**Solusi**: Gunakan `DECIMAL(12,2)` untuk support amount besar
```sql
payment_amount DECIMAL(12,2) NOT NULL,
commission_amount DECIMAL(12,2) NOT NULL,
```

## 📈 Monitoring & Maintenance

### 1. **Check System Health**
```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'mentor_%';

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%mentor%';

-- Check policies
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' AND tablename LIKE 'mentor_%';
```

### 2. **Manual Balance Update**
```sql
-- Update balance mentor tertentu
SELECT update_mentor_balance('mentor-uuid-here');

-- Recalculate semua earnings
SELECT calculate_mentor_earnings_from_payments();
```

### 3. **Data Cleanup**
```sql
-- Hapus withdrawal yang lama (opsional)
DELETE FROM mentor_withdrawals 
WHERE created_at < NOW() - INTERVAL '1 year' 
AND status IN ('rejected', 'completed');
```

## 🎉 Fitur Utama

✅ **Balance Calculation** dari payment completed  
✅ **Commission System** 10% otomatis  
✅ **Withdrawal Management** dengan approval admin  
✅ **Real-time Updates** balance otomatis  
✅ **Security** dengan RLS policies  
✅ **Audit Trail** lengkap untuk semua transaksi  
✅ **Responsive UI** untuk mobile dan desktop  
✅ **Multi-language** support (ID/EN)  

## 🔄 Update & Maintenance

### Auto-update Balance
- Setiap ada payment completed → update earnings → update balance
- Setiap ada withdrawal status change → update balance
- Menggunakan PostgreSQL functions dan triggers

### Manual Maintenance
- Jalankan `calculate_mentor_earnings_from_payments()` untuk sync data lama
- Monitor balance discrepancies dengan query manual
- Backup data sebelum major updates

---

**Sistem ini sudah siap digunakan dan terintegrasi dengan frontend!** 🚀
