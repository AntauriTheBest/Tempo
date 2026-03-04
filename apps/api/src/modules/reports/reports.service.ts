import { prisma } from '../../config';
import type {
  ReportStats,
  AdminReportStats,
  TimeByClientItem,
  TimeByUserItem,
  CompletedOverTimeItem,
} from '@todo-list-pro/shared';

// --- Date range helpers ---

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

function getWeekRange(year: number, week: number) {
  // ISO week: week 1 contains Jan 4
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Mon=1..Sun=7
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setDate(jan4.getDate() - dayOfWeek + 1);

  const start = new Date(mondayOfWeek1);
  start.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatPeriodLabel(period: string, start: Date, year: number, month?: number, week?: number): string {
  if (period === 'weekly' && week) {
    const monthName = MONTH_NAMES[start.getMonth()];
    return `Sem ${week} – ${monthName} ${year}`;
  }
  if (month) {
    return `${MONTH_NAMES[month - 1]} ${year}`;
  }
  return `${year}`;
}

function getDateRange(period: string, year: number, month?: number, week?: number) {
  if (period === 'weekly' && week) {
    return getWeekRange(year, week);
  }
  return getMonthRange(year, month || new Date().getMonth() + 1);
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// --- Core aggregation ---

async function buildTimeByClient(
  entries: Array<{
    type: string;
    durationMinutes: number;
    task: { list: { client: { id: string; name: string; color: string } | null } | null };
  }>
): Promise<TimeByClientItem[]> {
  const map = new Map<string, TimeByClientItem>();

  for (const entry of entries) {
    const client = entry.task.list?.client;
    const key = client?.id ?? '__none__';

    if (!map.has(key)) {
      map.set(key, {
        clientId: client?.id ?? null,
        clientName: client?.name ?? 'Sin cliente',
        clientColor: client?.color ?? '#94a3b8',
        totalMinutes: 0,
        pomodoroMinutes: 0,
        manualMinutes: 0,
      });
    }

    const item = map.get(key)!;
    item.totalMinutes += entry.durationMinutes;
    if (entry.type === 'POMODORO') {
      item.pomodoroMinutes += entry.durationMinutes;
    } else {
      item.manualMinutes += entry.durationMinutes;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
}

function buildCompletedOverTime(
  tasks: Array<{ completedAt: Date | null }>,
  start: Date,
  end: Date
): CompletedOverTimeItem[] {
  const countMap = new Map<string, number>();

  // Initialize all days in range
  const cursor = new Date(start);
  while (cursor <= end) {
    countMap.set(formatDateKey(cursor), 0);
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const task of tasks) {
    if (task.completedAt) {
      const key = formatDateKey(task.completedAt);
      countMap.set(key, (countMap.get(key) || 0) + 1);
    }
  }

  return Array.from(countMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

// --- Public functions ---

export async function getPersonalStats(
  userId: string,
  period: string,
  year: number,
  month?: number,
  week?: number
): Promise<ReportStats> {
  const { start, end } = getDateRange(period, year, month, week);

  const [timeEntries, tasksByStatusRaw, completedTasks, totalTasks] = await Promise.all([
    // Time entries with client chain
    prisma.timeEntry.findMany({
      where: {
        userId,
        startedAt: { gte: start, lte: end },
      },
      select: {
        type: true,
        durationMinutes: true,
        task: {
          select: {
            list: {
              select: {
                client: { select: { id: true, name: true, color: true } },
              },
            },
          },
        },
      },
    }),

    // Tasks by status
    prisma.task.groupBy({
      by: ['status'],
      where: { userId, parentId: null },
      _count: { id: true },
    }),

    // Completed tasks in period (for over-time chart)
    prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: start, lte: end },
        parentId: null,
      },
      select: { completedAt: true },
    }),

    // Total tasks count
    prisma.task.count({
      where: { userId, parentId: null },
    }),
  ]);

  const timeByClient = await buildTimeByClient(timeEntries);
  const completedOverTime = buildCompletedOverTime(completedTasks, start, end);

  const tasksByStatus: Record<string, number> = {};
  let completedCount = 0;
  let pendingCount = 0;
  let inProgressCount = 0;
  for (const row of tasksByStatusRaw) {
    tasksByStatus[row.status] = row._count.id;
    if (row.status === 'COMPLETED') completedCount = row._count.id;
    if (row.status === 'PENDING') pendingCount = row._count.id;
    if (row.status === 'IN_PROGRESS') inProgressCount = row._count.id;
  }

  const totalTimeMinutes = timeEntries.reduce((sum, e) => sum + e.durationMinutes, 0);

  return {
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
      label: formatPeriodLabel(period, start, year, month, week),
    },
    summary: {
      totalTimeMinutes,
      totalTasks,
      completedTasks: completedCount,
      pendingTasks: pendingCount,
      inProgressTasks: inProgressCount,
      completionRate: totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0,
    },
    timeByClient,
    tasksByStatus,
    completedOverTime,
  };
}

export async function getAdminStats(
  period: string,
  year: number,
  month?: number,
  week?: number,
  filterUserId?: string
): Promise<AdminReportStats> {
  const { start, end } = getDateRange(period, year, month, week);

  const userFilter = filterUserId ? { userId: filterUserId } : {};

  const [timeEntries, tasksByStatusRaw, completedTasks, totalTasks] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        ...userFilter,
        startedAt: { gte: start, lte: end },
      },
      select: {
        type: true,
        durationMinutes: true,
        userId: true,
        task: {
          select: {
            list: {
              select: {
                client: { select: { id: true, name: true, color: true } },
              },
            },
          },
        },
        user: { select: { id: true, name: true } },
      },
    }),

    prisma.task.groupBy({
      by: ['status'],
      where: { ...userFilter, parentId: null },
      _count: { id: true },
    }),

    prisma.task.findMany({
      where: {
        ...userFilter,
        status: 'COMPLETED',
        completedAt: { gte: start, lte: end },
        parentId: null,
      },
      select: { completedAt: true },
    }),

    prisma.task.count({
      where: { ...userFilter, parentId: null },
    }),
  ]);

  const timeByClient = await buildTimeByClient(timeEntries);
  const completedOverTime = buildCompletedOverTime(completedTasks, start, end);

  // Build timeByUser
  const userMap = new Map<string, TimeByUserItem>();
  const userTaskIds = new Map<string, Set<string>>();

  for (const entry of timeEntries) {
    const uid = entry.user.id;
    if (!userMap.has(uid)) {
      userMap.set(uid, {
        userId: uid,
        userName: entry.user.name,
        totalMinutes: 0,
        taskCount: 0,
      });
      userTaskIds.set(uid, new Set());
    }
    userMap.get(uid)!.totalMinutes += entry.durationMinutes;
  }

  // Count distinct tasks per user from time entries
  for (const entry of timeEntries as Array<{ userId: string; task: any }>) {
    userTaskIds.get(entry.userId)?.add(entry.task?.list ? 'counted' : 'counted');
  }

  // Get actual task counts per user
  if (!filterUserId) {
    const userTaskCounts = await prisma.task.groupBy({
      by: ['userId'],
      where: {
        parentId: null,
        status: 'COMPLETED',
        completedAt: { gte: start, lte: end },
      },
      _count: { id: true },
    });
    for (const row of userTaskCounts) {
      if (userMap.has(row.userId)) {
        userMap.get(row.userId)!.taskCount = row._count.id;
      }
    }
  }

  const timeByUser = Array.from(userMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);

  const tasksByStatus: Record<string, number> = {};
  let completedCount = 0;
  let pendingCount = 0;
  let inProgressCount = 0;
  for (const row of tasksByStatusRaw) {
    tasksByStatus[row.status] = row._count.id;
    if (row.status === 'COMPLETED') completedCount = row._count.id;
    if (row.status === 'PENDING') pendingCount = row._count.id;
    if (row.status === 'IN_PROGRESS') inProgressCount = row._count.id;
  }

  const totalTimeMinutes = timeEntries.reduce((sum, e) => sum + e.durationMinutes, 0);

  return {
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
      label: formatPeriodLabel(period, start, year, month, week),
    },
    summary: {
      totalTimeMinutes,
      totalTasks,
      completedTasks: completedCount,
      pendingTasks: pendingCount,
      inProgressTasks: inProgressCount,
      completionRate: totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0,
    },
    timeByClient,
    tasksByStatus,
    completedOverTime,
    timeByUser,
  };
}
