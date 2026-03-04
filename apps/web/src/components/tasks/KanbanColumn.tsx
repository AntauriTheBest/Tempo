import { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SortableKanbanCard } from './KanbanCard';
import type { Task, TaskStatus } from '@todo-list-pro/shared';
import type { UserSummary } from '../../services/users.service';

interface KanbanColumnProps {
  id: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  users: UserSummary[];
  onTaskClick: (task: Task) => void;
  onCreateTask: (title: string, status: TaskStatus) => void;
}

export function KanbanColumn({
  id,
  label,
  color,
  tasks,
  users,
  onTaskClick,
  onCreateTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startAdding = () => {
    setAdding(true);
    setNewTitle('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelAdding = () => {
    setAdding(false);
    setNewTitle('');
  };

  const confirmAdd = () => {
    const title = newTitle.trim();
    if (title) {
      onCreateTask(title, id);
    }
    cancelAdding();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') confirmAdd();
    if (e.key === 'Escape') cancelAdding();
  };

  return (
    <div className="flex flex-col w-72 min-w-[288px] flex-shrink-0 bg-muted/30 rounded-lg">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b">
        <span
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {tasks.length}
        </span>
      </div>

      {/* Scrollable card area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px] transition-colors',
          isOver && 'bg-primary/5'
        )}
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <SortableKanbanCard
              key={task.id}
              task={task}
              users={users}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && !adding && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Sin tareas
          </p>
        )}

        {/* Inline add input */}
        {adding && (
          <div className="rounded-lg border bg-background p-2 shadow-sm">
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={confirmAdd}
              placeholder="Título de la tarea..."
              className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Enter para guardar · Esc para cancelar</p>
          </div>
        )}
      </div>

      {/* Footer: add button */}
      <div className="p-2 border-t">
        <button
          onClick={startAdding}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar tarea
        </button>
      </div>
    </div>
  );
}
