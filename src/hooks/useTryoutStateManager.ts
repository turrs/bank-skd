import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface TryoutState {
  sessionId: string;
  packageId: string;
  startTime: number;
  totalPausedTime: number;
  pauseStartTime: number | null;
  lastServerSync: number;
  isOnline: boolean;
  currentQuestionIndex: number;
  answers: Record<string, any>;
  timeLeft: number;
}

interface UseTryoutStateManagerProps {
  sessionId: string;
  packageId: string;
  initialTimeLeft: number;
  onStateChange?: (state: TryoutState) => void;
  onRecovery?: (recoveredState: TryoutState) => void;
}

export const useTryoutStateManager = ({
  sessionId,
  packageId,
  initialTimeLeft,
  onStateChange,
  onRecovery
}: UseTryoutStateManagerProps) => {
  const [state, setState] = useState<TryoutState>({
    sessionId,
    packageId,
    startTime: Date.now(),
    totalPausedTime: 0,
    pauseStartTime: null,
    lastServerSync: Date.now(),
    isOnline: navigator.onLine,
    currentQuestionIndex: 0,
    answers: {},
    timeLeft: initialTimeLeft
  });

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecovering = useRef(false);

  // Initialize state from multiple sources
  useEffect(() => {
    initializeState();
  }, [sessionId]);

  // Setup online/offline detection (read-only, no offline mode)
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      console.log('🌐 Internet connection restored');
      
      // Try to sync with server immediately
      if (state.sessionId) {
        syncToServer();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      console.log('📡 Internet connection lost - server sync disabled');
      
      // Don't save to localStorage, just disable sync
      // This prevents data inconsistency with database
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.sessionId]);

  // Setup periodic sync
  useEffect(() => {
    if (state.sessionId && state.isOnline) {
      // Sync every 10 seconds when online (more frequent for better consistency)
      syncIntervalRef.current = setInterval(() => {
        syncToServer();
      }, 10000);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [state.sessionId, state.isOnline]);

  // Initialize state from multiple sources
  const initializeState = useCallback(async () => {
    console.log('🔄 Initializing tryout state...');
    
    // Priority 1: Check for server state (ONLY source of truth)
    try {
      const serverState = await getServerState(sessionId);
      if (serverState) {
        console.log('✅ Found server state, using it as source of truth');
        setState(serverState);
        isRecovering.current = true;
        onRecovery?.(serverState);
        
        // Update localStorage with server state for UI consistency
        saveToLocalStorage(serverState);
        return;
      }
    } catch (error) {
      console.log('⚠️ Could not fetch server state:', error);
    }

    // Priority 2: Check localStorage ONLY for UI state (not for recovery)
    const localState = getFromLocalStorage(sessionId);
    if (localState && localState.sessionId === sessionId) {
      console.log('🔄 Found local state, but using for UI only (not recovery)');
      
      // Use local state for UI consistency, but don't mark as recovered
      // This prevents data inconsistency issues
      setState(localState);
      
      // Try to sync with server immediately to get real data
      if (navigator.onLine) {
        setTimeout(() => syncToServer(), 1000);
      }
      return;
    }

    // Priority 3: Start fresh
    console.log('🚀 Starting fresh tryout session');
    const freshState: TryoutState = {
      sessionId,
      packageId,
      startTime: Date.now(),
      totalPausedTime: 0,
      pauseStartTime: null,
      lastServerSync: Date.now(),
      isOnline: navigator.onLine,
      currentQuestionIndex: 0,
      answers: {},
      timeLeft: initialTimeLeft
    };
    
    setState(freshState);
    saveToLocalStorage(freshState);
  }, [sessionId, packageId, initialTimeLeft, onRecovery]);

  // Save state to localStorage
  const saveToLocalStorage = useCallback((currentState?: TryoutState) => {
    const stateToSave = currentState || state;
    try {
      localStorage.setItem(`tryout_state_${sessionId}`, JSON.stringify({
        ...stateToSave,
        lastSaved: Date.now()
      }));
      console.log('💾 State saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
    }
  }, [state, sessionId]);

  // Get state from localStorage
  const getFromLocalStorage = useCallback((sessionId: string) => {
    try {
      const saved = localStorage.getItem(`tryout_state_${sessionId}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('❌ Failed to read from localStorage:', error);
      return null;
    }
  }, []);

  // Clear localStorage
  const clearLocalStorage = useCallback((sessionId: string) => {
    try {
      localStorage.removeItem(`tryout_state_${sessionId}`);
      console.log('🧹 LocalStorage cleared');
    } catch (error) {
      console.error('❌ Failed to clear localStorage:', error);
    }
  }, []);

  // Get server state
  const getServerState = async (sessionId: string) => {
    try {
      // Implement your API call here
      const response = await fetch(`/api/tryout-sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        return {
          sessionId: data.id,
          packageId: data.package_id,
          startTime: new Date(data.created_at).getTime(),
          totalPausedTime: data.total_pause_duration || 0,
          pauseStartTime: data.last_pause_time ? new Date(data.last_pause_time).getTime() : null,
          lastServerSync: Date.now(),
          isOnline: navigator.onLine,
          currentQuestionIndex: data.current_question_index || 0,
          answers: data.answers || {},
          timeLeft: data.time_left || initialTimeLeft
        };
      }
    } catch (error) {
      console.error('❌ Failed to fetch server state:', error);
    }
    return null;
  };

  // Sync state to server
  const syncToServer = useCallback(async () => {
    if (!state.sessionId || !navigator.onLine) {
      console.log('📡 Cannot sync - offline or no session');
      return;
    }

    try {
      const syncData = {
        session_id: state.sessionId,
        time_paused: state.totalPausedTime,
        last_pause_time: state.pauseStartTime ? new Date(state.pauseStartTime).toISOString() : null,
        total_pause_duration: state.totalPausedTime,
        last_sync_time: new Date().toISOString(),
        client_state: {
          current_question_index: state.currentQuestionIndex,
          answers: state.answers,
          time_left: state.timeLeft,
          total_paused_time: state.totalPausedTime
        },
        recovery_data: {
          start_time: new Date(state.startTime).toISOString(),
          last_pause_time: state.pauseStartTime ? new Date(state.pauseStartTime).toISOString() : null,
          total_pause_duration: state.totalPausedTime
        }
      };

      // Implement your API call here
      const response = await fetch(`/api/tryout-sessions/${state.sessionId}/sync`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syncData)
      });

      if (response.ok) {
        console.log('✅ State synced to server');
        setState(prev => ({ ...prev, lastServerSync: Date.now() }));
        
        // Only save to localStorage after successful server sync
        // This ensures data consistency with database
        saveToLocalStorage();
      } else {
        console.error('❌ Server sync failed:', response.status);
        // Don't save to localStorage on sync failure
        // This prevents data inconsistency
      }
    } catch (error) {
      console.error('❌ Server sync error:', error);
      
      // Don't save to localStorage on sync error
      // This prevents data inconsistency with database
    }
  }, [state, saveToLocalStorage]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    if (state.pauseStartTime) return; // Already paused
    
    const now = Date.now();
    setState(prev => ({
      ...prev,
      pauseStartTime: now,
      lastServerSync: now
    }));
    
    console.log('⏸️ Timer paused');
    
    // Try to sync to server immediately
    if (navigator.onLine) {
      syncToServer();
    }
    
    // Only save to localStorage after successful server sync
    // This prevents data inconsistency
  }, [state.pauseStartTime, syncToServer]);

  // Resume timer
  const resumeTimer = useCallback(() => {
    if (!state.pauseStartTime) return; // Not paused
    
    const now = Date.now();
    const pauseDuration = now - state.pauseStartTime;
    
    setState(prev => ({
      ...prev,
      totalPausedTime: prev.totalPausedTime + pauseDuration,
      pauseStartTime: null,
      lastServerSync: now
    }));
    
    console.log('▶️ Timer resumed, total paused:', pauseDuration);
    
    // Try to sync to server immediately
    if (navigator.onLine) {
      syncToServer();
    }
    
    // Only save to localStorage after successful server sync
    // This prevents data inconsistency
  }, [state.pauseStartTime, syncToServer]);

  // Update question and answers
  const updateQuestionState = useCallback((questionIndex: number, answers: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      currentQuestionIndex: questionIndex,
      answers: { ...prev.answers, ...answers },
      lastServerSync: Date.now()
    }));
    
    // Sync to server periodically (don't sync on every answer change)
    if (Date.now() - state.lastServerSync > 60000) { // Sync if more than 1 minute passed
      syncToServer();
    }
    
    // Only save to localStorage after successful server sync
    // This prevents data inconsistency
  }, [state.lastServerSync, syncToServer]);

  // Update time left
  const updateTimeLeft = useCallback((timeLeft: number) => {
    setState(prev => ({
      ...prev,
      timeLeft,
      lastServerSync: Date.now()
    }));
    
    // Don't save to localStorage automatically
    // This prevents data inconsistency with database
    // Only save after successful server sync
  }, []);

  // Force sync to server
  const forceSync = useCallback(async () => {
    console.log('🔄 Force syncing to server...');
    await syncToServer();
  }, [syncToServer]);

  // Get recovery information
  const getRecoveryInfo = useCallback(() => {
    return {
      isRecovering: isRecovering.current,
      lastSync: new Date(state.lastServerSync).toLocaleString(),
      totalPausedTime: Math.round(state.totalPausedTime / 1000),
      isOnline: state.isOnline,
      hasLocalBackup: !!getFromLocalStorage(sessionId),
      note: 'LocalStorage used for UI only, not for data recovery'
    };
  }, [state, sessionId, getFromLocalStorage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Final sync before unmount (only if online)
      if (navigator.onLine && state.sessionId) {
        // Don't force sync on unmount to prevent data inconsistency
        // Let the periodic sync handle it
        console.log('🔄 Component unmounting, periodic sync will continue');
      }
      
      // Clear interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [state.sessionId]);

  return {
    state,
    pauseTimer,
    resumeTimer,
    updateQuestionState,
    updateTimeLeft,
    forceSync,
    getRecoveryInfo,
    isOnline: state.isOnline,
    isRecovering: isRecovering.current
  };
};
