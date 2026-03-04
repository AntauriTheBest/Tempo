import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error-handler';
import type { CreateTimeEntryRequest, TaskTimeStats } from '@todo-list-pro/shared';

export async function createTimeEntry(
  userId: string,
  data: CreateTimeEntryRequest,
  role?: string
) {
  // Verify task access
  const task = await prisma.task.findUnique({
    where: { id: data.taskId },
    select: { userId: true, assignments: { select: { userId: true } } },
  });

  if (!task) {
    throw new AppError(404, 'Task not found');
  }

  if (role !== 'ADMIN') {
    const isOwner = task.userId === userId;
    const isAssignee = task.assignments.some((a) => a.userId === userId);
    if (!isOwner && !isAssignee) {
      throw new AppError(403, 'Forbidden');
    }
  }

  const entry = await prisma.timeEntry.create({
    data: {
      taskId: data.taskId,
      userId,
      type: data.type,
      durationMinutes: data.durationMinutes,
      startedAt: new Date(data.startedAt),
      endedAt: data.endedAt ? new Date(data.endedAt) : null,
    },
    include: {
      task: { select: { id: true, title: true } },
      user: { select: { id: true, name: true } },
    },
  });

  return entry;
}

export async function getByTask(
  userId: string,
  taskId: string,
  role?: string
): Promise<{ entries: any[]; stats: TaskTimeStats }> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      userId: true,
      estimatedTimeMinutes: true,
      assignments: { select: { userId: true } },
    },
  });

  if (!task) {
    throw new AppError(404, 'Task not found');
  }

  if (role !== 'ADMIN') {
    const isOwner = task.userId === userId;
    const isAssignee = task.assignments.some((a) => a.userId === userId);
    if (!isOwner && !isAssignee) {
      throw new AppError(403, 'Forbidden');
    }
  }

  const entries = await prisma.timeEntry.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { startedAt: 'desc' },
  });

  const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
  const pomodoroSessions = entries.filter((e) => e.type === 'POMODORO').length;

  return {
    entries,
    stats: {
      totalMinutes,
      pomodoroSessions,
      estimatedTimeMinutes: task.estimatedTimeMinutes,
    },
  };
}

export async function deleteTimeEntry(
  userId: string,
  entryId: string,
  role?: string
) {
  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    throw new AppError(404, 'Time entry not found');
  }

  if (role !== 'ADMIN' && entry.userId !== userId) {
    throw new AppError(403, 'Forbidden');
  }

  await prisma.timeEntry.delete({ where: { id: entryId } });
}

export async function updateEstimatedTime(
  userId: string,
  taskId: string,
  estimatedTimeMinutes: number | null,
  role?: string
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { userId: true, assignments: { select: { userId: true } } },
  });

  if (!task) {
    throw new AppError(404, 'Task not found');
  }

  if (role !== 'ADMIN') {
    const isOwner = task.userId === userId;
    const isAssignee = task.assignments.some((a) => a.userId === userId);
    if (!isOwner && !isAssignee) {
      throw new AppError(403, 'Forbidden');
    }
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { estimatedTimeMinutes },
    select: { id: true, estimatedTimeMinutes: true },
  });

  return updated;
}
