import { Pause, Play, Square, Timer, Clock } from 'lucide-react';
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

export function FocusWidget() {
  const mode = usePomodoroStore((s) => s.mode);
  const phase = usePomodoroStore((s) => s.phase);
  const currentTaskTitle = usePomodoroStore((s) => s.currentTaskTitle);
  const elapsedSeconds = usePomodoroStore((s) => s.elapsedSeconds);
  const isPaused = usePomodoroStore((s) => s.isPaused);
  const focusMinutes = usePomodoroStore((s) => s.focusMinutes);
  const breakMinutes = usePomodoroStore((s) => s.breakMinutes);
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

  const textColor =
    phase === 'break'
      ? 'text-green-500'
      : isPomodoro
        ? 'text-red-500'
        : 'text-blue-500';

  const ModeIcon = isPomodoro ? Timer : Clock;
  const phaseLabel =
    phase === 'break'
      ? 'Descanso'
      : isPomodoro
        ? 'Enfoque'
        : 'Registrando';

  return (
    <div className="border-t p-3">
      <div className="rounded-lg bg-accent/50 p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <ModeIcon className="h-3 w-3" />
          {phaseLabel}
        </div>

        <p className="text-sm font-medium truncate">{currentTaskTitle}</p>

        <div className="flex items-center justify-between">
          <span className={`text-lg font-mono font-bold ${textColor}`}>
            {formatTime(displayTime)}
          </span>

          <div className="flex gap-1">
            {isPaused ? (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={resume}>
                <Play className="h-3 w-3" />
              </Button>
            ) : (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={pause}>
                <Pause className="h-3 w-3" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={stop}>
              <Square className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
