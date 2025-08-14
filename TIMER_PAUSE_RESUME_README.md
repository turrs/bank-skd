# ⏰ Timer Pause/Resume untuk Tryout

## **Masalah yang Ditemukan:**
- Timer tryout terus berjalan meskipun browser ditutup
- Waktu berkurang tanpa user aktif
- Tidak ada mekanisme pause/resume
- User kehilangan waktu karena aktivitas lain

## **Solusi yang Diterapkan:**

### 1. **Custom Hook `useTimer`**
- ✅ **Pause Otomatis**: Timer pause saat page hidden
- ✅ **Resume Otomatis**: Timer resume saat page visible
- ✅ **Session Storage**: Simpan state timer saat unload
- ✅ **State Management**: Handle pause/resume dengan proper

### 2. **Visibility API Integration**
- ✅ **Page Hidden**: Detect saat user switch tab/close browser
- ✅ **Page Visible**: Detect saat user kembali ke tab
- ✅ **Before Unload**: Save state sebelum user leave

### 3. **Session Storage Backup**
- ✅ **Timer State**: Simpan waktu tersisa
- ✅ **Pause Time**: Simpan waktu pause
- ✅ **Auto Restore**: Restore state saat reload

## **Implementasi:**

### **Custom Hook Structure:**
```typescript
interface UseTimerReturn {
  timeLeft: number;        // Waktu tersisa dalam detik
  isRunning: boolean;      // Status timer berjalan
  isPaused: boolean;       // Status timer pause
  start: () => void;       // Start timer
  pause: () => void;       // Pause timer
  resume: () => void;      // Resume timer
  reset: () => void;       // Reset timer
  formatTime: (seconds: number) => string; // Format waktu
}
```

### **Auto Pause/Resume:**
```typescript
// Pause otomatis saat page hidden
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page hidden - pause timer
      if (isRunning && !isPaused && timeLeft > 0) {
        pause();
      }
    } else {
      // Page visible - resume timer
      if (isPaused) {
        resume();
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [isRunning, isPaused, timeLeft, pause, resume]);
```

### **Session Storage Backup:**
```typescript
const handleBeforeUnload = () => {
  if (timeLeft > 0 && isRunning && !isPaused) {
    // Save current state to session storage
    sessionStorage.setItem('tryout_pause_time', Date.now().toString());
    sessionStorage.setItem('tryout_time_left', timeLeft.toString());
    sessionStorage.setItem('tryout_total_paused', totalPausedTime.toString());
  }
};
```

## **Flow Pause/Resume:**

### **1. User Close Browser/Switch Tab:**
```
User Action → Page Hidden → Timer Pause → Save State → Session Storage
```

### **2. User Return to Tab:**
```
User Return → Page Visible → Timer Resume → Restore State → Continue
```

### **3. User Refresh/Reload:**
```
Page Reload → Check Session Storage → Restore Timer State → Resume
```

## **UI Indicators:**

### **Pause Status Badge:**
```tsx
{isPaused && (
  <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-700 border-orange-300">
    ⏸️ PAUSED
  </Badge>
)}
```

### **Timer Display:**
```tsx
<div className="flex items-center text-orange-600">
  <Clock className="w-5 h-5 mr-2" />
  <span className="font-mono font-bold text-lg">
    {formatTime(timeLeft)}
  </span>
  {isPaused && <PauseIndicator />}
</div>
```

## **Benefits:**

### **1. User Experience:**
- ✅ Timer tidak berkurang saat user tidak aktif
- ✅ Bisa lanjut tryout dengan waktu yang sama
- ✅ Tidak kehilangan waktu karena aktivitas lain

### **2. Technical Benefits:**
- ✅ Proper state management
- ✅ Memory efficient
- ✅ Cross-tab compatibility
- ✅ Session persistence

### **3. Business Benefits:**
- ✅ User satisfaction meningkat
- ✅ Completion rate lebih tinggi
- ✅ Fair time allocation

## **Testing:**

### **Test Pause/Resume:**
1. **Start tryout** dengan timer
2. **Switch tab** atau **minimize browser**
3. **Return to tab** - timer harus resume
4. **Check time** - tidak berkurang saat pause

### **Test Session Storage:**
1. **Start tryout** dengan timer
2. **Close browser** atau **refresh page**
3. **Reopen** - timer harus restore
4. **Check time** - sama seperti sebelum close

### **Test Multiple Tabs:**
1. **Open tryout** di tab 1
2. **Switch to tab 2** - timer pause
3. **Return to tab 1** - timer resume
4. **Check time** - konsisten

## **Troubleshooting:**

### **Timer Tidak Pause:**
- Check `document.hidden` API support
- Verify event listener registration
- Check browser compatibility

### **Timer Tidak Resume:**
- Check pause state management
- Verify resume logic
- Check interval clearing

### **State Tidak Restore:**
- Check session storage permissions
- Verify storage key names
- Check storage cleanup logic

## **Browser Compatibility:**

### **Supported:**
- ✅ Chrome 14+
- ✅ Firefox 10+
- ✅ Safari 6.1+
- ✅ Edge 12+

### **Features Used:**
- ✅ `document.hidden`
- ✅ `visibilitychange` event
- ✅ `beforeunload` event
- ✅ `sessionStorage`
- ✅ `setInterval`/`clearInterval`

## **Next Steps:**

1. ✅ **Implement custom hook**
2. ✅ **Add visibility handling**
3. ✅ **Add session storage backup**
4. ✅ **Add UI indicators**
5. ✅ **Test pause/resume flow**
6. ✅ **Monitor user feedback**

---

**Note:** Fitur ini memastikan user tidak kehilangan waktu tryout karena aktivitas lain dan memberikan pengalaman yang lebih fair dan user-friendly.
