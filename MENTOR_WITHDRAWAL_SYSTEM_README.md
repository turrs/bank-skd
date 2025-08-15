# 🏦 Sistem Withdrawal Mentor

Sistem lengkap untuk mengelola balance dan withdrawal mentor berdasarkan penghasilan dari penjualan paket soal.

## 🎯 Fitur Utama

### ✅ Mentor Dashboard
- **Balance Overview**: Total earnings, available balance, total withdrawn
- **Withdrawal History**: Riwayat permintaan withdrawal dengan status
- **Earnings History**: Riwayat penghasilan dari sesi tryout
- **Request Withdrawal**: Form untuk mengajukan withdrawal

### ✅ Admin Management
- **Withdrawal Approval**: Persetujuan manual withdrawal mentor
- **Status Management**: Approve, reject, mark as complete
- **Mentor Balances**: Monitor balance semua mentor
- **Search & Filter**: Cari dan filter berdasarkan status

### ✅ Otomatis
- **Earnings Calculation**: Perhitungan otomatis komisi 10% dari sesi tryout
- **Balance Update**: Update balance otomatis saat earnings berubah
- **Trigger System**: Trigger database untuk real-time updates

## 🗄️ Struktur Database

### 1. Tabel `mentor_balances`
```sql
- id: UUID (Primary Key)
- mentor_id: UUID (Foreign Key ke users)
- total_earnings: DECIMAL(12,2) - Total penghasilan
- available_balance: DECIMAL(12,2) - Balance yang bisa di-withdraw
- total_withdrawn: DECIMAL(12,2) - Total yang sudah di-withdraw
- created_at, updated_at: TIMESTAMP
```

### 2. Tabel `mentor_withdrawals`
```sql
- id: UUID (Primary Key)
- mentor_id: UUID (Foreign Key ke users)
- amount: DECIMAL(12,2) - Jumlah withdrawal
- bank_name: VARCHAR(100) - Nama bank
- account_number: VARCHAR(50) - Nomor rekening
- account_holder: VARCHAR(100) - Atas nama
- status: ENUM('pending', 'approved', 'rejected', 'completed')
- admin_notes: TEXT - Catatan admin
- processed_at: TIMESTAMP - Waktu diproses
- created_at, updated_at: TIMESTAMP
```

### 3. Tabel `mentor_earnings`
```sql
- id: UUID (Primary Key)
- mentor_id: UUID (Foreign Key ke users)
- session_id: UUID (Foreign Key ke tryout_sessions)
- package_id: UUID (Foreign Key ke question_packages)
- student_id: UUID (Foreign Key ke users)
- amount: DECIMAL(8,2) - Harga paket
- commission_rate: DECIMAL(5,2) - Rate komisi (default 10%)
- commission_amount: DECIMAL(8,2) - Jumlah komisi
- status: ENUM('pending', 'approved', 'paid')
- created_at, updated_at: TIMESTAMP
```

## 🚀 Cara Implementasi

### Langkah 1: Jalankan Migration Database
```sql
-- Jalankan script ini di Supabase SQL Editor
-- File: create_mentor_balance_system.sql
```

### Langkah 2: Setup Earnings Calculation
```sql
-- Jalankan script ini di Supabase SQL Editor
-- File: calculate_mentor_earnings.sql
```

### Langkah 3: Hitung Earnings dari Sesi Existing
```sql
-- Jalankan fungsi ini untuk menghitung earnings dari sesi yang sudah ada
SELECT calculate_mentor_earnings_from_sessions();
```

### Langkah 4: Update Admin Dashboard
Tambahkan tab "Withdrawal Management" di Admin Dashboard dengan komponen `AdminWithdrawalManagement`.

### Langkah 5: Update Mentor Page
Tambahkan komponen `MentorBalance` di halaman mentor untuk menampilkan balance dan withdrawal.

## 💰 Sistem Komisi

### Rate Komisi
- **Default Rate**: 10% dari harga paket soal
- **Perhitungan**: `commission_amount = package_price × 10%`
- **Status**: 
  - `pending`: Menunggu approval admin
  - `approved`: Disetujui admin
  - `paid`: Sudah dibayar ke mentor

### Flow Earnings
1. **Student** menyelesaikan tryout
2. **System** otomatis hitung komisi mentor (10%)
3. **Earnings** status `pending`
4. **Admin** approve earnings → status `paid`
5. **Balance** mentor otomatis update
6. **Mentor** bisa request withdrawal

## 🏦 Sistem Withdrawal

### Status Withdrawal
1. **Pending**: Menunggu approval admin
2. **Approved**: Disetujui admin, siap transfer
3. **Rejected**: Ditolak admin dengan alasan
4. **Completed**: Transfer selesai

### Flow Withdrawal
1. **Mentor** request withdrawal dengan detail bank
2. **Admin** review dan approve/reject
3. **Admin** transfer manual ke rekening mentor
4. **Admin** mark as completed
5. **Balance** mentor otomatis update

## 🔧 Fungsi Database

### 1. `calculate_mentor_balance(mentor_id)`
- Hitung balance mentor dari earnings - withdrawals
- Return: DECIMAL(12,2)

### 2. `update_mentor_balance(mentor_id)`
- Update balance mentor secara otomatis
- Dipanggil via trigger saat earnings/withdrawals berubah

### 3. `calculate_mentor_earnings_from_sessions()`
- Hitung earnings dari sesi tryout yang sudah ada
- Insert ke tabel `mentor_earnings`

### 4. `approve_mentor_earnings(mentor_id)`
- Approve semua earnings pending mentor
- Update status ke `paid`
- Update balance mentor

## 🎨 UI Components

### 1. `MentorBalance.tsx`
- Dashboard balance mentor
- Form request withdrawal
- History earnings dan withdrawals
- Real-time balance updates

### 2. `AdminWithdrawalManagement.tsx`
- Management withdrawal requests
- Approve/reject/complete withdrawal
- Monitor mentor balances
- Search dan filter

## 🔒 Security & RLS

### Row Level Security (RLS)
- **Mentor**: Hanya bisa lihat data sendiri
- **Admin**: Bisa lihat dan manage semua data
- **Functions**: Menggunakan `SECURITY DEFINER`

### Permissions
- `mentor_balances`: SELECT (own), SELECT (admin)
- `mentor_withdrawals`: SELECT/INSERT (own), SELECT/UPDATE (admin)
- `mentor_earnings`: SELECT (own), SELECT (admin)

## 📊 Monitoring & Analytics

### Stats yang Tersedia
- Total withdrawal requests
- Pending approvals
- Total amount withdrawn
- Mentor balance overview
- Earnings per mentor

### Real-time Updates
- Balance update otomatis
- Status withdrawal real-time
- Earnings calculation otomatis

## 🚨 Troubleshooting

### Common Issues
1. **Balance tidak update**: Cek trigger functions
2. **Earnings tidak terhitung**: Jalankan `calculate_mentor_earnings_from_sessions()`
3. **RLS error**: Pastikan policies sudah dibuat dengan benar
4. **Permission denied**: Cek user role dan admin status

### Debug Queries
```sql
-- Cek earnings mentor
SELECT * FROM mentor_earnings WHERE mentor_id = 'MENTOR_UUID';

-- Cek balance mentor
SELECT * FROM mentor_balances WHERE mentor_id = 'MENTOR_UUID';

-- Cek withdrawal requests
SELECT * FROM mentor_withdrawals WHERE mentor_id = 'MENTOR_UUID';

-- Cek trigger functions
SELECT * FROM pg_trigger WHERE tgname LIKE '%mentor%';
```

## 🔄 Update & Maintenance

### Regular Tasks
1. **Monitor withdrawal requests** setiap hari
2. **Approve earnings** secara berkala
3. **Process withdrawals** sesuai jadwal
4. **Update commission rates** jika diperlukan

### Backup & Recovery
- Backup tabel `mentor_*` secara berkala
- Monitor disk space untuk log
- Test restore procedures

## 📱 Integration

### Frontend Integration
- Dashboard mentor dengan balance
- Admin panel untuk withdrawal management
- Real-time notifications untuk status changes
- Mobile responsive design

### API Endpoints
- `GET /mentor/balance` - Get mentor balance
- `POST /mentor/withdrawal` - Request withdrawal
- `GET /admin/withdrawals` - Get all withdrawals
- `PUT /admin/withdrawal/:id` - Update withdrawal status

## 🎉 Hasil Akhir

Setelah implementasi lengkap, sistem akan memiliki:

✅ **Mentor Dashboard** dengan balance real-time  
✅ **Admin Management** untuk approval withdrawal  
✅ **Otomatis Calculation** earnings dari sesi tryout  
✅ **Secure System** dengan RLS dan admin approval  
✅ **Real-time Updates** balance dan status  
✅ **Comprehensive Tracking** semua transaksi  

Sistem ini memberikan mentor transparansi penuh atas penghasilan mereka dan admin kontrol penuh atas proses withdrawal! 🚀
