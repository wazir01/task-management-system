const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password,
      name: 'Demo Admin',
      settings: { create: {} },
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@demo.com' },
    update: {},
    create: {
      email: 'member@demo.com',
      password,
      name: 'Demo Member',
      settings: { create: {} },
    },
  });

  await prisma.userSettings.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });
  await prisma.userSettings.upsert({
    where: { userId: member.id },
    update: {},
    create: { userId: member.id },
  });

  let project = await prisma.project.findFirst({
    where: { name: 'Website Redesign', ownerId: admin.id },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Website Redesign',
        description: 'Revamp the company marketing site',
        ownerId: admin.id,
        members: {
          create: [
            { userId: admin.id, role: 'ADMIN' },
            { userId: member.id, role: 'MEMBER' },
          ],
        },
      },
    });
  }

  await prisma.task.deleteMany({ where: { projectId: project.id } });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.task.createMany({
    data: [
      {
        title: 'Design homepage mockups',
        status: 'DONE',
        priority: 'HIGH',
        projectId: project.id,
        assigneeId: member.id,
        createdById: admin.id,
        dueDate: yesterday,
      },
      {
        title: 'Implement navigation',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        projectId: project.id,
        assigneeId: member.id,
        createdById: admin.id,
        dueDate: nextWeek,
      },
      {
        title: 'QA accessibility audit',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        description: 'WCAG 2.1 AA compliance check',
        projectId: project.id,
        assigneeId: admin.id,
        createdById: admin.id,
        dueDate: nextWeek,
      },
      {
        title: 'Set up analytics',
        status: 'TODO',
        priority: 'LOW',
        description: 'Google Analytics + event tracking',
        projectId: project.id,
        assigneeId: admin.id,
        createdById: admin.id,
        dueDate: yesterday,
      },
    ],
  });

  console.log('Seed complete:');
  console.log('  admin@demo.com / password123');
  console.log('  member@demo.com / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
