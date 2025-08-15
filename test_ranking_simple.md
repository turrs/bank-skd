# 🧪 Test Ranking Tryout - Simple Debug

## 📋 Overview
Test sederhana untuk memverifikasi ranking tryout berfungsi.

## 🔍 **Debug Steps:**

### **Step 1: Check Console Logs**
1. Buka Developer Tools → Console
2. Klik tombol "Lihat Ranking" pada package
3. Lihat log messages yang muncul

### **Step 2: Expected Console Output**
```
Loading ranking for package: [package-id]
Sessions data: [array atau null]
Sessions type: object
Sessions length: [number]
Processed sessions: [array]
Sessions with user data: [array dengan user info]
User data already loaded via join
Final user data object: {user-id: {full_name, email}}
Ranking loaded successfully. Total sessions: [number]
```

### **Step 3: Check Network Tab**
1. Buka Developer Tools → Network
2. Klik tombol "Lihat Ranking"
3. Lihat request ke Supabase:
   - URL: `tryout_sessions?select=*,user:users!...`
   - Response: Data sessions dengan user info

## 🐛 **Common Issues & Solutions:**

### **Issue 1: "Sessions data: null"**
**Cause**: Query Supabase gagal atau tidak ada data
**Solution**: Check database dan RLS policies

### **Issue 2: "Sessions length: 0"**
**Cause**: Tidak ada tryout_sessions dengan status 'completed'
**Solution**: Insert test data atau check status field

### **Issue 3: "User data already loaded via join" tidak muncul**
**Cause**: Join query tidak berfungsi
**Solution**: Check foreign key relationships

### **Issue 4: "Final user data object: {}"**
**Cause**: User data tidak ter-load
**Solution**: Check users table dan RLS policies

## 🧪 **Quick Database Test:**

### **Check tryout_sessions:**
```sql
SELECT COUNT(*) FROM tryout_sessions;
SELECT COUNT(*) FROM tryout_sessions WHERE status = 'completed';
SELECT * FROM tryout_sessions LIMIT 5;
```

### **Check users:**
```sql
SELECT COUNT(*) FROM users;
SELECT id, full_name, email FROM users LIMIT 5;
```

### **Check foreign key:**
```sql
SELECT 
  ts.id,
  ts.user_id,
  ts.package_id,
  ts.status,
  ts.total_score,
  u.full_name
FROM tryout_sessions ts
JOIN users u ON ts.user_id = u.id
WHERE ts.status = 'completed'
LIMIT 5;
```

## 🚀 **Expected Results:**

### **After Fix:**
- ✅ Console menampilkan semua log messages
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
]
```

## 🔄 **Next Steps:**

1. **Run test**: Klik tombol ranking dan lihat console
2. **Check database**: Pastikan ada data tryout_sessions
3. **Verify RLS**: Pastikan user bisa akses data
4. **Check foreign keys**: Pastikan referensi tabel benar

---

**Test ranking tryout dengan debugging yang lebih detail!** 🎯
