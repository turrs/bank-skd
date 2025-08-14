# 🎓 Sistem Role Akun Tentor - SKD CPNS

## 📋 Overview

Sistem role akun tentor memungkinkan platform SKD CPNS untuk memiliki tiga jenis akun:
- **Student** (default): Pengguna yang mengikuti tryout dan belajar
- **Tentor**: Pengajar yang memberikan bimbingan dan konsultasi
- **Admin**: Administrator platform dengan akses penuh

## 🏗️ Struktur Database

### 1. Tabel `users` (Updated)
```sql
ALTER TABLE users 
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'student' 
CHECK (role IN ('student', 'tentor', 'admin'));
```

**Field Baru:**
- `role`: Jenis akun (student, tentor, admin)
- `is_admin`: Tetap ada untuk backward compatibility

### 2. Tabel `tentor_profiles`
Informasi detail tentang tentor:
- **Personal Info**: Bio, pengalaman, pendidikan
- **Specialization**: Bidang yang diajarkan (TWK, TIU, TKP)
- **Contact**: WhatsApp, Telegram, LinkedIn
- **Verification**: Status verifikasi admin
- **Pricing**: Tarif per jam

### 3. Tabel `tentor_sessions`
Sesi bimbingan antara tentor dan student:
- **Session Info**: Jenis, tanggal, durasi, status
- **Content**: Catatan, feedback, rating
- **Payment**: Biaya dan status pembayaran

### 4. Tabel `tentor_availability`
Jadwal ketersediaan tentor:
- **Schedule**: Hari dan jam tersedia
- **Flexibility**: Bisa diaktifkan/nonaktifkan

## 🔐 Keamanan (Row Level Security)

### RLS Policies
- **Tentor Profiles**: Public read untuk verified tentors, private untuk own profile
- **Tentor Sessions**: Hanya participant (tentor/student) yang bisa akses
- **Tentor Availability**: Public read, private write untuk tentor

## 🚀 Cara Deploy

### 1. Jalankan Migration
```bash
# Pastikan Supabase CLI terinstall
chmod +x deploy_tentor_role.sh
./deploy_tentor_role.sh
```

### 2. Manual Deployment
```bash
supabase db push
```

## 📱 Penggunaan dalam Aplikasi

### 1. Check User Role
```typescript
import { User } from '@/entities';

const user = await User.get();
if (user?.role === 'tentor') {
  // User is a tentor
  // Show tentor-specific features
}
```

### 2. Create Tentor Profile
```typescript
import { TentorProfile } from '@/entities';

const tentorProfile = await TentorProfile.create({
  user_id: userId,
  specialization: ['TWK', 'TIU'],
  experience_years: 3,
  education_level: 'S1',
  bio: 'Tentor berpengalaman SKD CPNS',
  hourly_rate: 100000,
  whatsapp: '+6281234567890'
});
```

### 3. Book Tentor Session
```typescript
import { TentorSession } from '@/entities';

const session = await TentorSession.create({
  tentor_id: tentorId,
  student_id: studentId,
  package_id: packageId,
  session_type: 'consultation',
  session_date: new Date('2024-12-20T10:00:00Z'),
  duration_minutes: 60,
  amount: 100000
});
```

## 🎯 Fitur Utama

### Untuk Tentor:
- ✅ Buat dan edit profil
- ✅ Set jadwal ketersediaan
- ✅ Terima booking dari student
- ✅ Kelola sesi bimbingan
- ✅ Lihat feedback dan rating

### Untuk Student:
- ✅ Cari tentor berdasarkan specialization
- ✅ Lihat profil dan jadwal tentor
- ✅ Book sesi bimbingan
- ✅ Berikan feedback dan rating
- ✅ Bayar sesi bimbingan

### Untuk Admin:
- ✅ Verifikasi akun tentor
- ✅ Monitor semua sesi bimbingan
- ✅ Kelola platform secara keseluruhan

## 🔄 Migration Path

### Existing Users
- **Admin users**: Otomatis mendapat role 'admin'
- **Regular users**: Otomatis mendapat role 'student'
- **No data loss**: Semua data existing tetap aman

### Backward Compatibility
- Field `is_admin` tetap ada dan berfungsi
- Aplikasi lama tetap bisa berjalan
- Gradual migration ke sistem role baru

## 📊 Contoh Data

### Sample Tentor Profile
```json
{
  "user_id": "uuid-here",
  "specialization": ["TWK", "TIU"],
  "experience_years": 5,
  "education_level": "S2",
  "bio": "Tentor SKD CPNS dengan pengalaman 5 tahun. Spesialis TWK dan TIU.",
  "hourly_rate": 150000,
  "is_verified": true,
  "is_active": true,
  "whatsapp": "+6281234567890",
  "telegram": "@tentorskd",
  "linkedin": "linkedin.com/in/tentorskd"
}
```

### Sample Tentor Session
```json
{
  "tentor_id": "tentor-uuid",
  "student_id": "student-uuid",
  "package_id": "package-uuid",
  "session_type": "review",
  "session_date": "2024-12-20T10:00:00Z",
  "duration_minutes": 90,
  "status": "scheduled",
  "amount": 225000,
  "payment_status": "pending"
}
```

## 🛠️ Development

### Entity Files
- `src/entities/TentorProfile.json`
- `src/entities/TentorSession.json`
- `src/entities/TentorAvailability.json`

### API Endpoints
Semua entity sudah terintegrasi dengan Supabase client dan bisa digunakan langsung.

## 🔍 Testing

### 1. Test Role Assignment
```sql
-- Check existing users
SELECT email, full_name, role, is_admin FROM users;

-- Create test tentor
INSERT INTO users (email, full_name, role) 
VALUES ('test-tentor@example.com', 'Test Tentor', 'tentor');
```

### 2. Test Tentor Profile
```sql
-- Create tentor profile
INSERT INTO tentor_profiles (user_id, specialization, bio, is_verified) 
VALUES (
  (SELECT id FROM users WHERE email = 'test-tentor@example.com'),
  ARRAY['TWK', 'TIU'],
  'Test tentor profile',
  true
);
```

## 🚨 Troubleshooting

### Common Issues
1. **Migration fails**: Pastikan Supabase CLI terinstall dan terkonfigurasi
2. **RLS errors**: Check apakah user sudah login dan memiliki permission yang tepat
3. **Role not working**: Pastikan field `role` sudah terisi dengan benar

### Debug Commands
```sql
-- Check table structure
\d tentor_profiles
\d tentor_sessions
\d tentor_availability

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename LIKE 'tentor%';
```

## 📈 Next Steps

1. **UI Development**: Buat interface untuk tentor dan student
2. **Payment Integration**: Integrasikan sistem pembayaran untuk sesi bimbingan
3. **Notification System**: Email/SMS untuk booking dan reminder
4. **Analytics**: Dashboard untuk monitoring performa tentor
5. **Mobile App**: Aplikasi mobile untuk booking dan komunikasi

## 📞 Support

Untuk pertanyaan atau masalah teknis, silakan buat issue di repository atau hubungi tim development.

---

**Version**: 1.0.0  
**Last Updated**: December 19, 2024  
**Author**: SKD CPNS Development Team
