import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Personal', color: '#8b5cf6', icon: 'user' },
  { name: 'Trabajo', color: '#3b82f6', icon: 'briefcase' },
  { name: 'Hogar', color: '#22c55e', icon: 'home' },
  { name: 'Finanzas', color: '#f59e0b', icon: 'dollar-sign' },
  { name: 'Salud', color: '#ef4444', icon: 'heart' },
];

const defaultLists = [
  { name: 'Inbox', color: '#6366f1', icon: 'inbox', isPinned: true },
  { name: 'Hoy', color: '#f59e0b', icon: 'sun', isPinned: true },
  { name: 'Próximos', color: '#3b82f6', icon: 'calendar', isPinned: false },
];

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 12);

  // Crear organización de demo
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      plan: 'TRIAL',
      status: 'TRIALING',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días
    },
  });

  // Crear usuario demo admin
  const user = await prisma.user.upsert({
    where: { email: 'demo@todolist.com' },
    update: { role: 'ADMIN', organizationId: org.id },
    create: {
      email: 'demo@todolist.com',
      passwordHash,
      name: 'Demo User',
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  // Categorías por defecto
  for (let i = 0; i < defaultCategories.length; i++) {
    await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: defaultCategories[i].name } },
      update: {},
      create: { ...defaultCategories[i], userId: user.id, organizationId: org.id, order: i },
    });
  }

  // Listas por defecto
  for (let i = 0; i < defaultLists.length; i++) {
    await prisma.taskList.upsert({
      where: { userId_name: { userId: user.id, name: defaultLists[i].name } },
      update: {},
      create: { ...defaultLists[i], userId: user.id, organizationId: org.id, order: i },
    });
  }

  console.log(`Seed completado:`);
  console.log(`  Org: ${org.name} (${org.slug})`);
  console.log(`  User: ${user.email} / Password123 [ADMIN]`);
  console.log(`  Trial expira: ${org.trialEndsAt.toLocaleDateString()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
