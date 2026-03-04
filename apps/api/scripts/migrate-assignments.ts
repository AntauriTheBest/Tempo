import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  const tasks = await prisma.task.findMany({ select: { id: true, userId: true } });
  console.log('Found', tasks.length, 'tasks');

  let created = 0;
  for (const task of tasks) {
    try {
      await prisma.taskAssignment.create({
        data: { taskId: task.id, userId: task.userId },
      });
      created++;
    } catch {
      // Already exists, skip
    }
  }

  const count = await prisma.taskAssignment.count();
  console.log('Created', created, 'new assignments. Total:', count);
  await prisma.$disconnect();
}

migrate();
