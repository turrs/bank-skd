import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerProps {
  initialTime: number; // in seconds
  onTimeUp?: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setTime: (seconds: number) => void;
  forcePause: () => void;
  formatTime: (seconds: number) => string;
}

export const useTimer = ({ 
  initialTime, 
  onTimeUp, 
  autoStart = true 
}: UseTimerProps): UseTimerReturn => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Start timer
  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setPauseStartTime(null);
  }, []);

  // Pause timer
  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      setPauseStartTime(Date.now());
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isRunning, isPaused]);

  // Resume timer
  const resume = useCallback(() => {
    if (isPaused && pauseStartTime) {
      const pauseDuration = Date.now() - pauseStartTime;
      setTotalPausedTime(prev => prev + pauseDuration);
      setIsPaused(false);
      setPauseStartTime(null);
    }
  }, [isPaused, pauseStartTime]);

  // Reset timer
  const reset = useCallback(() => {
    setTimeLeft(initialTime);
    setIsRunning(false);
    setIsPaused(false);
    setPauseStartTime(null);
    setTotalPausedTime(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [initialTime]);

  // Set timer time manually
  const setTime = useCallback((seconds: number) => {
    setTimeLeft(seconds);
    if (seconds > 0 && !isRunning) {
      setIsRunning(true);
    }
  }, [isRunning]);

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

  // Timer logic
  useEffect(() => {
    if (timeLeft > 0 && isRunning && !isPaused) {
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

  // Auto-start timer when initialTime changes and autoStart is true
  useEffect(() => {
    if (autoStart && initialTime > 0 && !isRunning) {
      setIsRunning(true);
    }
  }, [autoStart, initialTime, isRunning]);

  // Handle page visibility change
  useEffect(() => {
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

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (timeLeft > 0 && isRunning && !isPaused) {
        // Show confirmation dialog
        const message = '⚠️ Tryout sedang berlangsung! Jika Anda meninggalkan halaman ini, tryout akan berakhir. Apakah Anda yakin ingin keluar?';
        event.preventDefault();
        event.returnValue = message;
        
        // Save current state to session storage
        sessionStorage.setItem('tryout_pause_time', Date.now().toString());
        sessionStorage.setItem('tryout_time_left', timeLeft.toString());
        sessionStorage.setItem('tryout_total_paused', totalPausedTime.toString());
        
        return message;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRunning, isPaused, timeLeft, totalPausedTime, pause, resume]);

  // Restore paused state from session storage
  useEffect(() => {
    const savedPauseTime = sessionStorage.getItem('tryout_pause_time');
    const savedTimeLeft = sessionStorage.getItem('tryout_time_left');
    const savedTotalPaused = sessionStorage.getItem('tryout_total_paused');
    
    if (savedPauseTime && savedTimeLeft && savedTotalPaused) {
      const pauseTime = parseInt(savedPauseTime);
      const timeLeftWhenPaused = parseInt(savedTimeLeft);
      const totalPaused = parseInt(savedTotalPaused);
      
      // Calculate adjusted time
      const pauseDuration = Date.now() - pauseTime;
      const adjustedTime = Math.max(0, timeLeftWhenPaused + Math.floor(pauseDuration / 1000));
      
      setTimeLeft(adjustedTime);
      setTotalPausedTime(totalPaused + Math.floor(pauseDuration / 1000));
      
      // Clear session storage
      sessionStorage.removeItem('tryout_pause_time');
      sessionStorage.removeItem('tryout_time_left');
      sessionStorage.removeItem('tryout_total_paused');
      
      console.log('🔄 Restored timer state from session storage');
    }
  }, []);

  return {
    timeLeft,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    setTime,
    forcePause,
    formatTime
  };
};
