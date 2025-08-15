# 🐛 Debug Ranking Tryout - Tidak Ada Data

## 📋 Overview
Dokumen ini menjelaskan masalah dan solusi untuk ranking tryout yang tidak menampilkan data.

## 🔍 **Masalah yang Ditemukan:**

### 1. **Import Entities Bermasalah**
```typescript
// ❌ Sebelum (Error)
import { TryoutSession, User } from "@/entities";

// ✅ Sesudah (Fixed)
import { supabase } from "@/lib/db/supabase";
```

### 2. **Struktur Data TryoutSession**
```typescript
// ❌ Sebelum (Tidak ada data)
const sessionsRaw = await TryoutSession.list();
const sessions = Array.isArray(sessionsRaw?.data) ? sessionsRaw.data.filter(...) : [];

// ✅ Sesudah (Direct Supabase)
const { data: sessionsData, error: sessionsError } = await supabase
  .from('tryout_sessions')
  .select(`
    *,
    user:users!tryout_sessions_user_id_fkey(full_name, email)
  `)
  .eq('package_id', packageId)
  .eq('status', 'completed')
  .order('total_score', { ascending: false });
```

### 3. **Struktur Data User**
```typescript
// ❌ Sebelum (Error)
const user = await User.get(userId);
userData[userId] = user;

// ✅ Sesudah (Direct Supabase)
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('full_name, email')
  .eq('id', userId)
  .single();
```

## 🎯 **Root Cause Analysis:**

### **Issue 1: Entities Import Error**
- **Problem**: `TryoutSession.list()` dan `User.get()` tidak berfungsi
- **Cause**: Entities menggunakan custom client yang mungkin bermasalah
- **Solution**: Gunakan Supabase client langsung

### **Issue 2: Data Structure Mismatch**
- **Problem**: Data tidak sesuai dengan struktur yang diharapkan
- **Cause**: Filter dan mapping yang salah
- **Solution**: Query Supabase langsung dengan join

### **Issue 3: User Data Loading**
- **Problem**: User data tidak ter-load
- **Cause**: User entity tidak berfungsi
- **Solution**: Query users table langsung

## 🔧 **Solusi yang Diterapkan:**

### **1. Direct Supabase Query**
```typescript
const { data: sessionsData, error: sessionsError } = await supabase
  .from('tryout_sessions')
  .select(`
    *,
    user:users!tryout_sessions_user_id_fkey(full_name, email)
  `)
  .eq('package_id', packageId)
  .eq('status', 'completed')
  .order('total_score', { ascending: false });
```

### **2. Proper Error Handling**
```typescript
if (sessionsError) {
  console.error('Error loading tryout sessions:', sessionsError);
  return;
}
```

### **3. Debug Logging**
```typescript
console.log('Loading ranking for package:', packageId);
console.log('Sessions data:', sessionsData);
console.log('Ranking loaded successfully. Total sessions:', sessions.length);
```

## 📊 **Struktur Data yang Diharapkan:**

### **Tryout Sessions Table**
```sql
CREATE TABLE tryout_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  package_id UUID REFERENCES question_packages(id),
  status VARCHAR(20), -- 'completed', 'in_progress', 'abandoned'
  total_score INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER,
  time_taken INTEGER,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

### **Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  full_name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(20),
  created_at TIMESTAMP
);
```

## 🧪 **Test Steps untuk Verifikasi:**

### **Step 1: Check Database**
```sql
-- Check if tryout_sessions exist
SELECT COUNT(*) FROM tryout_sessions;

-- Check if there are completed sessions
SELECT COUNT(*) FROM tryout_sessions WHERE status = 'completed';

-- Check specific package
SELECT COUNT(*) FROM tryout_sessions 
WHERE package_id = 'your-package-id' AND status = 'completed';
```

### **Step 2: Check Console Logs**
1. Buka Developer Tools → Console
2. Klik tombol "Lihat Ranking" pada package
3. Lihat log messages:
   - "Loading ranking for package: [id]"
   - "Sessions data: [array]"
   - "Ranking loaded successfully. Total sessions: [number]"

### **Step 3: Check Network Tab**
1. Buka Developer Tools → Network
2. Klik tombol "Lihat Ranking"
3. Lihat request ke Supabase:
   - URL: `tryout_sessions?select=*,user:users!...`
   - Response: Data sessions dengan user info

## 🐛 **Common Issues & Solutions:**

### **Issue 1: "No data found"**
**Cause**: Tidak ada tryout_sessions dengan status 'completed'
**Solution**: 
```sql
-- Insert test data
INSERT INTO tryout_sessions (user_id, package_id, status, total_score)
VALUES ('user-id', 'package-id', 'completed', 85);
```

### **Issue 2: "Foreign key constraint failed"**
**Cause**: package_id atau user_id tidak valid
**Solution**: Pastikan ID yang digunakan ada di tabel referensi

### **Issue 3: "RLS policy violation"**
**Cause**: Row Level Security mencegah akses
**Solution**: Check RLS policies untuk tryout_sessions

### **Issue 4: "Column does not exist"**
**Cause**: Struktur tabel berbeda
**Solution**: Check schema tabel dengan:
```sql
\d tryout_sessions
```

## 🚀 **Expected Results:**

### **After Fix:**
- ✅ Console menampilkan log loading
- ✅ Data sessions ter-load dengan benar
- ✅ User info ter-load dengan benar
- ✅ Ranking ditampilkan dengan pagination
- ✅ Stats overview menampilkan data yang benar

### **Data yang Diharapkan:**
```typescript
sessions = [
  {
    id: "session-1",
    user_id: "user-1",
    package_id: "package-1",
    status: "completed",
    total_score: 95,
    user: {
      full_name: "John Doe",
      email: "john@example.com"
    }
  }
  // ... more sessions
]
```

## 🔄 **Next Steps:**

1. **Test dengan data real**: Pastikan ada tryout_sessions di database
2. **Check RLS policies**: Pastikan user bisa akses data
3. **Verify foreign keys**: Pastikan referensi tabel benar
4. **Monitor console logs**: Lihat apakah ada error lain

---

**Ranking tryout sudah diperbaiki dengan direct Supabase query dan proper error handling!** 🎉
