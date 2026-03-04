import { useState, useRef, useEffect } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { Calendar, Copy, GripVertical, MoreHorizontal, Minus, Plus, Trash2 } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useTagsStore } from '../../store/tags.store';
import { useCategoriesStore } from '../../store/categories.store';
import type { Task, TaskStatus, UpdateTaskRequest } from '@todo-list-pro/shared';
import type { UserSummary } from '../../services/users.service';

const PRIORITY_COLORS: Record<string, string> = {
  NONE: '#94a3b8',
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

const PRIORITY_LABELS: Record<string, string> = {
  NONE: 'Ninguna',
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

interface TaskCardProps {
  task: Task;
  users: UserSummary[];
  onToggleStatus: (id: string, status: TaskStatus) => void;
  onClick: (task: Task) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdate: (id: string, data: UpdateTaskRequest) => Promise<any>;
  onCreateSubtask?: (parentId: string, title: string) => Promise<any>;
}

export function TaskCard({
  task,
  users,
  onToggleStatus,
  onClick,
  onDelete,
  onDuplicate,
  onUpdate,
  onCreateSubtask,
}: TaskCardProps) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [editingDate, setEditingDate] = useState(false);
  const [showTagsMenu, setShowTagsMenu] = useState(false);
  const [showAssigneesMenu, setShowAssigneesMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const tagsContainerRef = useRef<HTMLDivElement>(null);
  const assigneesContainerRef = useRef<HTMLDivElement>(null);
  const priorityContainerRef = useRef<HTMLDivElement>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { id: task.id, title: task.title, listId: task.listId },
  });

  const allTags = useTagsStore((s) => s.tags);
  const allCategories = useCategoriesStore((s) => s.categories);

  const isCompleted = task.status === 'COMPLETED';
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && !isCompleted && isPast(dueDate) && !isToday(dueDate);
  const isDueToday = dueDate && isToday(dueDate);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isRootTask = !task.parentId;

  const currentTagIds = task.tags?.map((t) => t.id) ?? [];
  const currentAssigneeIds = task.assignees?.map((a) => a.id) ?? [];

  // Click-outside: tags
  useEffect(() => {
    if (!showTagsMenu) return;
    const handler = (e: MouseEvent) => {
      if (tagsContainerRef.current && !tagsContainerRef.current.contains(e.target as Node)) {
        setShowTagsMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTagsMenu]);

  // Click-outside: assignees
  useEffect(() => {
    if (!showAssigneesMenu) return;
    const handler = (e: MouseEvent) => {
      if (assigneesContainerRef.current && !assigneesContainerRef.current.contains(e.target as Node)) {
        setShowAssigneesMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAssigneesMenu]);

  // Click-outside: priority
  useEffect(() => {
    if (!showPriorityMenu) return;
    const handler = (e: MouseEvent) => {
      if (priorityContainerRef.current && !priorityContainerRef.current.contains(e.target as Node)) {
        setShowPriorityMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPriorityMenu]);

  // Click-outside: category
  useEffect(() => {
    if (!showCategoryMenu) return;
    const handler = (e: MouseEvent) => {
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(e.target as Node)) {
        setShowCategoryMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCategoryMenu]);

  const handleDateSave = (value: string) => {
    setEditingDate(false);
    const newDate = value ? new Date(value).toISOString() : null;
    if (newDate !== task.dueDate) {
      onUpdate(task.id, { dueDate: newDate });
    }
  };

  const handleTagToggle = (tagId: string) => {
    const newTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];
    onUpdate(task.id, { tagIds: newTagIds });
  };

  const handleAssigneeToggle = (userId: string) => {
    const newIds = currentAssigneeIds.includes(userId)
      ? currentAssigneeIds.filter((id) => id !== userId)
      : [...currentAssigneeIds, userId];
    onUpdate(task.id, { assigneeIds: newIds });
  };

  const handlePrioritySelect = (priority: string) => {
    if (priority !== task.priority) {
      onUpdate(task.id, { priority: priority as Task['priority'] });
    }
    setShowPriorityMenu(false);
  };

  const handleCategorySelect = (categoryId: string | null) => {
    if (categoryId !== (task.categoryId || null)) {
      onUpdate(task.id, { categoryId });
    }
    setShowCategoryMenu(false);
  };

  const closeAllMenus = () => {
    setShowTagsMenu(false);
    setShowAssigneesMenu(false);
    setShowPriorityMenu(false);
    setShowCategoryMenu(false);
  };

  // Tree toggle button: shows +/- when there are subtasks
  const TreeToggle = () => {
    if (!isRootTask) return <div className="w-5" />;

    if (hasSubtasks) {
      return (
        <button
          className="w-5 h-5 flex items-center justify-center rounded border border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setShowSubtasks(!showSubtasks);
          }}
          title={showSubtasks ? 'Colapsar subtareas' : `Expandir ${task.subtasks!.length} subtarea(s)`}
        >
          {showSubtasks ? (
            <Minus className="h-3 w-3" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
        </button>
      );
    }

    return <div className="w-5" />;
  };

  return (
    <div ref={setNodeRef} className={cn(isDragging && 'opacity-30')}>
      {/* Main Row */}
      <div
        className={cn(
          'group grid grid-cols-[auto_auto_auto_auto_1fr_100px_120px_120px_100px_80px_auto] items-center gap-2 px-3 py-2.5 transition-colors hover:bg-accent/50 cursor-pointer',
          isCompleted && 'opacity-60'
        )}
        onClick={() => onClick(task)}
      >
        {/* Drag Handle */}
        <div
          className="w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Tree toggle (+/-) */}
        <div onClick={(e) => e.stopPropagation()}>
          <TreeToggle />
        </div>

        {/* Checkbox */}
        <div
          className="w-5"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(task.id, task.status);
          }}
        >
          <Checkbox checked={isCompleted} readOnly />
        </div>

        {/* Add subtask button */}
        <div onClick={(e) => e.stopPropagation()}>
          {isRootTask && onCreateSubtask ? (
            <button
              className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setShowSubtasks(true);
                setAddingSubtask(true);
              }}
              title="Agregar subtarea"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="w-5" />
          )}
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'text-sm font-medium truncate',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </span>
          {hasSubtasks && !showSubtasks && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full flex-shrink-0">
              {task.subtasks!.length}
            </span>
          )}
        </div>

        {/* Priority — click to edit */}
        <div
          ref={priorityContainerRef}
          className="relative"
          onClick={(e) => {
            e.stopPropagation();
            closeAllMenus();
            setShowPriorityMenu(!showPriorityMenu);
          }}
        >
          <div className="flex items-center gap-1.5 cursor-pointer">
            <span
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
            />
            <span className="text-xs text-muted-foreground hover:text-foreground">
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>

          {showPriorityMenu && (
            <div
              className="absolute top-full left-0 z-50 mt-1 w-36 rounded-md border bg-popover p-1 shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  className={cn(
                    'flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm text-left',
                    task.priority === value && 'bg-accent'
                  )}
                  onClick={() => handlePrioritySelect(value)}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PRIORITY_COLORS[value] }}
                  />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Due Date — double-click to edit */}
        <div
          className="relative"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingDate(true);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {editingDate ? (
            <input
              type="datetime-local"
              className="w-full h-7 text-xs rounded border border-input bg-background px-1"
              defaultValue={dueDate ? dueDate.toISOString().slice(0, 16) : ''}
              autoFocus
              onBlur={(e) => handleDateSave(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDateSave(e.currentTarget.value);
                if (e.key === 'Escape') setEditingDate(false);
              }}
            />
          ) : dueDate ? (
            <span
              className={cn(
                'flex items-center gap-1 text-xs',
                isOverdue
                  ? 'text-destructive'
                  : isDueToday
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
              )}
            >
              <Calendar className="h-3 w-3" />
              {format(dueDate, 'MMM d')}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </div>

        {/* Category — click to edit */}
        <div
          ref={categoryContainerRef}
          className="relative"
          onClick={(e) => {
            e.stopPropagation();
            closeAllMenus();
            setShowCategoryMenu(!showCategoryMenu);
          }}
        >
          <div className="cursor-pointer">
            {task.category ? (
              <Badge
                variant="outline"
                className="text-xs py-0 h-5 max-w-full truncate"
                style={{
                  borderColor: task.category.color,
                  color: task.category.color,
                }}
              >
                {task.category.name}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground/50 hover:text-muted-foreground">—</span>
            )}
          </div>

          {showCategoryMenu && (
            <div
              className="absolute top-full left-0 z-50 mt-1 w-44 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={cn(
                  'flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm text-left',
                  !task.categoryId && 'bg-accent'
                )}
                onClick={() => handleCategorySelect(null)}
              >
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 bg-muted-foreground/30" />
                <span className="text-muted-foreground">Sin categoría</span>
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  className={cn(
                    'flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm text-left',
                    task.categoryId === cat.id && 'bg-accent'
                  )}
                  onClick={() => handleCategorySelect(cat.id)}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tags — click to edit */}
        <div
          ref={tagsContainerRef}
          className="relative"
          onClick={(e) => {
            e.stopPropagation();
            const next = !showTagsMenu;
            closeAllMenus();
            setShowTagsMenu(next);
          }}
        >
          <div className="flex flex-wrap gap-0.5 overflow-hidden max-h-6 cursor-pointer">
            {task.tags && task.tags.length > 0 ? (
              <>
                {task.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-[10px] py-0 h-4 px-1"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {task.tags.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{task.tags.length - 2}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground/50 hover:text-muted-foreground">—</span>
            )}
          </div>

          {showTagsMenu && (
            <div
              className="absolute top-full left-0 z-50 mt-1 w-48 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              {allTags.length > 0 ? (
                allTags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={currentTagIds.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                    />
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="truncate">{tag.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-xs text-muted-foreground px-2 py-1.5">No hay etiquetas</p>
              )}
            </div>
          )}
        </div>

        {/* Assignees — click to edit */}
        <div
          ref={assigneesContainerRef}
          className="relative"
          onClick={(e) => {
            e.stopPropagation();
            const next = !showAssigneesMenu;
            closeAllMenus();
            setShowAssigneesMenu(next);
          }}
        >
          <div className="flex -space-x-1 cursor-pointer">
            {task.assignees && task.assignees.length > 0 ? (
              <>
                {task.assignees.slice(0, 3).map((assignee) => (
                  <div
                    key={assignee.id}
                    className="h-5 w-5 rounded-full bg-primary/10 border border-background flex items-center justify-center"
                    title={assignee.name}
                  >
                    <span className="text-[9px] font-medium text-primary">
                      {assignee.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                ))}
                {task.assignees.length > 3 && (
                  <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center">
                    <span className="text-[9px] font-medium text-muted-foreground">
                      +{task.assignees.length - 3}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground/50 hover:text-muted-foreground">—</span>
            )}
          </div>

          {showAssigneesMenu && (
            <div
              className="absolute top-full right-0 z-50 mt-1 w-52 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              {users.length > 0 ? (
                users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={currentAssigneeIds.includes(user.id)}
                      onChange={() => handleAssigneeToggle(user.id)}
                    />
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] font-medium text-primary">
                        {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <span className="truncate">{user.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-xs text-muted-foreground px-2 py-1.5">No hay usuarios</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className="w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(task.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Subtasks tree */}
      {showSubtasks && (hasSubtasks || addingSubtask) && (
        <div className="relative ml-[26px] border-l-2 border-muted-foreground/20">
          {task.subtasks?.map((subtask, idx) => {
            const isLast = !addingSubtask && idx === task.subtasks!.length - 1;
            return (
              <div key={subtask.id} className="relative">
                {/* Tree branch connector */}
                <div
                  className={cn(
                    'absolute left-0 top-1/2 w-4 border-t-2 border-muted-foreground/20',
                    isLast && 'border-l-2 rounded-bl-md -left-[2px] top-0 h-1/2'
                  )}
                  style={isLast ? { borderTop: '0', borderBottom: '2px solid' } : {}}
                />
                {isLast && (
                  <div className="absolute left-[14px] top-1/2 w-2 border-t-2 border-muted-foreground/20" />
                )}
                <div
                  className={cn(
                    'flex items-center gap-2 py-2 pl-6 pr-3 transition-colors hover:bg-accent/30 cursor-pointer',
                    subtask.status === 'COMPLETED' && 'opacity-50'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(subtask);
                  }}
                >
                  <div
                    className="w-5 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(subtask.id, subtask.status);
                    }}
                  >
                    <Checkbox
                      checked={subtask.status === 'COMPLETED'}
                      readOnly
                      className="h-4 w-4"
                    />
                  </div>
                  <span
                    className={cn(
                      'text-sm truncate',
                      subtask.status === 'COMPLETED' && 'line-through text-muted-foreground'
                    )}
                  >
                    {subtask.title}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Inline subtask input */}
          {addingSubtask && (
            <div className="relative">
              <div className="absolute left-0 top-1/2 w-4 border-t-2 border-muted-foreground/20" />
              <div
                className="flex items-center gap-2 py-2 pl-6 pr-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  className="flex-1 h-7 text-sm rounded border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Título de la subtarea..."
                  autoFocus
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && subtaskTitle.trim()) {
                      await onCreateSubtask?.(task.id, subtaskTitle.trim());
                      setSubtaskTitle('');
                    }
                    if (e.key === 'Escape') {
                      setAddingSubtask(false);
                      setSubtaskTitle('');
                    }
                  }}
                  onBlur={() => {
                    if (!subtaskTitle.trim()) {
                      setAddingSubtask(false);
                      setSubtaskTitle('');
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
