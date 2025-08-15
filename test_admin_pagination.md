# 🧪 Test Pagination AdminWithdrawalManagement

## 📋 Overview
Dokumen ini menjelaskan cara test pagination yang sudah ditambahkan di komponen `AdminWithdrawalManagement` untuk admin dengan maksimal 5 data per halaman.

## ✨ Fitur Pagination yang Ditambahkan

### 1. **State Management**
- `currentWithdrawalPage`: Halaman aktif untuk withdrawal requests
- `currentBalancePage`: Halaman aktif untuk mentor balances
- `itemsPerPage`: Maksimal 5 item per halaman

### 2. **Fungsi Pagination**
- `getPaginatedWithdrawals()`: Ambil data withdrawal sesuai halaman aktif
- `getPaginatedBalances()`: Ambil data balance sesuai halaman aktif
- `totalWithdrawalPages`: Total halaman untuk withdrawal (berdasarkan filter)
- `totalBalancePages`: Total halaman untuk balance

### 3. **Smart Pagination Logic**
- **Filter-aware**: Pagination bekerja dengan filter status dan search
- **Auto-reset**: Reset ke halaman 1 ketika filter berubah
- **Tab-reset**: Reset ke halaman 1 ketika tab berubah

## 🎯 Test Scenarios

### **Scenario 1: Withdrawal Requests Pagination**
1. **Setup**: Pastikan ada lebih dari 5 withdrawal requests
2. **Test Steps**:
   - Buka tab "Withdrawal Requests"
   - Verifikasi hanya 5 item yang ditampilkan
   - Klik "Next" → halaman 2
   - Verifikasi item 6-10 ditampilkan
   - Klik "Previous" → kembali ke halaman 1

### **Scenario 2: Mentor Balances Pagination**
1. **Setup**: Pastikan ada lebih dari 5 mentor balances
2. **Test Steps**:
   - Buka tab "Mentor Balances"
   - Verifikasi hanya 5 item yang ditampilkan
   - Test navigasi pagination seperti withdrawal

### **Scenario 3: Filter + Pagination Integration**
1. **Test Steps**:
   - Buka tab "Withdrawal Requests" → halaman 2
   - Filter status "pending"
   - Verifikasi kembali ke halaman 1
   - Verifikasi pagination update sesuai jumlah data filtered

### **Scenario 4: Search + Pagination Integration**
1. **Test Steps**:
   - Buka tab "Withdrawal Requests" → halaman 2
   - Search nama mentor tertentu
   - Verifikasi kembali ke halaman 1
   - Verifikasi pagination update sesuai hasil search

### **Scenario 5: Tab Switching**
1. **Test Steps**:
   - Buka tab "Withdrawal Requests" → halaman 2
   - Switch ke tab "Mentor Balances"
   - Verifikasi kembali ke halaman 1
   - Switch kembali ke "Withdrawal Requests"
   - Verifikasi kembali ke halaman 1

## 🔍 Expected Results

### **Pagination Controls**
- ✅ **Previous/Next buttons**: Chevron icons, disabled jika di halaman pertama/terakhir
- ✅ **Page numbers**: Compact buttons (h-8 w-8), highlight current page
- ✅ **Ellipsis**: Muncul ketika ada banyak halaman (...)
- ✅ **Page info**: "Showing X to Y of Z withdrawals/balances"

### **Data Display**
- ✅ **Items per page**: Maksimal 5 item
- ✅ **Filter integration**: Pagination bekerja dengan filter status
- ✅ **Search integration**: Pagination bekerja dengan search term
- ✅ **Data consistency**: Data sesuai dengan halaman yang dipilih

### **Smart Behavior**
- ✅ **Filter reset**: Pagination reset ke halaman 1 saat filter berubah
- ✅ **Search reset**: Pagination reset ke halaman 1 saat search berubah
- ✅ **Tab reset**: Pagination reset ke halaman 1 saat tab berubah

## 🐛 Common Issues & Solutions

### **Issue 1: Pagination tidak muncul**
**Cause**: Total pages <= 1
**Solution**: Pastikan ada lebih dari 5 records

### **Issue 2: Data tidak berubah saat ganti halaman**
**Cause**: `getPaginatedWithdrawals` tidak terpanggil
**Solution**: Check pagination functions

### **Issue 3: Pagination tidak reset saat filter**
**Cause**: useEffect dependencies tidak lengkap
**Solution**: Pastikan `[filterStatus, searchTerm]` di useEffect

### **Issue 4: Pagination tidak reset saat tab change**
**Cause**: `handleTabChange` tidak terpanggil
**Solution**: Pastikan `onValueChange` pada Tabs component

## 📱 UI Components

### **Compact Pagination Component**
```typescript
<CompactPagination
  currentPage={currentWithdrawalPage}
  totalPages={totalWithdrawalPages}
  onPageChange={setCurrentWithdrawalPage}
  label="withdrawals"
  totalItems={filteredWithdrawals.length}
/>
```

### **Page Info Display**
```
Showing 1 to 5 of 23 withdrawals
Showing 1 to 5 of 18 balances
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

### **Filter Integration**
- ✅ **Efficient filtering**: Filter bekerja pada data yang sudah di-load
- ✅ **Dynamic pagination**: Total pages update sesuai filter results
- ✅ **Smart reset**: Pagination reset otomatis saat filter berubah

## 🔄 User Experience

### **Admin Workflow**
1. **View Withdrawals**: Lihat 5 withdrawal per halaman
2. **Filter & Search**: Filter berdasarkan status atau search mentor
3. **Navigate Pages**: Navigasi antar halaman dengan pagination
4. **Take Actions**: Approve/reject/complete withdrawal
5. **View Balances**: Lihat 5 mentor balance per halaman

### **Smart Pagination**
- **Filter-aware**: Pagination bekerja dengan semua filter
- **Search-aware**: Pagination bekerja dengan search results
- **Tab-aware**: Pagination reset saat ganti tab
- **Action-aware**: Pagination tetap setelah action (tidak reset)

## 📊 Data Structure

### **Withdrawal Pagination**
```typescript
// Filtered data first, then paginated
const filteredWithdrawals = withdrawals.filter(...);
const paginatedWithdrawals = filteredWithdrawals.slice(start, end);

// Pagination info
const totalWithdrawalPages = Math.ceil(filteredWithdrawals.length / itemsPerPage);
```

### **Balance Pagination**
```typescript
// Direct pagination on balances
const paginatedBalances = balances.slice(start, end);

// Pagination info
const totalBalancePages = Math.ceil(balances.length / itemsPerPage);
```

## 🎨 Visual Improvements

### **Compact Design**
- **Small buttons**: h-8 w-8 untuk pagination
- **Chevron icons**: w-4 h-4 untuk Previous/Next
- **Smart spacing**: mt-4 px-2 untuk pagination container
- **Responsive layout**: Flexbox untuk mobile dan desktop

### **Integration Points**
- **Filter section**: Pagination muncul di bawah filtered results
- **Tab content**: Pagination terintegrasi dengan tab content
- **Action buttons**: Pagination tidak mengganggu action buttons
- **Search results**: Pagination bekerja dengan search results

## 🔧 Technical Implementation

### **State Management**
```typescript
const [currentWithdrawalPage, setCurrentWithdrawalPage] = useState(1);
const [currentBalancePage, setCurrentBalancePage] = useState(1);
const itemsPerPage = 5;
```

### **Pagination Functions**
```typescript
const getPaginatedWithdrawals = () => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredWithdrawals.slice(startIndex, endIndex);
};
```

### **Auto-reset Logic**
```typescript
// Reset when filters change
useEffect(() => {
  setCurrentWithdrawalPage(1);
}, [filterStatus, searchTerm]);

// Reset when tab changes
const handleTabChange = (value: string) => {
  if (value === 'withdrawals') setCurrentWithdrawalPage(1);
  else if (value === 'balances') setCurrentBalancePage(1);
};
```

---

**Pagination admin sudah siap dengan maksimal 5 data per halaman dan integrasi filter/search!** 🎉
