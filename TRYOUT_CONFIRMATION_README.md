# ⚠️ Konfirmasi Tryout - Mencegah Kehilangan Progress

## **🎯 Tujuan:**
Mencegah user kehilangan progress tryout secara tidak sengaja dengan memberikan konfirmasi sebelum meninggalkan halaman.

## **🔧 Fitur yang Diterapkan:**

### **1. Browser Close/Refresh Confirmation**
- **Event**: `beforeunload`
- **Trigger**: User close tab/browser atau refresh page
- **Action**: Show browser confirmation dialog
- **Message**: "⚠️ Tryout sedang berlangsung! Jika Anda meninggalkan halaman ini, tryout akan berakhir. Apakah Anda yakin ingin keluar?"

### **2. Navigation Confirmation**
- **Event**: `popstate` (browser back/forward)
- **Trigger**: User klik back button atau navigasi browser
- **Action**: Show custom confirmation dialog
- **Behavior**: 
  - Jika user **konfirmasi** → End tryout dan allow navigation
  - Jika user **cancel** → Prevent navigation, stay in tryout

### **3. Manual Navigation Confirmation**
- **Location**: Back button di sidebar tryout
- **Trigger**: User klik tombol "Kembali ke Dashboard"
- **Action**: Show custom confirmation dialog
- **Behavior**: 
  - Jika user **konfirmasi** → End tryout dan navigate to dashboard
  - Jika user **cancel** → Stay in tryout

## **📱 Implementasi:**

### **A. useTimer Hook - Browser Events:**
```typescript
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (timeLeft > 0 && isRunning && !isPaused) {
    const message = '⚠️ Tryout sedang berlangsung! Jika Anda meninggalkan halaman ini, tryout akan berakhir. Apakah Anda yakin ingin keluar?';
    event.preventDefault();
    event.returnValue = message;
    return message;
  }
};
```

### **B. TryoutPage - Navigation Events:**
```typescript
useEffect(() => {
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (timeLeft > 0 && sessionId) {
      const message = '⚠️ Tryout sedang berlangsung! Jika Anda meninggalkan halaman ini, tryout akan berakhir. Apakah Anda yakin ingin keluar?';
      event.preventDefault();
      event.returnValue = message;
      return message;
    }
  };

  const handlePopState = (event: PopStateEvent) => {
    if (timeLeft > 0 && sessionId) {
      const confirmed = window.confirm('⚠️ Tryout sedang berlangsung! Jika Anda meninggalkan halaman ini, tryout akan berakhir. Apakah Anda yakin ingin keluar?');
      if (!confirmed) {
        // Prevent navigation
        window.history.pushState(null, '', window.location.pathname);
        return;
      }
      // User confirmed, allow navigation and end tryout
      handleTimeUp();
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('popstate', handlePopState);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('popstate', handlePopState);
  };
}, [timeLeft, sessionId]);
```

### **C. Back Button - Manual Navigation:**
```typescript
<Button 
  variant="ghost" 
  size="icon" 
  onClick={() => {
    if (timeLeft > 0 && sessionId) {
      const confirmed = window.confirm('⚠️ Tryout sedang berlangsung! Jika Anda meninggalkan halaman ini, tryout akan berakhir. Apakah Anda yakin ingin keluar?');
      if (confirmed) {
        handleTimeUp();
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  }} 
  title="Kembali"
>
  <ArrowLeft className="w-4 h-4" />
</Button>
```

## **🎮 User Experience Flow:**

### **1. User Close Browser:**
```
User Close Browser → Browser Show Confirmation → User Confirm → Tryout End
                ↓
            User Cancel → Stay in Tryout → Timer Continue
```

### **2. User Click Back Button:**
```
User Click Back → Browser Show Confirmation → User Confirm → Tryout End → Navigate
                ↓
            User Cancel → Stay in Tryout → Timer Continue
```

### **3. User Navigate Away:**
```
User Navigate → Custom Confirmation Dialog → User Confirm → Tryout End → Navigate
            ↓
        User Cancel → Stay in Tryout → Timer Continue
```

## **🛡️ Keamanan & Data Protection:**

### **1. Session Storage Backup:**
- **Auto-save** timer state sebelum user leave
- **Restore** timer state saat user return
- **Prevent** data loss

### **2. Tryout Completion:**
- **Force end** tryout jika user confirm leave
- **Save progress** sebelum navigation
- **Calculate score** jika diperlukan

### **3. State Validation:**
- **Check** `timeLeft > 0` (timer masih berjalan)
- **Check** `sessionId` (tryout session aktif)
- **Prevent** false triggers

## **🧪 Testing:**

### **Test Browser Close:**
1. **Start tryout** dengan timer
2. **Close browser tab** → Should show confirmation
3. **Cancel** → Should stay in tryout
4. **Confirm** → Should end tryout

### **Test Browser Back:**
1. **Start tryout** dengan timer
2. **Click browser back** → Should show confirmation
3. **Cancel** → Should stay in tryout
4. **Confirm** → Should end tryout and navigate

### **Test Manual Navigation:**
1. **Start tryout** dengan timer
2. **Click back button** → Should show confirmation
3. **Cancel** → Should stay in tryout
4. **Confirm** → Should end tryout and navigate

### **Test No Confirmation:**
1. **Timer finished** atau **no session**
2. **Navigate away** → Should not show confirmation
3. **Direct navigation** → Should work normally

## **🌐 Browser Compatibility:**

### **Supported Events:**
- ✅ `beforeunload` - Chrome, Firefox, Safari, Edge
- ✅ `popstate` - Chrome, Firefox, Safari, Edge
- ✅ `window.confirm()` - All modern browsers

### **Limitations:**
- ⚠️ **Mobile browsers** - May not show `beforeunload` consistently
- ⚠️ **Some browsers** - May ignore custom messages in `beforeunload`
- ⚠️ **Progressive Web Apps** - May have different behavior

## **📊 Benefits:**

### **1. User Protection:**
- ✅ **Prevent accidental loss** of tryout progress
- ✅ **Clear warning** before destructive actions
- ✅ **User choice** to continue or leave

### **2. Data Integrity:**
- ✅ **Auto-save** timer state
- ✅ **Force completion** if user leaves
- ✅ **Progress preservation** in session storage

### **3. Business Logic:**
- ✅ **Fair tryout rules** - user must actively choose to leave
- ✅ **Complete data** for scoring and analytics
- ✅ **Professional UX** - proper confirmation flows

## **🔮 Future Enhancements:**

### **1. Custom Modal:**
- **Replace** `window.confirm()` dengan custom UI
- **Better styling** dan branding
- **More options** (pause, save progress, etc.)

### **2. Smart Detection:**
- **Detect** user intent (accidental vs intentional)
- **Auto-pause** untuk short absences
- **Resume** untuk quick returns

### **3. Progress Recovery:**
- **Save answers** secara real-time
- **Auto-resume** dari last saved state
- **Partial completion** tracking

---

**Note:** Fitur ini memastikan user tidak kehilangan progress tryout secara tidak sengaja dan memberikan kontrol penuh atas keputusan untuk meninggalkan halaman.

