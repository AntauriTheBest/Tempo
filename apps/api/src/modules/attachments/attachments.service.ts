import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../../config';
import { AppError } from '../../middleware';
import { env } from '../../config';

const ALLOWED_MIMETYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
]);

function buildUrl(filename: string): string {
  return `/uploads/${filename}`;
}

async function canAccessTask(userId: string, taskId: string, role?: string): Promise<void> {
  if (role === 'ADMIN') return;
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { userId },
        { assignments: { some: { userId } } },
      ],
    },
    select: { id: true },
  });
  if (!task) throw new AppError(403, 'No tienes acceso a esta tarea');
}

export async function upload(
  userId: string,
  taskId: string,
  file: Express.Multer.File,
  role?: string
) {
  if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
    // Delete the uploaded file since it's not allowed
    await fs.unlink(file.path).catch(() => null);
    throw new AppError(400, `Tipo de archivo no permitido: ${file.mimetype}`);
  }

  await canAccessTask(userId, taskId, role);

  const attachment = await prisma.attachment.create({
    data: {
      taskId,
      userId,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    },
    select: {
      id: true,
      filename: true,
      originalName: true,
      mimetype: true,
      size: true,
      createdAt: true,
      userId: true,
    },
  });

  return { ...attachment, url: buildUrl(attachment.filename), createdAt: attachment.createdAt.toISOString() };
}

export async function getByTask(userId: string, taskId: string, role?: string) {
  await canAccessTask(userId, taskId, role);

  const attachments = await prisma.attachment.findMany({
    where: { taskId },
    select: {
      id: true,
      filename: true,
      originalName: true,
      mimetype: true,
      size: true,
      createdAt: true,
      userId: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return attachments.map((a) => ({
    ...a,
    url: buildUrl(a.filename),
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function remove(userId: string, attachmentId: string, role?: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: { id: true, userId: true, filename: true },
  });

  if (!attachment) throw new AppError(404, 'Adjunto no encontrado');
  if (role !== 'ADMIN' && attachment.userId !== userId) {
    throw new AppError(403, 'Solo el autor puede eliminar este adjunto');
  }

  // Delete from disk
  const filePath = path.join(env.UPLOADS_DIR, attachment.filename);
  await fs.unlink(filePath).catch(() => null);

  await prisma.attachment.delete({ where: { id: attachmentId } });
}
