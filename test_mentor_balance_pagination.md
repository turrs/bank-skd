# 🧪 Test Pagination MentorBalance

## 📋 Overview
Dokumen ini menjelaskan cara test pagination yang sudah ditambahkan di komponen `MentorBalance` untuk tab Withdrawal History dan Earnings History.

## ✨ Fitur Pagination yang Ditambahkan

### 1. **State Management**
- `currentWithdrawalPage`: Halaman aktif untuk withdrawal history
- `currentEarningPage`: Halaman aktif untuk earnings history
- `itemsPerPage`: Maksimal 5 item per halaman

### 2. **Fungsi Pagination**
- `getPaginatedWithdrawals()`: Ambil data withdrawal sesuai halaman aktif
- `getPaginatedEarnings()`: Ambil data earnings sesuai halaman aktif
- `totalWithdrawalPages`: Total halaman untuk withdrawal
- `totalEarningPages`: Total halaman untuk earnings

### 3. **Auto-reset Pagination**
- Reset ke halaman 1 ketika tab berubah
- Reset ke halaman 1 setelah submit withdrawal baru

## 🎯 Test Scenarios

### **Scenario 1: Withdrawal History Pagination**
1. **Setup**: Pastikan ada lebih dari 5 withdrawal records
2. **Test Steps**:
   - Buka tab "Withdrawal History"
   - Verifikasi hanya 5 item yang ditampilkan
   - Klik "Next" → halaman 2
   - Verifikasi item 6-10 ditampilkan
   - Klik "Previous" → kembali ke halaman 1
   - Klik nomor halaman langsung (misal: halaman 3)

### **Scenario 2: Earnings History Pagination**
1. **Setup**: Pastikan ada lebih dari 5 earnings records
2. **Test Steps**:
   - Buka tab "Earnings History"
   - Verifikasi hanya 5 item yang ditampilkan
   - Test navigasi pagination seperti withdrawal

### **Scenario 3: Tab Switching**
1. **Test Steps**:
   - Buka tab "Withdrawal History" → halaman 2
   - Switch ke tab "Earnings History"
   - Verifikasi kembali ke halaman 1
   - Switch kembali ke "Withdrawal History"
   - Verifikasi kembali ke halaman 1

### **Scenario 4: Data Update**
1. **Test Steps**:
   - Submit withdrawal baru
   - Verifikasi pagination reset ke halaman 1
   - Verifikasi data terbaru muncul di halaman 1

## 🔍 Expected Results

### **Pagination Controls**
- ✅ **Previous/Next buttons**: Disabled ketika di halaman pertama/terakhir
- ✅ **Page numbers**: Tampil dengan format yang benar (1, 2, 3, ..., 10)
- ✅ **Ellipsis**: Muncul ketika ada banyak halaman (...)
- ✅ **Current page**: Highlight dengan variant "default"

### **Data Display**
- ✅ **Items per page**: Maksimal 5 item
- ✅ **Page info**: "Showing X to Y of Z items"
- ✅ **Data consistency**: Data sesuai dengan halaman yang dipilih

### **State Management**
- ✅ **Tab change**: Pagination reset ke halaman 1
- ✅ **Data reload**: Pagination reset ke halaman 1
- ✅ **Page navigation**: State berubah sesuai navigasi

## 🐛 Common Issues & Solutions

### **Issue 1: Pagination tidak muncul**
**Cause**: Total pages <= 1
**Solution**: Pastikan ada lebih dari 5 records

### **Issue 2: Data tidak berubah saat ganti halaman**
**Cause**: State tidak ter-update
**Solution**: Check `onPageChange` handler

### **Issue 3: Pagination tidak reset saat tab change**
**Cause**: `handleTabChange` tidak terpanggil
**Solution**: Pastikan `onValueChange` pada Tabs component

### **Issue 4: Page numbers tidak sesuai**
**Cause**: Logic `getPageNumbers()` salah
**Solution**: Check pagination algorithm

## 📱 UI Components

### **Pagination Component**
```typescript
<Pagination
  currentPage={currentWithdrawalPage}
  totalPages={totalWithdrawalPages}
  onPageChange={setCurrentWithdrawalPage}
  label="withdrawals"
/>
```

### **Page Info Display**
```
Showing 1 to 5 of 23 withdrawals
```

### **Navigation Buttons**
- Previous (disabled jika halaman 1)
- Page numbers (1, 2, 3, ..., 10)
- Next (disabled jika halaman terakhir)

## 🚀 Performance Considerations

### **Data Loading**
- ✅ **Client-side pagination**: Data sudah di-load semua, pagination hanya UI
- ✅ **No API calls**: Tidak ada request tambahan saat ganti halaman
- ✅ **Fast navigation**: Instant page switching

### **Memory Usage**
- ✅ **Efficient slicing**: `array.slice(start, end)` untuk data per halaman
- ✅ **No data duplication**: Data tidak di-copy, hanya reference

## 🔄 Future Enhancements

### **Server-side Pagination**
- Load data per halaman dari API
- Implement infinite scroll
- Add loading states

### **Advanced Features**
- Page size selector (5, 10, 20, 50)
- Jump to page input
- Export data per halaman

---

**Pagination sudah siap digunakan dengan maksimal 5 item per halaman!** 🎉
