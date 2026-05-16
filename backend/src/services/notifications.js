const prisma = require('../lib/prisma');
const { sendEmail } = require('./email');
const { sendPushToUser } = require('./push');

async function ensureUserSettings(userId) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

async function deliverNotification(userId, { type, title, message, taskId, projectId }) {
  const settings = await ensureUserSettings(userId);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      taskId: taskId || null,
      projectId: projectId || null,
    },
  });

  if (settings.emailReminders && user?.email) {
    const sent = await sendEmail({
      to: user.email,
      subject: `[TaskFlow] ${title}`,
      text: message,
      html: `<p>${message}</p><p><small>TaskFlow notification</small></p>`,
    });
    if (sent) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { sentEmail: true },
      });
    }
  }

  if (settings.pushNotifications) {
    const sent = await sendPushToUser(userId, { title, body: message });
    if (sent) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { sentPush: true },
      });
    }
  }

  return notification;
}

async function notifyTaskAssigned(task, assigneeId) {
  if (!assigneeId) return;
  await deliverNotification(assigneeId, {
    type: 'TASK_ASSIGNED',
    title: 'Task assigned to you',
    message: `You were assigned "${task.title}"`,
    taskId: task.id,
    projectId: task.projectId,
  });
}

async function notifyStatusChange(task, userId) {
  const label = task.status.replace(/_/g, ' ');
  await deliverNotification(userId, {
    type: 'TASK_STATUS',
    title: 'Task status updated',
    message: `"${task.title}" moved to ${label}`,
    taskId: task.id,
    projectId: task.projectId,
  });
}

module.exports = {
  ensureUserSettings,
  deliverNotification,
  notifyTaskAssigned,
  notifyStatusChange,
};
