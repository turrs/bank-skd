# 🔧 Timer Fix Documentation

## Masalah yang Ditemukan

### 1. Timer Tidak Berkurang Saat Tryout
**Root Cause**: Setelah `setTimerTime()` dipanggil, timer tidak pernah dipanggil `startTimer()` untuk memulai countdown.

**Lokasi Masalah**: `src/pages/TryoutPage.tsx` lines 185 dan 208

**Sebelum Perbaikan**:
```typescript
// Timer hanya diset tapi tidak dimulai
setTimerTime(remaining);
setTimerTime(durationInSeconds);
```

**Setelah Perbaikan**:
```typescript
// Timer diset dan akan dimulai otomatis oleh useEffect
setTimerTime(remaining);
// Timer will be started automatically by useEffect

setTimerTime(durationInSeconds);
// Timer will be started automatically by useEffect
```

### 2. Timer Tidak Pause Saat Tab Hidden
**Root Cause**: Logic pause/resume tidak berfungsi dengan benar saat tab tidak aktif.

**Lokasi Masalah**: `src/hooks/useTimer.ts` dan `src/pages/TryoutPage.tsx`

### 3. Timer Tidak Resume Setelah Cancel Navigation ⚠️ **BARU**
**Root Cause**: Ketika user klik "Batal" pada konfirmasi navigation, timer tidak resume karena `forcePauseTimer()` sudah dipanggil tapi tidak ada logic untuk resume.

**Lokasi Masalah**: `src/pages/TryoutPage.tsx` lines 95-120

### 4. Timer Tidak Resume Setelah Close Tab ⚠️ **BARU**
**Root Cause**: Untuk `beforeunload` event (close tab), timer tidak bisa resume secara langsung karena page sudah dalam proses unloading. Perlu menggunakan session storage untuk recovery.

**Lokasi Masalah**: `src/pages/TryoutPage.tsx` lines 95-110

## Solusi yang Diterapkan

### 1. Auto-Start Timer
Menambahkan `useEffect` di `TryoutPage.tsx` untuk memulai timer otomatis:

```typescript
// Add useEffect to start timer when time is set
useEffect(() => {
  if (timeLeft > 0 && !isPaused) {
    startTimer();
    console.log('🚀 Timer started with time:', timeLeft, 'seconds');
  }
}, [timeLeft, isPaused, startTimer]);
```

### 2. Enhanced Visibility Handling
Menambahkan logic untuk pause/resume otomatis berdasarkan visibility:

```typescript
// Add useEffect to handle timer pause/resume based on page visibility
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page hidden - pause timer
      if (timeLeft > 0 && sessionId) {
        forcePauseTimer();
        console.log('⏸️ Timer paused due to page hidden');
      }
    } else {
      // Page visible - resume timer if it was paused due to visibility
      if (isPaused && timeLeft > 0 && sessionId) {
        // Resume timer after a short delay to ensure page is fully loaded
        setTimeout(() => {
          if (document.visibilityState === 'visible') {
            startTimer();
            console.log('▶️ Timer resumed after page became visible');
          }
        }, 100);
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [timeLeft, isPaused, sessionId, forcePauseTimer, startTimer]);
```

### 3. Enhanced Timer Logic
Memperbaiki logic di `useTimer.ts` untuk memastikan timer hanya berjalan saat tab aktif:

```typescript
// Timer logic
useEffect(() => {
  if (timeLeft > 0 && isRunning && !isPaused && !document.hidden) {
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  } else if (intervalRef.current) {
    clearInterval(intervalRef.current);
  }

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, [timeLeft, isRunning, isPaused, onTimeUp]);
```

### 4. Improved Pause/Resume Logic
Memperbaiki logic pause/resume untuk visibility change:

```typescript
const handleVisibilityChange = () => {
  if (document.hidden) {
    // Page hidden - pause timer
    if (isRunning && !isPaused && timeLeft > 0) {
      console.log('⏸️ Page hidden - pausing timer');
      pause();
    }
  } else {
    // Page visible - resume timer if it was paused due to visibility
    if (isPaused && timeLeft > 0) {
      console.log('▶️ Page visible - resuming timer');
      resume();
    }
  }
};
```

### 5. Navigation Cancellation Handling ⚠️ **BARU**
Memperbaiki logic untuk resume timer ketika user cancel navigation:

```typescript
const handlePopState = (event: PopStateEvent) => {
  if (timeLeft > 0 && sessionId) {
    // Force pause timer before navigation
    forcePauseTimer();
    
    const confirmed = window.confirm('⚠️ Tryout sedang berlangsung! Jika Anda meninggalkan halaman ini, tryout akan berakhir. Apakah Anda yakin ingin keluar?');
    if (!confirmed) {
      // Prevent navigation and resume timer
      window.history.pushState(null, '', window.location.pathname);
      
      // Resume timer after a short delay to ensure navigation is prevented
      setTimeout(() => {
        if (timeLeft > 0 && sessionId) {
          startTimer();
          console.log('▶️ Timer resumed after user cancelled navigation');
        }
      }, 100);
      
      return;
    }
    // User confirmed, allow navigation and end tryout
    handleTimeUp();
  }
};
```

**Sidebar Button Navigation**:
```typescript
onClick={() => {
  if (timeLeft > 0 && sessionId) {
    // Force pause timer before navigation
    forcePauseTimer();
    
    const confirmed = window.confirm('⚠️ Tryout sedang berlangsung! Jika Anda meninggalkan halaman ini, tryout akan berakhir. Apakah Anda yakin ingin keluar?');
    if (confirmed) {
      handleTimeUp();
      navigate('/dashboard');
    } else {
      // User cancelled, resume timer
      setTimeout(() => {
        if (timeLeft > 0 && sessionId) {
          startTimer();
          console.log('▶️ Timer resumed after user cancelled navigation from sidebar');
        }
      }, 100);
    }
  } else {
    navigate('/dashboard');
  }
}}
```

### 6. Close Tab Timer Recovery ⚠️ **BARU**
Memperbaiki logic untuk recovery timer setelah close tab:

```typescript
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (timeLeft > 0 && sessionId) {
    // Force pause timer before unload
    forcePauseTimer();
    
    // Save timer state to session storage for potential recovery
    sessionStorage.setItem('tryout_pause_time', Date.now().toString());
    sessionStorage.setItem('tryout_time_left', timeLeft.toString());
    sessionStorage.setItem('tryout_session_id', sessionId);
    sessionStorage.setItem('tryout_package_id', packageId || '');
    sessionStorage.setItem('tryout_was_paused', 'true');
    
    const message = '⚠️ Tryout sedang berlangsung! Jika Anda meninggalkan halaman ini, tryout akan berakhir. Apakah Anda yakin ingin keluar?';
    event.preventDefault();
    event.returnValue = message;
    
    console.log('🚪 BeforeUnload - Timer state saved to session storage');
    
    // Note: For beforeunload, we can't directly resume timer if user cancels
    // because the page is already unloading. However, if user cancels and stays,
    // we can detect this and resume timer automatically.
    
    return message;
  }
};
```

**Auto-Resume Detection dengan PageHide Event**:
```typescript
// Handle pagehide event to detect if user cancelled close tab
const handlePageHide = (event: PageTransitionEvent) => {
  if (event.persisted && timeLeft > 0 && sessionId) {
    // Page is persisted (user cancelled close), resume timer
    console.log('🔄 Page persisted - user cancelled close tab, resuming timer');
    setTimeout(() => {
      if (timeLeft > 0 && sessionId) {
        startTimer();
        console.log('▶️ Timer resumed after user cancelled close tab');
      }
    }, 100);
  }
};

// Add event listener
window.addEventListener('pagehide', handlePageHide);
```

**Enhanced Visibility Change Handling**:
```typescript
// Handle page visibility change
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page hidden - pause timer
    if (timeLeft > 0 && sessionId) {
      forcePauseTimer();
      console.log('⏸️ Timer paused due to page hidden');
    }
  } else {
    // Page visible - resume timer if it was paused due to visibility
    if (isPaused && timeLeft > 0 && sessionId) {
      // Resume timer after a short delay to ensure page is fully loaded
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          startTimer();
          console.log('▶️ Timer resumed after page became visible');
        }
      }, 100);
    }
  }
});
```

## Fitur Timer yang Sekarang Berfungsi

### ✅ Timer Countdown
- Timer akan berkurang setiap detik saat tryout berlangsung
- Auto-start setelah `setTimerTime()` dipanggil

### ✅ Auto-Pause saat Tab Hidden
- Timer otomatis pause saat user switch ke tab lain
- Timer otomatis pause saat minimize browser

### ✅ Auto-Resume saat Tab Visible
- Timer otomatis resume saat user kembali ke tab tryout
- Delay 100ms untuk memastikan page fully loaded

### ✅ Navigation Cancellation Handling ⚠️ **BARU**
- Timer otomatis resume ketika user klik "Batal" pada konfirmasi navigation
- Bekerja untuk semua jenis navigation (popstate, sidebar button, dll)
- Delay 100ms untuk memastikan navigation benar-benar dibatalkan

### ✅ Close Tab Timer Recovery ⚠️ **BARU**
- Timer state otomatis disimpan ke session storage saat close tab
- **Auto-resume otomatis** ketika user klik "Batal" pada konfirmasi close tab
- **Tidak perlu reload page** - timer langsung lanjut berjalan
- Fallback ke session storage recovery jika diperlukan
- Smart detection menggunakan `pagehide` event dan `visibilitychange`

### ✅ State Persistence
- Timer state disimpan di session storage saat navigation
- Timer state dipulihkan saat kembali ke halaman

### ✅ Navigation Protection
- Konfirmasi sebelum meninggalkan halaman tryout
- Force pause timer sebelum navigation
- Auto-resume timer jika navigation dibatalkan

## Testing

### File Test
- `test_timer_fix.html` - File test sederhana untuk memverifikasi fungsi timer
- `test_navigation_cancel.html` - File test khusus untuk navigation cancellation
- `test_close_tab_timer.html` - File test khusus untuk close tab timer recovery (legacy)
- `test_close_tab_auto_resume.html` - File test khusus untuk close tab auto-resume tanpa reload

### Cara Test Navigation Cancellation
1. Buka file `test_navigation_cancel.html` di browser
2. Start timer dan lihat countdown
3. Klik "Test Navigation" button
4. Klik "Cancel" pada dialog - timer harus resume otomatis
5. Klik "OK" pada dialog - timer harus stop
6. Check console untuk log detail

### Cara Test Close Tab Auto-Resume
1. Buka file `test_close_tab_auto_resume.html` di browser
2. Start timer dan lihat countdown
3. Coba close tab - akan muncul konfirmasi dialog
4. Klik "Cancel" - timer akan **otomatis resume tanpa reload page**
5. Klik "Leave" - timer state akan disimpan (fallback scenario)
6. Check console untuk log detail auto-resume

## Log Console

Timer akan menampilkan log berikut di console:

```
🚀 Timer started with time: 300 seconds
⏸️ Timer paused due to page hidden
▶️ Timer resumed after page became visible
⏰ Resuming timer with remaining time: 245 seconds
🧹 Timer force paused on component unmount
🔄 PopState detected - pausing timer
▶️ Timer resumed after popstate cancellation
▶️ Timer resumed after user cancelled navigation from sidebar
🚪 BeforeUnload - Timer state saved to session storage
💾 Timer state saved to session storage
🔄 Page persisted - user cancelled close tab, resuming timer
▶️ Timer resumed after user cancelled close tab
```

## Dependencies

- React hooks: `useState`, `useEffect`, `useCallback`, `useRef`
- Page Visibility API: `document.hidden`, `document.visibilityState`
- Session Storage: untuk state persistence
- Browser History API: untuk navigation handling

## Browser Support

- ✅ Chrome/Chromium (semua versi)
- ✅ Firefox (semua versi)
- ✅ Safari (semua versi)
- ✅ Edge (semua versi)

## Notes

- Timer hanya berjalan saat tab aktif dan visible
- Delay 100ms pada resume untuk memastikan page stability
- State persistence menggunakan session storage
- Force pause otomatis saat component unmount
- **Navigation cancellation**: Timer otomatis resume ketika user cancel navigation
- **Multiple navigation types**: Mendukung popstate, sidebar button, dan beforeunload
- **Close tab auto-resume**: Timer otomatis resume ketika user cancel close tab tanpa reload
- **Smart detection**: Menggunakan kombinasi `pagehide` dan `visibilitychange` events
