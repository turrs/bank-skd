# ⏸️ Timer Pause Logic - Mencegah Timer Berjalan di Background

## **🎯 Tujuan:**
Memastikan timer tryout otomatis pause saat user meninggalkan halaman untuk mencegah timer terus berjalan di background.

## **🔍 Masalah yang Ditemukan:**
- **Timer tidak pause** saat user navigate keluar
- **Interval masih berjalan** di background
- **State tidak sync** antara timer dan navigation
- **Memory leak** karena interval tidak di-clear

## **🛠️ Solusi yang Diterapkan:**

### **1. Force Pause Function**
```typescript
// Force pause timer (for navigation)
const forcePause = useCallback(() => {
  if (isRunning && !isPaused) {
    setIsPaused(true);
    setPauseStartTime(Date.now());
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    console.log('⏸️ Timer force paused for navigation');
  }
}, [isRunning, isPaused]);
```

### **2. Navigation Event Handling**
```typescript
// Before unload - force pause timer
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (timeLeft > 0 && sessionId) {
    // Force pause timer before unload
    forcePauseTimer();
    
    const message = '⚠️ Tryout sedang berlangsung!...';
    event.preventDefault();
    event.returnValue = message;
    return message;
  }
};

// Pop state - force pause timer
const handlePopState = (event: PopStateEvent) => {
  if (timeLeft > 0 && sessionId) {
    // Force pause timer before navigation
    forcePauseTimer();
    
    const confirmed = window.confirm('⚠️ Tryout sedang berlangsung!...');
    if (!confirmed) {
      window.history.pushState(null, '', window.location.pathname);
      return;
    }
    handleTimeUp();
  }
};
```

### **3. Component Cleanup**
```typescript
// Cleanup timer when component unmounts
useEffect(() => {
  return () => {
    // Force pause timer when leaving tryout page
    if (timeLeft > 0 && sessionId) {
      forcePauseTimer();
      console.log('🧹 Timer force paused on component unmount');
    }
  };
}, [timeLeft, sessionId, forcePauseTimer]);
```

### **4. Manual Navigation Button**
```typescript
<Button 
  variant="ghost" 
  size="icon" 
  onClick={() => {
    if (timeLeft > 0 && sessionId) {
      // Force pause timer before navigation
      forcePauseTimer();
      
      const confirmed = window.confirm('⚠️ Tryout sedang berlangsung!...');
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

## **🎮 Flow Timer Pause:**

### **1. User Close Browser:**
```
User Close Browser → beforeunload Event → Force Pause Timer → Show Confirmation
                ↓
            User Cancel → Timer Paused → Stay in Tryout
                ↓
            User Confirm → Timer Paused → Browser Close
```

### **2. User Click Back Button:**
```
User Click Back → popstate Event → Force Pause Timer → Show Confirmation
                ↓
            User Cancel → Timer Paused → Prevent Navigation
                ↓
            User Confirm → Timer Paused → End Tryout → Navigate
```

### **3. User Click Manual Back:**
```
User Click Back → Force Pause Timer → Show Confirmation
                ↓
            User Cancel → Timer Paused → Stay in Tryout
                ↓
            User Confirm → Timer Paused → End Tryout → Navigate
```

### **4. Component Unmount:**
```
User Navigate Away → Component Unmount → Cleanup Effect → Force Pause Timer
                ↓
            Timer Paused → State Saved → Safe Navigation
```

## **🔧 Technical Implementation:**

### **A. Timer State Management:**
```typescript
interface UseTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setTime: (seconds: number) => void;
  forcePause: () => void;  // ← New function
  formatTime: (seconds: number) => string;
}
```

### **B. Interval Clearing:**
```typescript
const forcePause = useCallback(() => {
  if (isRunning && !isPaused) {
    setIsPaused(true);
    setPauseStartTime(Date.now());
    
    // Clear interval to stop timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    console.log('⏸️ Timer force paused for navigation');
  }
}, [isRunning, isPaused]);
```

### **C. Event Listener Cleanup:**
```typescript
useEffect(() => {
  // Add event listeners
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('popstate', handlePopState);
  
  return () => {
    // Remove event listeners
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('popstate', handlePopState);
  };
}, [timeLeft, sessionId, forcePauseTimer]);
```

## **🧪 Testing:**

### **Test Force Pause:**
1. **Start tryout** dengan timer berjalan
2. **Navigate away** (close tab, back button, manual back)
3. **Check console** - Should show "Timer force paused"
4. **Verify timer** - Should be paused, not running

### **Test State Persistence:**
1. **Start tryout** dengan timer
2. **Navigate away** - Timer should pause
3. **Return to tryout** - Timer should resume from paused state
4. **Check time** - Should be same as when paused

### **Test Memory Cleanup:**
1. **Start tryout** dengan timer
2. **Navigate away** - Timer should pause
3. **Check browser dev tools** - No memory leaks
4. **Verify intervals** - All cleared properly

## **📊 Benefits:**

### **1. Performance:**
- ✅ **No background intervals** running unnecessarily
- ✅ **Memory efficient** - proper cleanup
- ✅ **CPU usage** reduced when not active

### **2. User Experience:**
- ✅ **Timer pause** saat tidak aktif
- ✅ **State preserved** untuk resume
- ✅ **No confusion** about timer status

### **3. Data Integrity:**
- ✅ **Accurate timing** - no lost seconds
- ✅ **Proper pause/resume** logic
- ✅ **Session storage** backup

## **🌐 Browser Compatibility:**

### **Supported Events:**
- ✅ **`beforeunload`** - Chrome, Firefox, Safari, Edge
- ✅ **`popstate`** - Chrome, Firefox, Safari, Edge
- ✅ **`useEffect` cleanup** - React 16.8+
- ✅ **`clearInterval`** - All modern browsers

### **Limitations:**
- ⚠️ **Mobile browsers** - May not show `beforeunload` consistently
- ⚠️ **Progressive Web Apps** - May have different behavior
- ⚠️ **Background tabs** - Timer may still run in some cases

## **🔮 Future Enhancements:**

### **1. Smart Pause Detection:**
- **Detect** user activity patterns
- **Auto-pause** untuk short absences
- **Smart resume** logic

### **2. Background Sync:**
- **Service Worker** untuk background sync
- **Push notifications** untuk timer updates
- **Cross-tab** timer coordination

### **3. Advanced State Management:**
- **Redux/Zustand** untuk global timer state
- **Persistent storage** untuk long-term state
- **Offline support** untuk timer functionality

---

**Note:** Fitur ini memastikan timer tryout tidak berjalan di background dan memberikan kontrol penuh atas timer state saat navigation.

