import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Copy, Pencil, Users, X, Clock, FileText, Paperclip, Image, Archive, File, ExternalLink } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

function getAttachmentIcon(mimetype: string) {
  if (mimetype.startsWith('image/')) return Image;
  if (mimetype === 'application/pdf' || mimetype.includes('word') || mimetype === 'text/plain') return FileText;
  if (mimetype.includes('zip') || mimetype.includes('compressed')) return Archive;
  return File;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { CommentList } from './CommentList';
import { PomodoroTimer } from '../pomodoro/PomodoroTimer';
import { PomodoroStats } from '../pomodoro/PomodoroStats';
import { TaskDependencies } from './TaskDependencies';
import { tasksService } from '../../services/tasks.service';
import { useTasksStore } from '../../store/tasks.store';
import type { Task, TaskStatus } from '@todo-list-pro/shared';
import { toast } from 'sonner';

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

const PRIORITY_COLORS: Record<string, string> = {
  NONE: '#94a3b8',
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

type TabId = 'detail' | 'time';

interface TaskDetailProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (task: Task) => void;
  onDelete?: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEdit?: (task: Task) => void;
}

export function TaskDetail({
  task,
  open,
  onOpenChange,
  onUpdate,
  onDuplicate,
  onEdit,
}: TaskDetailProps) {
  const requestRefresh = useTasksStore((s) => s.requestRefresh);
  const [fullTask, setFullTask] = useState<Task | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('detail');

  useEffect(() => {
    if (task && open) {
      tasksService.getById(task.id).then(setFullTask).catch(() => {});
      setActiveTab('detail');
    }
  }, [task, open]);

  if (!task) return null;

  const displayTask = fullTask || task;

  const handleStatusChange = async (status: TaskStatus) => {
    try {
      const updated = await tasksService.updateStatus(displayTask.id, {
        status,
      });
      onUpdate(updated);
      setFullTask((prev) => (prev ? { ...prev, ...updated } : updated));
    } catch {
      toast.error('Error updating status');
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      await tasksService.createSubtask(displayTask.id, {
        title: newSubtaskTitle.trim(),
      });
      setNewSubtaskTitle('');
      const updated = await tasksService.getById(displayTask.id);
      setFullTask(updated);
      onUpdate(updated);
    } catch {
      toast.error('Error creating subtask');
    }
  };

  const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
    { id: 'detail', label: 'Detalle', icon: FileText },
    { id: 'time', label: 'Tiempo', icon: Clock },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: PRIORITY_COLORS[displayTask.priority],
              }}
            />
            {displayTask.title}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-[1fr_300px] gap-6">
          {/* Left Column - Tab Content */}
          <div className="space-y-4">
            {activeTab === 'detail' && (
              <>
                {/* Status */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Estado</h4>
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.map((s) => (
                      <Badge
                        key={s.value}
                        variant={
                          displayTask.status === s.value ? 'default' : 'outline'
                        }
                        className="cursor-pointer"
                        onClick={() => handleStatusChange(s.value)}
                      >
                        {s.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Description */}
                {displayTask.description && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Descripción</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {displayTask.description}
                    </p>
                  </div>
                )}

                {/* Subtasks */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Subtareas {displayTask.subtasks && displayTask.subtasks.length > 0 && (
                      <span className="text-muted-foreground font-normal">
                        ({displayTask.subtasks.filter(s => s.status === 'COMPLETED').length}/{displayTask.subtasks.length})
                      </span>
                    )}
                  </h4>

                  {displayTask.subtasks && displayTask.subtasks.length > 0 ? (
                    <div className="space-y-1 mb-3">
                      {displayTask.subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            checked={sub.status === 'COMPLETED'}
                            onChange={async () => {
                              try {
                                const newStatus = sub.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
                                await tasksService.updateStatus(sub.id, { status: newStatus });
                                const updated = await tasksService.getById(displayTask.id);
                                setFullTask(updated);
                                toast.success('Subtarea actualizada');
                              } catch {
                                toast.error('Error al actualizar subtarea');
                              }
                            }}
                          />
                          <span
                            className={
                              sub.status === 'COMPLETED'
                                ? 'line-through text-muted-foreground text-sm'
                                : 'text-sm'
                            }
                          >
                            {sub.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-3">No hay subtareas</p>
                  )}

                  <div className="flex gap-2">
                    <Input
                      placeholder="Agregar subtarea..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubtask();
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddSubtask}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Comments */}
                <CommentList taskId={displayTask.id} />
              </>
            )}

            {activeTab === 'time' && (
              <PomodoroStats taskId={displayTask.id} expanded />
            )}
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-3 border-l pl-6">
            {/* Row 1: Priority + Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Prioridad</h4>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PRIORITY_COLORS[displayTask.priority] }}
                  />
                  <span className="text-sm">
                    {displayTask.priority === 'NONE' && 'Ninguna'}
                    {displayTask.priority === 'LOW' && 'Baja'}
                    {displayTask.priority === 'MEDIUM' && 'Media'}
                    {displayTask.priority === 'HIGH' && 'Alta'}
                    {displayTask.priority === 'URGENT' && 'Urgente'}
                  </span>
                </div>
              </div>
              {displayTask.dueDate && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Fecha límite</h4>
                  <p className="text-sm leading-snug">
                    {format(new Date(displayTask.dueDate), 'PPP p')}
                  </p>
                </div>
              )}
            </div>

            {/* Row 2: Category + List */}
            {(displayTask.category || displayTask.list) && (
              <div className="grid grid-cols-2 gap-3">
                {displayTask.category && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Categoría</h4>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: displayTask.category.color,
                        color: displayTask.category.color,
                      }}
                    >
                      {displayTask.category.name}
                    </Badge>
                  </div>
                )}
                {displayTask.list && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Lista</h4>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: displayTask.list.color }}
                      />
                      <span className="text-sm truncate">{displayTask.list.name}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {displayTask.tags && displayTask.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Etiquetas</h4>
                <div className="flex flex-wrap gap-1">
                  {displayTask.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Assignees */}
            {displayTask.assignees && displayTask.assignees.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Asignados
                </h4>
                <div className="space-y-1">
                  {displayTask.assignees.map((assignee) => (
                    <div key={assignee.id} className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-medium text-primary">
                          {assignee.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-sm">{assignee.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {displayTask.attachments && displayTask.attachments.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  Adjuntos ({displayTask.attachments.length})
                </h4>
                <div className="space-y-1">
                  {displayTask.attachments.map((att) => {
                    const Icon = getAttachmentIcon(att.mimetype);
                    const fileUrl = att.url.startsWith('http') ? att.url : `${API_BASE}${att.url}`;
                    return (
                      <a
                        key={att.id}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors group"
                      >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-xs truncate">{att.originalName}</span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatSize(att.size)}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            {/* Dependencies */}
            <TaskDependencies taskId={displayTask.id} />

            <Separator />

            {/* Pomodoro Timer */}
            <PomodoroTimer taskId={displayTask.id} taskTitle={displayTask.title} />
          </div>
        </div>

        <Separator className="my-4" />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit(displayTask);
                  onOpenChange(false);
                }}
              >
                <Pencil className="mr-1 h-4 w-4" />
                Editar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDuplicate(displayTask.id);
                onOpenChange(false);
              }}
            >
              <Copy className="mr-1 h-4 w-4" />
              Duplicar
            </Button>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              requestRefresh();
              onOpenChange(false);
            }}
          >
            <X className="mr-1 h-4 w-4" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
