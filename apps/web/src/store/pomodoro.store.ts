import { create } from 'zustand';
import { timeTrackingService } from '../services/time-tracking.service';

export type TimerMode = 'pomodoro' | 'stopwatch';
type TimerPhase = 'idle' | 'focus' | 'break';

interface PomodoroState {
  // Config
  mode: TimerMode;
  focusMinutes: number;
  breakMinutes: number;

  // Timer state
  phase: TimerPhase;
  currentTaskId: string | null;
  currentTaskTitle: string | null;
  elapsedSeconds: number;        // Seconds in current phase (resets each phase)
  totalSessionSeconds: number;   // Total seconds since session start (focus + break)
  sessionsCompleted: number;
  isPaused: boolean;
  startedAt: string | null;      // Session start (never changes during cycling)

  // Internal
  _intervalId: ReturnType<typeof setInterval> | null;

  // Actions
  setMode: (mode: TimerMode) => void;
  startFocus: (taskId: string, taskTitle: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<void>;
  tick: () => void;
  setConfig: (focus: number, breakMin: number) => void;
  reset: () => void;
  _hydrate: () => void;
}

const FOCUS_DEFAULT = 25;
const BREAK_DEFAULT = 5;
const STORAGE_KEY = 'pomodoro-timer-state';

// --- Persistence helpers ---

interface PersistedState {
  mode: TimerMode;
  phase: TimerPhase;
  currentTaskId: string | null;
  currentTaskTitle: string | null;
  elapsedSeconds: number;
  totalSessionSeconds: number;
  sessionsCompleted: number;
  isPaused: boolean;
  startedAt: string | null;
  focusMinutes: number;
  breakMinutes: number;
  savedAt: string;
}

function saveToStorage(state: PomodoroState) {
  if (state.phase === 'idle') {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const data: PersistedState = {
    mode: state.mode,
    phase: state.phase,
    currentTaskId: state.currentTaskId,
    currentTaskTitle: state.currentTaskTitle,
    elapsedSeconds: state.elapsedSeconds,
    totalSessionSeconds: state.totalSessionSeconds,
    sessionsCompleted: state.sessionsCompleted,
    isPaused: state.isPaused,
    startedAt: state.startedAt,
    focusMinutes: state.focusMinutes,
    breakMinutes: state.breakMinutes,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

// --- Audio notification helpers ---

function playSound(type: 'focus-end' | 'break-end') {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    if (type === 'focus-end') {
      // Triple ascending beep — focus session complete
      [0, 0.3, 0.6].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 600 + i * 200;
        gain.gain.setValueAtTime(0.3, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.25);
        osc.start(now + offset);
        osc.stop(now + offset + 0.25);
      });
      setTimeout(() => ctx.close(), 1500);
    } else {
      // Double low beep — break over
      [0, 0.25].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.3, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.2);
        osc.start(now + offset);
        osc.stop(now + offset + 0.2);
      });
      setTimeout(() => ctx.close(), 1000);
    }
  } catch {
    // AudioContext not available
  }
}

function sendNotification(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/vite.svg' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        new Notification(title, { body, icon: '/vite.svg' });
      }
    });
  }
}

// --- Interval helper ---

function startInterval(get: () => PomodoroState): ReturnType<typeof setInterval> {
  return setInterval(() => {
    get().tick();
  }, 1000);
}

// --- Hydration: resolve elapsed time across multiple phase transitions ---

function resolvePhaseAfterElapsed(
  phase: TimerPhase,
  elapsedSeconds: number,
  totalSessionSeconds: number,
  sessionsCompleted: number,
  focusMinutes: number,
  breakMinutes: number
): { phase: TimerPhase; elapsedSeconds: number; totalSessionSeconds: number; sessionsCompleted: number } {
  const focusDuration = focusMinutes * 60;
  const breakDuration = breakMinutes * 60;

  let currentPhase = phase;
  let elapsed = elapsedSeconds;
  let total = totalSessionSeconds;
  let sessions = sessionsCompleted;

  // Walk through phase transitions that happened while away
  let safety = 100; // Prevent infinite loops
  while (safety-- > 0) {
    const phaseDuration = currentPhase === 'focus' ? focusDuration : breakDuration;
    if (elapsed >= phaseDuration) {
      elapsed -= phaseDuration;
      if (currentPhase === 'focus') {
        sessions++;
        currentPhase = 'break';
      } else {
        currentPhase = 'focus';
      }
    } else {
      break;
    }
  }

  return { phase: currentPhase, elapsedSeconds: elapsed, totalSessionSeconds: total, sessionsCompleted: sessions };
}

// --- Store ---

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  mode: 'pomodoro',
  focusMinutes: FOCUS_DEFAULT,
  breakMinutes: BREAK_DEFAULT,
  phase: 'idle',
  currentTaskId: null,
  currentTaskTitle: null,
  elapsedSeconds: 0,
  totalSessionSeconds: 0,
  sessionsCompleted: 0,
  isPaused: false,
  startedAt: null,
  _intervalId: null,

  setMode: (mode) => {
    const state = get();
    if (state.phase !== 'idle') return;
    set({ mode });
  },

  startFocus: (taskId, taskTitle) => {
    const state = get();
    if (state._intervalId) clearInterval(state._intervalId);

    // Request notification permission early
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    set({
      phase: 'focus',
      currentTaskId: taskId,
      currentTaskTitle: taskTitle,
      elapsedSeconds: 0,
      totalSessionSeconds: 0,
      sessionsCompleted: 0,
      isPaused: false,
      startedAt: new Date().toISOString(),
      _intervalId: startInterval(get),
    });
  },

  pause: () => {
    const state = get();
    if (state._intervalId) clearInterval(state._intervalId);
    set({ isPaused: true, _intervalId: null });
  },

  resume: () => {
    const state = get();
    if (state.phase === 'idle') return;
    set({ isPaused: false, _intervalId: startInterval(get) });
  },

  stop: async () => {
    const state = get();
    if (state._intervalId) clearInterval(state._intervalId);

    // Save time entry with total session duration (focus + breaks)
    if (state.currentTaskId && state.totalSessionSeconds >= 60 && state.startedAt) {
      try {
        await timeTrackingService.create({
          taskId: state.currentTaskId,
          type: state.mode === 'pomodoro' ? 'POMODORO' : 'MANUAL',
          durationMinutes: Math.max(1, Math.round(state.totalSessionSeconds / 60)),
          startedAt: state.startedAt,
          endedAt: new Date().toISOString(),
        });
      } catch {
        // Silently fail
      }
    }

    set({
      phase: 'idle',
      currentTaskId: null,
      currentTaskTitle: null,
      elapsedSeconds: 0,
      totalSessionSeconds: 0,
      sessionsCompleted: 0,
      isPaused: false,
      startedAt: null,
      _intervalId: null,
    });
  },

  tick: () => {
    const state = get();
    if (state.isPaused || state.phase === 'idle') return;

    const newElapsed = state.elapsedSeconds + 1;
    const newTotal = state.totalSessionSeconds + 1;

    // Stopwatch mode: just count up, no limit
    if (state.mode === 'stopwatch') {
      set({ elapsedSeconds: newElapsed, totalSessionSeconds: newTotal });
      return;
    }

    // Pomodoro mode: countdown logic
    const totalSeconds =
      state.phase === 'focus'
        ? state.focusMinutes * 60
        : state.breakMinutes * 60;

    if (newElapsed >= totalSeconds) {
      if (state._intervalId) clearInterval(state._intervalId);

      if (state.phase === 'focus') {
        // Notify: focus complete
        playSound('focus-end');
        sendNotification(
          'Pomodoro completado',
          `${state.currentTaskTitle} — Tiempo de descanso`
        );

        // Auto-start break (startedAt stays the same)
        set({
          phase: 'break',
          elapsedSeconds: 0,
          totalSessionSeconds: newTotal,
          sessionsCompleted: state.sessionsCompleted + 1,
          _intervalId: startInterval(get),
        });
      } else {
        // Notify: break complete, back to focus
        playSound('break-end');
        sendNotification(
          'Descanso terminado',
          `${state.currentTaskTitle} — De vuelta al trabajo`
        );

        // Auto-start new focus cycle (startedAt stays the same)
        set({
          phase: 'focus',
          elapsedSeconds: 0,
          totalSessionSeconds: newTotal,
          _intervalId: startInterval(get),
        });
      }
    } else {
      set({ elapsedSeconds: newElapsed, totalSessionSeconds: newTotal });
    }
  },

  setConfig: (focus, breakMin) => {
    set({ focusMinutes: focus, breakMinutes: breakMin });
  },

  reset: () => {
    const state = get();
    if (state._intervalId) clearInterval(state._intervalId);
    set({
      phase: 'idle',
      currentTaskId: null,
      currentTaskTitle: null,
      elapsedSeconds: 0,
      totalSessionSeconds: 0,
      sessionsCompleted: 0,
      isPaused: false,
      startedAt: null,
      _intervalId: null,
    });
  },

  _hydrate: () => {
    try {
      const persisted = loadFromStorage();
      if (!persisted || persisted.phase === 'idle') return;

      let elapsedSeconds = persisted.elapsedSeconds;
      let totalSessionSeconds = persisted.totalSessionSeconds ?? 0;

      // If timer was running (not paused), add time elapsed since last save
      if (!persisted.isPaused) {
        const savedAt = new Date(persisted.savedAt).getTime();
        const secondsSinceSave = Math.floor((Date.now() - savedAt) / 1000);
        elapsedSeconds += secondsSinceSave;
        totalSessionSeconds += secondsSinceSave;
      }

      if (persisted.mode === 'pomodoro') {
        // Resolve phase transitions that happened while away
        const resolved = resolvePhaseAfterElapsed(
          persisted.phase,
          elapsedSeconds,
          totalSessionSeconds,
          persisted.sessionsCompleted,
          persisted.focusMinutes,
          persisted.breakMinutes
        );

        // Notify if phases changed while away
        if (resolved.sessionsCompleted > persisted.sessionsCompleted) {
          playSound('focus-end');
          sendNotification(
            'Pomodoro completado',
            `${persisted.currentTaskTitle ?? 'Tarea'} — Sesión en curso`
          );
        }

        set({
          mode: persisted.mode,
          phase: resolved.phase,
          currentTaskId: persisted.currentTaskId,
          currentTaskTitle: persisted.currentTaskTitle,
          elapsedSeconds: resolved.elapsedSeconds,
          totalSessionSeconds: resolved.totalSessionSeconds,
          sessionsCompleted: resolved.sessionsCompleted,
          isPaused: persisted.isPaused,
          startedAt: persisted.startedAt,
          focusMinutes: persisted.focusMinutes,
          breakMinutes: persisted.breakMinutes,
        });
      } else {
        // Stopwatch: simple restore
        set({
          mode: persisted.mode,
          phase: persisted.phase,
          currentTaskId: persisted.currentTaskId,
          currentTaskTitle: persisted.currentTaskTitle,
          elapsedSeconds,
          totalSessionSeconds,
          sessionsCompleted: persisted.sessionsCompleted,
          isPaused: persisted.isPaused,
          startedAt: persisted.startedAt,
          focusMinutes: persisted.focusMinutes,
          breakMinutes: persisted.breakMinutes,
        });
      }

      // Restart interval if timer was running
      if (!persisted.isPaused) {
        set({ _intervalId: startInterval(get) });
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
}));

// Auto-persist on meaningful state changes (phase or isPaused transitions)
let prevPhase: TimerPhase = 'idle';
let prevIsPaused = false;
usePomodoroStore.subscribe((state) => {
  if (state.phase !== prevPhase || state.isPaused !== prevIsPaused) {
    saveToStorage(state);
    prevPhase = state.phase;
    prevIsPaused = state.isPaused;
  }
});

// Restore persisted state on load
usePomodoroStore.getState()._hydrate();
