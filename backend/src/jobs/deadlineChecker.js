const prisma = require('../lib/prisma');
const { deliverNotification } = require('../services/notifications');

const MS_DAY = 24 * 60 * 60 * 1000;

async function checkDeadlines() {
  const now = new Date();
  const in24h = new Date(now.getTime() + MS_DAY);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: { not: null },
      status: { not: 'DONE' },
      dueDate: { not: null },
    },
    include: {
      assignee: true,
      project: { select: { id: true, name: true } },
    },
  });

  for (const task of tasks) {
    const due = new Date(task.dueDate);
    const settings = await prisma.userSettings.findUnique({
      where: { userId: task.assigneeId },
    });
    if (settings && !settings.deadlineAlerts) continue;

    const isOverdue = due < now;
    const isDueSoon = due >= now && due <= in24h;
    if (!isOverdue && !isDueSoon) continue;

    const type = isOverdue ? 'DEADLINE_ALERT' : 'EMAIL_REMINDER';
    const title = isOverdue ? 'Task overdue' : 'Deadline approaching';
    const message = isOverdue
      ? `"${task.title}" in ${task.project.name} was due ${due.toLocaleDateString()}`
      : `"${task.title}" in ${task.project.name} is due ${due.toLocaleDateString()}`;

    const existing = await prisma.notification.findFirst({
      where: {
        userId: task.assigneeId,
        taskId: task.id,
        type,
        createdAt: { gte: startOfToday },
      },
    });
    if (existing) continue;

    await deliverNotification(task.assigneeId, {
      type,
      title,
      message,
      taskId: task.id,
      projectId: task.projectId,
    });
  }
}

function startDeadlineChecker(intervalMs = 5 * 60 * 1000) {
  checkDeadlines().catch((e) => console.error('Deadline check error:', e.message));
  return setInterval(() => {
    checkDeadlines().catch((e) => console.error('Deadline check error:', e.message));
  }, intervalMs);
}

module.exports = { checkDeadlines, startDeadlineChecker };
