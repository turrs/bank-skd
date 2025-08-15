# 🧪 Test Struktur Data Ranking Tryout

## 📋 Overview
Test untuk memverifikasi struktur data yang benar dari Supabase query.

## 🔍 **Debug Steps:**

### **Step 1: Check Console Logs**
1. Buka Developer Tools → Console
2. Klik tombol "Lihat Ranking" pada package
3. Lihat semua log messages yang muncul

### **Step 2: Expected Console Output**
```
Loading ranking for package: [package-id]
Sessions data: [array]
Sessions type: object
Sessions length: [number]
Processed sessions: [array]
First session structure: {id, user_id, package_id, status, total_score, user: {...}}
First session keys: ["id", "user_id", "package_id", "status", "total_score", "user", ...]
First session user data: {full_name: "...", email: "..."}
Sessions with user data: [array dengan user info]
Ranking loaded successfully. Total sessions: [number]
```

### **Step 3: Check Data Structure**
Jika data berhasil di-load, struktur yang diharapkan:
```typescript
sessions = [
  {
    id: "uuid",
    user_id: "uuid",
    package_id: "uuid",
    status: "completed",
    total_score: 85,
    created_at: "2024-01-01T00:00:00Z",
    user: {
      full_name: "John Doe",
      email: "john@example.com"
    }
  }
]
```

## 🐛 **Common Issues & Solutions:**

### **Issue 1: "Sessions data: null"**
**Cause**: Query Supabase gagal
**Solution**: Check RLS policies dan foreign key relationships

### **Issue 2: "First session user data: undefined"**
**Cause**: Join query tidak berfungsi
**Solution**: Check foreign key constraint names

### **Issue 3: "First session keys: []"**
**Cause**: Data kosong atau struktur salah
**Solution**: Check database schema

### **Issue 4: Data ada tapi tidak ditampilkan**
**Cause**: Struktur data tidak sesuai dengan yang diharapkan
**Solution**: Adjust component untuk menggunakan struktur yang benar

## 🧪 **Database Test Queries:**

### **Test 1: Check tryout_sessions structure**
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tryout_sessions'
ORDER BY ordinal_position;
```

### **Test 2: Check foreign key relationships**
```sql
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'tryout_sessions';
```

### **Test 3: Check sample data with join**
```sql
SELECT 
  ts.id,
  ts.user_id,
  ts.package_id,
  ts.status,
  ts.total_score,
  ts.created_at,
  u.full_name,
  u.email
FROM tryout_sessions ts
LEFT JOIN users u ON ts.user_id = u.id
WHERE ts.status = 'completed'
LIMIT 5;
```

## 🔧 **Fix Steps:**

### **Step 1: Verify Foreign Key Name**
Jika foreign key name salah, update query:
```typescript
// Ganti dengan nama foreign key yang benar
user:users!mentor_withdrawals_mentor_id_fkey(full_name, email)

// Contoh yang mungkin benar:
user:users!tryout_sessions_user_id_fkey(full_name, email)
// atau
user:users(id, full_name, email)
```

### **Step 2: Simplify Query**
Jika join bermasalah, gunakan query terpisah:
```typescript
// Load sessions tanpa join
const { data: sessionsData } = await supabase
  .from('tryout_sessions')
  .select('*')
  .eq('package_id', packageId)
  .eq('status', 'completed')
  .order('total_score', { ascending: false });

// Load users terpisah
const userIds = [...new Set(sessionsData.map(s => s.user_id))];
const { data: usersData } = await supabase
  .from('users')
  .select('id, full_name, email')
  .in('id', userIds);
```

### **Step 3: Update Component Logic**
```typescript
// Map user data to sessions
const sessionsWithUsers = sessionsData.map(session => ({
  ...session,
  user: usersData.find(u => u.id === session.user_id)
}));
```

## 🚀 **Expected Results:**

### **After Fix:**
- ✅ Console menampilkan semua log messages
- ✅ Data sessions ter-load dengan struktur yang benar
- ✅ User info ter-load via join atau query terpisah
- ✅ Ranking ditampilkan dengan pagination
- ✅ Stats overview menampilkan data yang benar

## 🔄 **Next Steps:**

1. **Run test**: Klik tombol ranking dan lihat console
2. **Check structure**: Lihat "First session structure" log
3. **Verify foreign keys**: Check database constraints
4. **Adjust query**: Update foreign key names jika perlu

---

**Test struktur data ranking tryout dengan debugging yang detail!** 🎯
