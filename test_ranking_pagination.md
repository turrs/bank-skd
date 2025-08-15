# 🧪 Test Pagination PackageRanking

## 📋 Overview
Dokumen ini menjelaskan cara test pagination yang sudah ditambahkan di komponen `PackageRanking` untuk popup ranking paket soal dengan maksimal 10 data per halaman.

## ✨ Fitur Pagination yang Ditambahkan

### 1. **State Management**
- `allScores`: Semua data ranking yang di-load
- `topScores`: Data ranking yang ditampilkan per halaman
- `currentPage`: Halaman aktif saat ini
- `itemsPerPage`: Maksimal 10 item per halaman

### 2. **Fungsi Pagination**
- `updatePaginatedScores()`: Update data yang ditampilkan sesuai halaman
- `handlePageChange()`: Handle perubahan halaman
- `totalPages`: Total halaman berdasarkan jumlah data

### 3. **Auto-reset Pagination**
- Reset ke halaman 1 ketika package berubah
- Auto-update data ketika halaman berubah

## 🎯 Test Scenarios

### **Scenario 1: Basic Pagination**
1. **Setup**: Pastikan ada lebih dari 10 peserta yang menyelesaikan tryout
2. **Test Steps**:
   - Buka popup ranking paket soal
   - Verifikasi hanya 10 item yang ditampilkan
   - Klik "Next" → halaman 2
   - Verifikasi item 11-20 ditampilkan
   - Klik "Previous" → kembali ke halaman 1

### **Scenario 2: Page Navigation**
1. **Test Steps**:
   - Klik nomor halaman langsung (misal: halaman 3)
   - Verifikasi data berubah sesuai halaman
   - Test Previous/Next buttons
   - Verifikasi button disabled di halaman pertama/terakhir

### **Scenario 3: Package Change**
1. **Test Steps**:
   - Buka ranking paket A → halaman 2
   - Ganti ke paket B
   - Verifikasi kembali ke halaman 1
   - Verifikasi data berubah sesuai paket baru

### **Scenario 4: Compact UI**
1. **Test Steps**:
   - Verifikasi list data lebih kecil (padding: p-3)
   - Verifikasi font size lebih kecil (text-sm, text-xs)
   - Verifikasi spacing antar item (space-y-2)
   - Verifikasi pagination compact (h-8 w-8 buttons)

## 🔍 Expected Results

### **Pagination Controls**
- ✅ **Previous/Next buttons**: Chevron icons, disabled jika di halaman pertama/terakhir
- ✅ **Page numbers**: Compact buttons (h-8 w-8), highlight current page
- ✅ **Ellipsis**: Muncul ketika ada banyak halaman (...)
- ✅ **Page info**: "Showing X to Y of Z participants"

### **Data Display**
- ✅ **Items per page**: Maksimal 10 item
- ✅ **Compact layout**: Padding p-3, spacing space-y-2
- ✅ **Small fonts**: text-sm untuk nama, text-xs untuk detail
- ✅ **Global ranking**: Index ranking global (bukan per halaman)

### **UI Improvements**
- ✅ **Smaller cards**: Padding dan margin lebih kecil
- ✅ **Compact badges**: text-sm px-3 py-1
- ✅ **Reduced spacing**: gap-3, space-y-2
- ✅ **Hover effects**: hover:shadow-sm (lebih subtle)

## 🐛 Common Issues & Solutions

### **Issue 1: Pagination tidak muncul**
**Cause**: Total pages <= 1
**Solution**: Pastikan ada lebih dari 10 peserta

### **Issue 2: Data tidak berubah saat ganti halaman**
**Cause**: `updatePaginatedScores` tidak terpanggil
**Solution**: Check useEffect dependencies

### **Issue 3: Ranking index salah**
**Cause**: Index lokal bukan global
**Solution**: Gunakan `globalIndex = (currentPage - 1) * itemsPerPage + index`

### **Issue 4: UI terlalu besar**
**Cause**: Masih menggunakan ukuran lama
**Solution**: Pastikan semua class menggunakan ukuran compact

## 📱 UI Components

### **Compact Pagination Component**
```typescript
<CompactPagination />
```

### **Page Info Display**
```
Showing 1 to 10 of 45 participants
```

### **Navigation Buttons**
- Previous: `<ChevronLeft className="w-4 h-4" />`
- Next: `<ChevronRight className="w-4 h-4" />`
- Page numbers: Compact buttons (h-8 w-8)

## 🚀 Performance Considerations

### **Data Loading**
- ✅ **Single load**: Semua data di-load sekali, pagination hanya UI
- ✅ **No API calls**: Tidak ada request tambahan saat ganti halaman
- ✅ **Fast navigation**: Instant page switching

### **Memory Usage**
- ✅ **Efficient slicing**: `array.slice(start, end)` untuk data per halaman
- ✅ **No data duplication**: Data tidak di-copy, hanya reference

## 🔄 User Experience

### **Compact Design**
- **Smaller padding**: p-3 instead of p-4
- **Reduced spacing**: space-y-2 instead of space-y-3
- **Compact badges**: Smaller score badges
- **Tighter layout**: gap-3 instead of gap-4

### **Smart Pagination**
- **Global ranking**: Ranking tetap konsisten antar halaman
- **Auto-reset**: Kembali ke halaman 1 saat ganti paket
- **Visual feedback**: Current page highlight, disabled states

## 📊 Data Structure

### **Before Pagination**
```typescript
// Old: Only top N scores
const topSessions = sessions.slice(0, limit);
setTopScores(topSessions);
```

### **After Pagination**
```typescript
// New: All scores + pagination
setAllScores(sessions);
updatePaginatedScores(); // Shows first 10

// When page changes
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const paginatedScores = allScores.slice(startIndex, endIndex);
```

## 🎨 Visual Improvements

### **Compact Layout**
- **Card padding**: `pb-3` instead of `pb-4`
- **Item spacing**: `space-y-2` instead of `space-y-3`
- **Gap between elements**: `gap-3` instead of `gap-4`
- **Hover effects**: `hover:shadow-sm` instead of `hover:shadow-md`

### **Typography**
- **Title**: `text-lg` instead of `text-xl`
- **Description**: `text-sm` instead of `text-base`
- **Name**: `text-sm` instead of default
- **Details**: `text-xs` instead of `text-sm`

---

**Pagination ranking sudah siap dengan maksimal 10 data per halaman dan UI yang lebih compact!** 🎉
