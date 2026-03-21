import { AutomationActionType, AutomationTrigger, Prisma } from '@prisma/client';
import { prisma } from '../../config';
import { AppError } from '../../middleware';

export async function getAll(organizationId: string) {
  return prisma.automation.findMany({
    where: { organizationId },
    include: { createdBy: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(
  organizationId: string,
  createdById: string,
  data: {
    name: string;
    trigger: AutomationTrigger;
    triggerConfig?: Record<string, any>;
    actionType: AutomationActionType;
    actionConfig: Record<string, any>;
  }
) {
  return prisma.automation.create({
    data: {
      organizationId,
      createdById,
      name: data.name,
      trigger: data.trigger,
      triggerConfig: data.triggerConfig ?? Prisma.JsonNull,
      actionType: data.actionType,
      actionConfig: data.actionConfig,
    },
    include: { createdBy: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function update(
  organizationId: string,
  automationId: string,
  data: Partial<{
    name: string;
    trigger: AutomationTrigger;
    triggerConfig: Record<string, any>;
    actionType: AutomationActionType;
    actionConfig: Record<string, any>;
    isActive: boolean;
  }>
) {
  const automation = await prisma.automation.findFirst({
    where: { id: automationId, organizationId },
  });
  if (!automation) throw new AppError(404, 'Automation not found');

  return prisma.automation.update({
    where: { id: automationId },
    data,
    include: { createdBy: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function remove(organizationId: string, automationId: string) {
  const automation = await prisma.automation.findFirst({
    where: { id: automationId, organizationId },
  });
  if (!automation) throw new AppError(404, 'Automation not found');
  await prisma.automation.delete({ where: { id: automationId } });
}

// ── Engine ──────────────────────────────────────────────────────────────────
// Called internally when a task event occurs.

export async function runAutomations(
  organizationId: string,
  trigger: AutomationTrigger,
  context: {
    taskId: string;
    taskTitle: string;
    newStatus?: string;
    assigneeIds?: string[];
    listId?: string | null;
  }
) {
  const automations = await prisma.automation.findMany({
    where: { organizationId, trigger, isActive: true },
  });

  for (const automation of automations) {
    try {
      const cfg = automation.triggerConfig as Record<string, any> | null;

      // Filter by listId if specified in triggerConfig
      if (cfg?.listId && cfg.listId !== context.listId) continue;
      // Filter by status if specified
      if (cfg?.status && cfg.status !== context.newStatus) continue;

      await executeAction(automation.actionType, automation.actionConfig as Record<string, any>, context);
    } catch {
      // Don't let automation failure break the main request
    }
  }
}

async function executeAction(
  actionType: AutomationActionType,
  actionConfig: Record<string, any>,
  context: {
    taskId: string;
    taskTitle: string;
    newStatus?: string;
    assigneeIds?: string[];
  }
) {
  switch (actionType) {
    case 'NOTIFY_ASSIGNEES': {
      // In-app notification: create a comment on the task from "system"
      if (!context.assigneeIds?.length) break;
      const message = actionConfig.message ?? `Tarea "${context.taskTitle}" actualizada automáticamente.`;
      // We use a lightweight in-app log via a system comment approach (no separate Notification table yet)
      // This is extensible — swap for push/email/WhatsApp later
      console.log(`[Automation] NOTIFY_ASSIGNEES task=${context.taskId} msg="${message}"`);
      break;
    }

    case 'NOTIFY_USER': {
      const userId = actionConfig.userId;
      if (!userId) break;
      const message = actionConfig.message ?? `Tarea "${context.taskTitle}" actualizada automáticamente.`;
      console.log(`[Automation] NOTIFY_USER userId=${userId} msg="${message}"`);
      break;
    }

    case 'SET_STATUS': {
      const newStatus = actionConfig.status;
      if (!newStatus) break;
      await prisma.task.update({
        where: { id: context.taskId },
        data: {
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
        },
      });
      break;
    }

    case 'SET_ASSIGNEE': {
      const userId = actionConfig.userId;
      if (!userId) break;
      await prisma.taskAssignment.upsert({
        where: { taskId_userId: { taskId: context.taskId, userId } },
        create: { taskId: context.taskId, userId },
        update: {},
      });
      break;
    }
  }
}
