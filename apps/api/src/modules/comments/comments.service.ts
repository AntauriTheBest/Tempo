import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error-handler';
import type { CreateCommentRequest, UpdateCommentRequest } from '@todo-list-pro/shared';

export async function getCommentsByTask(userId: string, taskId: string, role?: string) {
  // Verify task ownership or assignment (admins bypass)
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

  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return comments;
}

export async function createComment(
  userId: string,
  taskId: string,
  data: CreateCommentRequest,
  role?: string
) {
  // Verify task ownership or assignment (admins bypass)
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

  const comment = await prisma.comment.create({
    data: {
      content: data.content,
      taskId,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return comment;
}

export async function updateComment(
  userId: string,
  commentId: string,
  data: UpdateCommentRequest,
  role?: string
) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError(404, 'Comment not found');
  }

  if (role !== 'ADMIN' && comment.userId !== userId) {
    throw new AppError(403, 'Forbidden');
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: data.content },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return updated;
}

export async function deleteComment(userId: string, commentId: string, role?: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError(404, 'Comment not found');
  }

  if (role !== 'ADMIN' && comment.userId !== userId) {
    throw new AppError(403, 'Forbidden');
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });
}
