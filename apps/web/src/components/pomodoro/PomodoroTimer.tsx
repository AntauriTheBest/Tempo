import { Play, Pause, Square, Timer, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { usePomodoroStore } from '../../store/pomodoro.store';
import type { TimerMode } from '../../store/pomodoro.store';

interface PomodoroTimerProps {
  taskId: string;
  taskTitle: string;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const MODE_LABELS: Record<TimerMode, { label: string; icon: typeof Timer }> = {
  pomodoro: { label: 'Pomodoro', icon: Timer },
  stopwatch: { label: 'Cronómetro', icon: Clock },
};

export function PomodoroTimer({ taskId, taskTitle }: PomodoroTimerProps) {
  const mode = usePomodoroStore((s) => s.mode);
  const phase = usePomodoroStore((s) => s.phase);
  const currentTaskId = usePomodoroStore((s) => s.currentTaskId);
  const elapsedSeconds = usePomodoroStore((s) => s.elapsedSeconds);
  const isPaused = usePomodoroStore((s) => s.isPaused);
  const focusMinutes = usePomodoroStore((s) => s.focusMinutes);
  const breakMinutes = usePomodoroStore((s) => s.breakMinutes);
  const sessionsCompleted = usePomodoroStore((s) => s.sessionsCompleted);
  const setMode = usePomodoroStore((s) => s.setMode);
  const startFocus = usePomodoroStore((s) => s.startFocus);
  const pause = usePomodoroStore((s) => s.pause);
  const resume = usePomodoroStore((s) => s.resume);
  const stop = usePomodoroStore((s) => s.stop);

  const isThisTask = currentTaskId === taskId;
  const isActive = phase !== 'idle' && isThisTask;
  const isIdle = phase === 'idle';

  // Pomodoro: countdown | Stopwatch: countup
  const isPomodoro = mode === 'pomodoro';

  const totalSeconds =
    phase === 'focus'
      ? focusMinutes * 60
      : phase === 'break'
        ? breakMinutes * 60
        : focusMinutes * 60;

  const displayTime = isPomodoro
    ? isActive
      ? totalSeconds - elapsedSeconds
      : totalSeconds
    : elapsedSeconds;

  const progress = isPomodoro
    ? isActive
      ? (elapsedSeconds / totalSeconds) * 100
      : 0
    : 0; // No progress ring for stopwatch

  // Stopwatch uses a pulsing dot animation instead of ring
  const stopwatchProgress = !isPomodoro && isActive
    ? ((elapsedSeconds % 60) / 60) * 100
    : 0;

  const ringColor =
    phase === 'break'
      ? 'text-green-500'
      : isPomodoro
        ? 'text-red-500'
        : 'text-blue-500';

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
        {(Object.keys(MODE_LABELS) as TimerMode[]).map((m) => {
          const { label, icon: Icon } = MODE_LABELS[m];
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={!isIdle}
              className={`flex-1 flex items-center justify-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                mode === m
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              } ${!isIdle ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Timer display */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-24 w-24">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted/30"
            />
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={
                2 * Math.PI * 42 * (1 - (isPomodoro ? progress : stopwatchProgress) / 100)
              }
              className={`${ringColor} transition-all duration-1000`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-mono font-bold">
              {formatTime(displayTime)}
            </span>
            {isActive && (
              <span className="text-[10px] text-muted-foreground uppercase">
                {phase === 'break'
                  ? 'descanso'
                  : isPomodoro
                    ? 'enfoque'
                    : 'registrando'}
              </span>
            )}
          </div>
        </div>

        {/* Sessions counter (pomodoro only) */}
        {isPomodoro && sessionsCompleted > 0 && isThisTask && (
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(sessionsCompleted, 8) }).map((_, i) => (
              <span key={i} className="h-2 w-2 rounded-full bg-red-500" />
            ))}
            {sessionsCompleted > 8 && (
              <span className="text-xs text-muted-foreground">+{sessionsCompleted - 8}</span>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2">
        {!isActive && isIdle && (
          <Button
            size="sm"
            onClick={() => startFocus(taskId, taskTitle)}
            disabled={!isIdle}
            className="gap-1"
          >
            <Play className="h-3 w-3" />
            {isPomodoro ? 'Iniciar' : 'Registrar tiempo'}
          </Button>
        )}

        {isActive && !isPaused && (
          <>
            <Button size="sm" variant="outline" onClick={pause} className="gap-1">
              <Pause className="h-3 w-3" />
              Pausar
            </Button>
            <Button size="sm" variant="destructive" onClick={stop} className="gap-1">
              <Square className="h-3 w-3" />
              Detener
            </Button>
          </>
        )}

        {isActive && isPaused && (
          <>
            <Button size="sm" onClick={resume} className="gap-1">
              <Play className="h-3 w-3" />
              Reanudar
            </Button>
            <Button size="sm" variant="destructive" onClick={stop} className="gap-1">
              <Square className="h-3 w-3" />
              Detener
            </Button>
          </>
        )}

        {phase !== 'idle' && !isThisTask && (
          <p className="text-xs text-muted-foreground text-center">
            Timer activo en otra tarea
          </p>
        )}
      </div>
    </div>
  );
}
