const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diffToMonday);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

router.get('/', async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const { start: weekStart, end: weekEnd } = getWeekBounds();

  const projectIds = (
    await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    })
  ).map((m) => m.projectId);

  const activeTaskWhere = {
    projectId: { in: projectIds },
    assigneeId: userId,
    status: { not: 'DONE' },
  };

  const projectTaskWhere = { projectId: { in: projectIds } };

  const [statusCounts, weeklyStatusCounts, myActiveTaskCount, totalTaskCount, myTasks, teamTasks, overdueTasks, recentProjects] =
    await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId: { in: projectIds },
        OR: [{ assigneeId: userId }, { createdById: userId }],
      },
      _count: true,
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId: { in: projectIds },
        createdAt: { gte: weekStart, lt: weekEnd },
      },
      _count: true,
    }),
    prisma.task.count({ where: activeTaskWhere }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        OR: [{ assigneeId: userId }, { createdById: userId }],
      },
    }),
    prisma.task.findMany({
      where: activeTaskWhere,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 10,
    }),
    prisma.task.findMany({
      where: {
        ...projectTaskWhere,
        status: { not: 'DONE' },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
      take: 15,
    }),
    prisma.task.findMany({
      where: {
        ...activeTaskWhere,
        dueDate: { lt: now },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: {
        _count: { select: { tasks: true, members: true } },
        members: { where: { userId }, select: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const byStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  statusCounts.forEach((s) => {
    byStatus[s.status] = s._count;
  });

  const weeklyByStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  weeklyStatusCounts.forEach((s) => {
    weeklyByStatus[s.status] = s._count;
  });
  const weeklyTotal = Object.values(weeklyByStatus).reduce((a, b) => a + b, 0);

  const weekLabel = `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(weekEnd.getTime() - 1).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  res.json({
    summary: {
      projectCount: projectIds.length,
      totalTasks: totalTaskCount,
      myActiveTasks: myActiveTaskCount,
      completedTasks: byStatus.DONE,
      overdueCount: overdueTasks.length,
      byStatus,
    },
    weeklyChart: {
      byStatus: weeklyByStatus,
      total: weeklyTotal,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      weekLabel,
    },
    myTasks,
    teamTasks,
    overdueTasks,
    recentProjects: recentProjects.map((p) => ({
      ...p,
      myRole: p.members[0]?.role,
      members: undefined,
    })),
  });
});

module.exports = router;
