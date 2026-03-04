import { Pause, Play, Square, Timer, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { usePomodoroStore } from '../../store/pomodoro.store';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function HeaderTimer() {
  const navigate = useNavigate();
  const mode = usePomodoroStore((s) => s.mode);
  const phase = usePomodoroStore((s) => s.phase);
  const currentTaskId = usePomodoroStore((s) => s.currentTaskId);
  const elapsedSeconds = usePomodoroStore((s) => s.elapsedSeconds);
  const totalSessionSeconds = usePomodoroStore((s) => s.totalSessionSeconds);
  const sessionsCompleted = usePomodoroStore((s) => s.sessionsCompleted);
  const isPaused = usePomodoroStore((s) => s.isPaused);
  const focusMinutes = usePomodoroStore((s) => s.focusMinutes);
  const breakMinutes = usePomodoroStore((s) => s.breakMinutes);
  const currentTaskTitle = usePomodoroStore((s) => s.currentTaskTitle);
  const pause = usePomodoroStore((s) => s.pause);
  const resume = usePomodoroStore((s) => s.resume);
  const stop = usePomodoroStore((s) => s.stop);

  if (phase === 'idle') return null;

  const isPomodoro = mode === 'pomodoro';
  const totalSeconds =
    phase === 'focus' ? focusMinutes * 60 : breakMinutes * 60;

  const displayTime = isPomodoro
    ? totalSeconds - elapsedSeconds
    : elapsedSeconds;

  const bgColor =
    phase === 'break'
      ? 'bg-green-500/10 border-green-500/30'
      : isPomodoro
        ? 'bg-red-500/10 border-red-500/30'
        : 'bg-blue-500/10 border-blue-500/30';

  const dotColor =
    phase === 'break'
      ? 'bg-green-500 animate-pulse'
      : isPaused
        ? 'bg-yellow-500'
        : isPomodoro
          ? 'bg-red-500 animate-pulse'
          : 'bg-blue-500 animate-pulse';

  const accentColor =
    phase === 'break'
      ? 'text-green-600 dark:text-green-400'
      : isPomodoro
        ? 'text-red-600 dark:text-red-400'
        : 'text-blue-600 dark:text-blue-400';

  const phaseLabel =
    phase === 'break'
      ? 'Descanso'
      : isPomodoro
        ? 'Pomodoro — Enfoque'
        : 'Cronómetro — Registrando';

  const ModeIcon = isPomodoro ? Timer : Clock;

  const goToTask = () => {
    if (currentTaskId) {
      navigate(`/my-tasks?taskId=${currentTaskId}`);
    }
  };

  const handleStop = async () => {
    const taskId = currentTaskId;
    await stop();
    if (taskId) {
      navigate(`/my-tasks?taskId=${taskId}`);
    }
  };

  return (
    <div className={`flex items-center justify-between border-b px-6 py-3 ${bgColor}`}>
      {/* Left: status + task info (clickable) */}
      <button
        onClick={goToTask}
        className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <span className={`h-3 w-3 rounded-full flex-shrink-0 ${dotColor}`} />
        <ModeIcon className={`h-5 w-5 flex-shrink-0 ${accentColor}`} />
        <div className="flex flex-col min-w-0 text-left">
          <span className="text-sm font-medium truncate">
            {currentTaskTitle}
          </span>
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${accentColor}`}>
            {phaseLabel}
          </span>
        </div>
      </button>

      {/* Center: clock + session info */}
      <div className="flex flex-col items-center">
        <span className={`font-mono text-3xl font-bold tracking-tight ${accentColor}`}>
          {formatTime(displayTime)}
        </span>
        {isPomodoro && (
          <span className="text-[10px] text-muted-foreground">
            {sessionsCompleted > 0 && `${sessionsCompleted} pomodoro${sessionsCompleted > 1 ? 's' : ''} · `}
            Total: {formatTime(totalSessionSeconds)}
          </span>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1">
        {isPaused ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={resume}>
            <Play className="h-4 w-4" />
            Reanudar
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={pause}>
            <Pause className="h-4 w-4" />
            Pausar
          </Button>
        )}
        <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleStop}>
          <Square className="h-4 w-4" />
          Detener
        </Button>
      </div>
    </div>
  );
}
