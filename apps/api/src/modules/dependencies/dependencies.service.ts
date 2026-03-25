import { prisma } from '../../config';
import { AppError } from '../../middleware';

export async function addDependency(
  organizationId: string,
  taskId: string,
  dependsOnId: string
) {
  if (taskId === dependsOnId) {
    throw new AppError(422, 'A task cannot depend on itself');
  }

  // Verify both tasks belong to the org
  const [task, dependsOn] = await Promise.all([
    prisma.task.findFirst({ where: { id: taskId, organizationId }, select: { id: true, title: true, startDate: true, dueDate: true } }),
    prisma.task.findFirst({ where: { id: dependsOnId, organizationId }, select: { id: true, title: true, startDate: true, dueDate: true } }),
  ]);
  if (!task) throw new AppError(404, 'Task not found');
  if (!dependsOn) throw new AppError(404, 'Dependency task not found');

  // Validate dates: task.startDate must not be before dependsOn.dueDate
  if (task.startDate && dependsOn.dueDate && task.startDate < dependsOn.dueDate) {
    throw new AppError(
      422,
      `"${task.title}" tiene fecha de inicio anterior al vencimiento de "${dependsOn.title}". Ajusta las fechas antes de agregar la dependencia.`
    );
  }

  // Prevent circular dependency: check if dependsOnId already depends (directly or transitively) on taskId
  const wouldCreateCycle = await hasCyclicDependency(dependsOnId, taskId);
  if (wouldCreateCycle) {
    throw new AppError(422, 'Adding this dependency would create a circular dependency');
  }

  const existing = await prisma.taskDependency.findUnique({
    where: { taskId_dependsOnId: { taskId, dependsOnId } },
  });
  if (existing) throw new AppError(409, 'Dependency already exists');

  return prisma.taskDependency.create({
    data: { taskId, dependsOnId },
    include: {
      dependsOn: { select: { id: true, title: true, status: true, priority: true } },
    },
  });
}

export async function removeDependency(
  organizationId: string,
  taskId: string,
  dependsOnId: string
) {
  const dep = await prisma.taskDependency.findFirst({
    where: {
      taskId,
      dependsOnId,
      task: { organizationId },
    },
  });
  if (!dep) throw new AppError(404, 'Dependency not found');

  await prisma.taskDependency.delete({
    where: { taskId_dependsOnId: { taskId, dependsOnId } },
  });
}

export async function getTaskDependencies(organizationId: string, taskId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, organizationId } });
  if (!task) throw new AppError(404, 'Task not found');

  const [blockedBy, blocking] = await Promise.all([
    prisma.taskDependency.findMany({
      where: { taskId },
      include: {
        dependsOn: { select: { id: true, title: true, status: true, priority: true, dueDate: true } },
      },
    }),
    prisma.taskDependency.findMany({
      where: { dependsOnId: taskId },
      include: {
        task: { select: { id: true, title: true, status: true, priority: true, dueDate: true } },
      },
    }),
  ]);

  return {
    blockedBy: blockedBy.map((d) => d.dependsOn),
    blocking: blocking.map((d) => d.task),
  };
}

// BFS to detect if `startId` can reach `targetId` through dependencies
async function hasCyclicDependency(startId: string, targetId: string): Promise<boolean> {
  const visited = new Set<string>();
  const queue = [startId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const deps = await prisma.taskDependency.findMany({
      where: { taskId: current },
      select: { dependsOnId: true },
    });
    queue.push(...deps.map((d) => d.dependsOnId));
  }
  return false;
}
