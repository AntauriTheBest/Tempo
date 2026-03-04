import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { HeaderTimer } from '../pomodoro/HeaderTimer';
import { tasksService } from '../../services/tasks.service';
import { useTasksStore } from '../../store/tasks.store';
import { toast } from 'sonner';

interface ActiveTask {
  id: string;
  title: string;
  listId: string | null;
}

export function MainLayout() {
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const storeUpdateTask = useTasksStore((s) => s.updateTask);
  const requestRefresh = useTasksStore((s) => s.requestRefresh);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as ActiveTask;
    setActiveTask(data);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const taskData = active.data.current as ActiveTask;
      // Sidebar droppables are prefixed with "sidebar-"
      const rawId = over.id as string;
      const newListId = rawId.startsWith('sidebar-') ? rawId.slice(8) : rawId;
      const currentListId = taskData.listId || 'no-list';

      if (newListId === currentListId) return;

      try {
        const updated = await tasksService.move(taskData.id, {
          listId: newListId === 'no-list' ? null : newListId,
        });
        storeUpdateTask(updated);
        requestRefresh();
      } catch {
        toast.error('Error al mover tarea');
      }
    },
    [storeUpdateTask, requestRefresh]
  );

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <HeaderTimer />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rounded-md border bg-card px-3 py-2 shadow-lg text-sm font-medium max-w-xs truncate">
            {activeTask.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
