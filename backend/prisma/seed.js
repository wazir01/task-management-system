const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'password123';

const USERS = [
  { email: 'admin@demo.com', name: 'Demo Admin' },
  { email: 'member@demo.com', name: 'Demo Member' },
  { email: 'sarah@demo.com', name: 'Sarah Chen' },
  { email: 'alex@demo.com', name: 'Alex Rivera' },
];

function daysFromNow(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days) {
  return daysFromNow(-days);
}

async function upsertUsers(passwordHash) {
  const byEmail = {};
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: {
        email: u.email,
        password: passwordHash,
        name: u.name,
        settings: { create: {} },
      },
    });
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    byEmail[u.email] = user;
  }
  return byEmail;
}

async function upsertProject({ name, description, ownerEmail, members, users }) {
  const owner = users[ownerEmail];
  let project = await prisma.project.findFirst({
    where: { name, ownerId: owner.id },
  });

  const memberCreates = members.map((m) => ({
    userId: users[m.email].id,
    role: m.role,
  }));

  if (!project) {
    project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: owner.id,
        members: { create: memberCreates },
      },
    });
  } else {
    await prisma.project.update({
      where: { id: project.id },
      data: { description },
    });
    for (const m of members) {
      await prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: users[m.email].id,
          },
        },
        update: { role: m.role },
        create: {
          projectId: project.id,
          userId: users[m.email].id,
          role: m.role,
        },
      });
    }
  }

  await prisma.task.deleteMany({ where: { projectId: project.id } });
  return project;
}

async function seedNotifications(users, projectIds) {
  const demoUserIds = Object.values(users).map((u) => u.id);
  await prisma.notification.deleteMany({ where: { userId: { in: demoUserIds } } });

  const admin = users['admin@demo.com'];
  const member = users['member@demo.com'];

  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: 'DEADLINE_ALERT',
        title: 'Task due soon',
        message: 'QA accessibility audit is due in 2 days.',
        projectId: projectIds.website,
        read: false,
      },
      {
        userId: admin.id,
        type: 'TASK_ASSIGNED',
        title: 'New assignment',
        message: 'You were assigned "Draft API error codes".',
        projectId: projectIds.api,
        read: true,
      },
      {
        userId: member.id,
        type: 'DEADLINE_ALERT',
        title: 'Overdue task',
        message: 'Implement navigation is past its due date.',
        projectId: projectIds.website,
        read: false,
      },
      {
        userId: member.id,
        type: 'TASK_STATUS',
        title: 'Task completed',
        message: 'Design homepage mockups was marked done.',
        projectId: projectIds.website,
        read: true,
      },
      {
        userId: users['sarah@demo.com'].id,
        type: 'EMAIL_REMINDER',
        title: 'Weekly summary',
        message: 'You have 4 active tasks across 2 projects.',
        projectId: projectIds.mobile,
        read: false,
      },
    ],
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const users = await upsertUsers(passwordHash);

  const projects = [
    {
      key: 'website',
      name: 'Website Redesign',
      description: 'Revamp the company marketing site and landing pages',
      ownerEmail: 'admin@demo.com',
      members: [
        { email: 'admin@demo.com', role: 'ADMIN' },
        { email: 'member@demo.com', role: 'MEMBER' },
        { email: 'sarah@demo.com', role: 'MEMBER' },
      ],
      tasks: [
        {
          title: 'Design homepage mockups',
          description: 'Figma frames for desktop and mobile',
          status: 'DONE',
          priority: 'HIGH',
          assigneeEmail: 'sarah@demo.com',
          createdByEmail: 'admin@demo.com',
          dueDate: daysAgo(3),
        },
        {
          title: 'Implement navigation',
          description: 'Responsive nav with dropdown menus',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          assigneeEmail: 'member@demo.com',
          createdByEmail: 'admin@demo.com',
          dueDate: daysAgo(1),
        },
        {
          title: 'QA accessibility audit',
          description: 'WCAG 2.1 AA compliance check',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assigneeEmail: 'admin@demo.com',
          createdByEmail: 'admin@demo.com',
          dueDate: daysFromNow(2),
        },
        {
          title: 'Set up analytics',
          description: 'Google Analytics + event tracking',
          status: 'TODO',
          priority: 'LOW',
          assigneeEmail: 'admin@demo.com',
          createdByEmail: 'member@demo.com',
          dueDate: daysAgo(2),
        },
        {
          title: 'Write launch blog post',
          status: 'TODO',
          priority: 'MEDIUM',
          assigneeEmail: 'member@demo.com',
          createdByEmail: 'admin@demo.com',
          dueDate: daysFromNow(10),
        },
        {
          title: 'Optimize image assets',
          status: 'DONE',
          priority: 'LOW',
          assigneeEmail: 'sarah@demo.com',
          createdByEmail: 'admin@demo.com',
          dueDate: daysFromNow(0),
        },
      ],
    },
    {
      key: 'mobile',
      name: 'Mobile App Launch',
      description: 'iOS and Android release for TaskFlow companion app',
      ownerEmail: 'admin@demo.com',
      members: [
        { email: 'admin@demo.com', role: 'ADMIN' },
        { email: 'alex@demo.com', role: 'MEMBER' },
        { email: 'sarah@demo.com', role: 'MEMBER' },
      ],
      tasks: [
        {
          title: 'App store screenshots',
          status: 'DONE',
          priority: 'MEDIUM',
          assigneeEmail: 'sarah@demo.com',
          createdByEmail: 'admin@demo.com',
          dueDate: daysFromNow(-1),
        },
        {
          title: 'Push notification setup',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assigneeEmail: 'alex@demo.com',
          createdByEmail: 'admin@demo.com',
          dueDate: daysFromNow(5),
        },
        {
          title: 'Beta tester onboarding',
          status: 'TODO',
          priority: 'MEDIUM',
          assigneeEmail: 'admin@demo.com',
          createdByEmail: 'admin@demo.com',
          dueDate: daysFromNow(14),
        },
        {
          title: 'Crash reporting integration',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assigneeEmail: 'alex@demo.com',
          createdByEmail: 'alex@demo.com',
          dueDate: daysFromNow(3),
        },
        {
          title: 'Offline sync prototype',
          status: 'TODO',
          priority: 'LOW',
          assigneeEmail: 'sarah@demo.com',
          createdByEmail: 'admin@demo.com',
          dueDate: daysFromNow(21),
        },
      ],
    },
    {
      key: 'api',
      name: 'API Platform',
      description: 'Public REST API v2 and developer documentation',
      ownerEmail: 'alex@demo.com',
      members: [
        { email: 'alex@demo.com', role: 'ADMIN' },
        { email: 'admin@demo.com', role: 'MEMBER' },
        { email: 'member@demo.com', role: 'MEMBER' },
      ],
      tasks: [
        {
          title: 'OpenAPI spec draft',
          status: 'DONE',
          priority: 'HIGH',
          assigneeEmail: 'alex@demo.com',
          createdByEmail: 'alex@demo.com',
          dueDate: daysAgo(5),
        },
        {
          title: 'Rate limiting middleware',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assigneeEmail: 'member@demo.com',
          createdByEmail: 'alex@demo.com',
          dueDate: daysFromNow(4),
        },
        {
          title: 'Draft API error codes',
          status: 'TODO',
          priority: 'MEDIUM',
          assigneeEmail: 'admin@demo.com',
          createdByEmail: 'alex@demo.com',
          dueDate: daysFromNow(7),
        },
        {
          title: 'Postman collection',
          status: 'TODO',
          priority: 'LOW',
          assigneeEmail: 'member@demo.com',
          createdByEmail: 'admin@demo.com',
          dueDate: daysFromNow(12),
        },
        {
          title: 'Webhook retry logic',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          assigneeEmail: 'alex@demo.com',
          createdByEmail: 'member@demo.com',
          dueDate: daysAgo(1),
        },
      ],
    },
    {
      key: 'marketing',
      name: 'Marketing Q2 Campaign',
      description: 'Email, social, and paid ads for Q2 product push',
      ownerEmail: 'sarah@demo.com',
      members: [
        { email: 'sarah@demo.com', role: 'ADMIN' },
        { email: 'member@demo.com', role: 'MEMBER' },
        { email: 'admin@demo.com', role: 'MEMBER' },
      ],
      tasks: [
        {
          title: 'Campaign brief',
          status: 'DONE',
          priority: 'MEDIUM',
          assigneeEmail: 'sarah@demo.com',
          createdByEmail: 'sarah@demo.com',
          dueDate: daysAgo(10),
        },
        {
          title: 'LinkedIn ad creatives',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assigneeEmail: 'member@demo.com',
          createdByEmail: 'sarah@demo.com',
          dueDate: daysFromNow(6),
        },
        {
          title: 'Landing page A/B test',
          status: 'TODO',
          priority: 'HIGH',
          assigneeEmail: 'admin@demo.com',
          createdByEmail: 'sarah@demo.com',
          dueDate: daysFromNow(9),
        },
        {
          title: 'Newsletter copy',
          status: 'TODO',
          priority: 'MEDIUM',
          assigneeEmail: 'sarah@demo.com',
          createdByEmail: 'member@demo.com',
          dueDate: daysFromNow(4),
        },
      ],
    },
    {
      key: 'internal',
      name: 'Internal Tools',
      description: 'Admin dashboard, reporting, and team workflows',
      ownerEmail: 'member@demo.com',
      members: [
        { email: 'member@demo.com', role: 'ADMIN' },
        { email: 'admin@demo.com', role: 'ADMIN' },
        { email: 'alex@demo.com', role: 'MEMBER' },
      ],
      tasks: [
        {
          title: 'Export tasks to CSV',
          status: 'DONE',
          priority: 'MEDIUM',
          assigneeEmail: 'member@demo.com',
          createdByEmail: 'admin@demo.com',
          dueDate: daysFromNow(-2),
        },
        {
          title: 'Bulk task reassignment',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assigneeEmail: 'alex@demo.com',
          createdByEmail: 'member@demo.com',
          dueDate: daysFromNow(8),
        },
        {
          title: 'Audit log viewer',
          status: 'TODO',
          priority: 'MEDIUM',
          assigneeEmail: 'admin@demo.com',
          createdByEmail: 'member@demo.com',
          dueDate: daysFromNow(15),
        },
        {
          title: 'Slack integration spike',
          status: 'TODO',
          priority: 'LOW',
          assigneeEmail: 'member@demo.com',
          createdByEmail: 'admin@demo.com',
          dueDate: daysFromNow(20),
        },
      ],
    },
  ];

  const projectIds = {};

  for (const p of projects) {
    const project = await upsertProject({
      name: p.name,
      description: p.description,
      ownerEmail: p.ownerEmail,
      members: p.members,
      users,
    });
    projectIds[p.key] = project.id;

    if (p.tasks.length) {
      await prisma.task.createMany({
        data: p.tasks.map((t) => ({
          title: t.title,
          description: t.description ?? null,
          status: t.status,
          priority: t.priority,
          projectId: project.id,
          assigneeId: t.assigneeEmail ? users[t.assigneeEmail].id : null,
          createdById: users[t.createdByEmail].id,
          dueDate: t.dueDate ?? null,
        })),
      });
    }
  }

  await seedNotifications(users, projectIds);

  const taskCount = await prisma.task.count();
  const projectCount = await prisma.project.count();

  console.log('Seed complete:');
  console.log(`  ${USERS.length} users, ${projectCount} projects, ${taskCount} tasks`);
  console.log('  All accounts use password: password123');
  console.log('');
  USERS.forEach((u) => console.log(`  ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
