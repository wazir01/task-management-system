const express = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const {
  loadProjectAccess,
  requireProjectMember,
  loadTaskAccess,
} = require('../middleware/rbac');
const { validate } = require('../utils/validation');
const { notifyTaskAssigned, notifyStatusChange } = require('../services/notifications');

const router = express.Router();
const STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

router.use(authenticate);

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
};

function buildTaskWhere(projectId, query) {
  const where = { projectId };
  const { status, assigneeId, priority, q, dueBefore, dueAfter } = query;

  if (status) {
    const statuses = status.split(',').filter((s) => STATUSES.includes(s));
    if (statuses.length === 1) where.status = statuses[0];
    else if (statuses.length > 1) where.status = { in: statuses };
  }
  if (assigneeId) where.assigneeId = assigneeId === 'unassigned' ? null : assigneeId;
  if (priority) {
    const priorities = priority.split(',').filter((p) => PRIORITIES.includes(p));
    if (priorities.length) where.priority = priorities.length === 1 ? priorities[0] : { in: priorities };
  }
  if (dueBefore) where.dueDate = { ...(where.dueDate || {}), lte: new Date(dueBefore) };
  if (dueAfter) where.dueDate = { ...(where.dueDate || {}), gte: new Date(dueAfter) };
  if (q?.trim()) {
    const term = q.trim();
    where.OR = [
      { title: { contains: term } },
      { description: { contains: term } },
    ];
  }

  return where;
}

router.get('/projects/:projectId/tasks', loadProjectAccess, requireProjectMember, async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: buildTaskWhere(req.project.id, req.query),
    include: taskInclude,
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { updatedAt: 'desc' }],
  });

  res.json({ tasks });
});

router.post(
  '/projects/:projectId/tasks',
  loadProjectAccess,
  requireProjectMember,
  [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('status').optional().isIn(STATUSES),
    body('priority').optional().isIn(PRIORITIES),
    body('assigneeId').optional().isString(),
    body('dueDate').optional().isISO8601(),
  ],
  validate,
  async (req, res) => {
    const { title, description, status, priority, assigneeId, dueDate } = req.body;

    if (assigneeId) {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: req.project.id, userId: assigneeId } },
      });
      if (!assigneeMember) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: req.project.id,
        createdById: req.user.id,
      },
      include: taskInclude,
    });

    if (assigneeId && assigneeId !== req.user.id) {
      await notifyTaskAssigned(task, assigneeId);
    }

    res.status(201).json({ task });
  }
);

router.get('/:id', loadTaskAccess, (req, res) => {
  res.json({ task: req.task });
});

router.patch(
  '/:id/status',
  loadTaskAccess,
  [body('status').isIn(STATUSES)],
  validate,
  async (req, res) => {
    const { status } = req.body;
    const prevStatus = req.task.status;

    const task = await prisma.task.update({
      where: { id: req.task.id },
      data: { status },
      include: taskInclude,
    });

    if (prevStatus !== status && task.assigneeId) {
      await notifyStatusChange(task, task.assigneeId);
    }

    res.json({ task });
  }
);

router.put(
  '/:id',
  loadTaskAccess,
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('status').optional().isIn(STATUSES),
    body('priority').optional().isIn(PRIORITIES),
    body('assigneeId').optional({ nullable: true }).isString(),
    body('dueDate').optional({ nullable: true }).isISO8601(),
  ],
  validate,
  async (req, res) => {
    const isAdmin = req.membership.role === 'ADMIN';
    const isAssignee = req.task.assigneeId === req.user.id;
    const isCreator = req.task.createdById === req.user.id;

    if (!isAdmin && !isAssignee && !isCreator) {
      return res.status(403).json({
        error: 'You can only edit tasks you created, are assigned to, or as admin',
      });
    }

    const { title, description, status, priority, assigneeId, dueDate } = req.body;

    if (!isAdmin) {
      if (title !== undefined || description !== undefined || assigneeId !== undefined || priority !== undefined) {
        return res.status(403).json({
          error: 'Only admins can change title, description, assignee, or priority',
        });
      }
    }

    if (assigneeId) {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: req.task.projectId, userId: assigneeId },
        },
      });
      if (!assigneeMember) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }

    const prevAssignee = req.task.assigneeId;
    const prevStatus = req.task.status;

    const task = await prisma.task.update({
      where: { id: req.task.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: taskInclude,
    });

    if (assigneeId !== undefined && task.assigneeId && task.assigneeId !== prevAssignee) {
      await notifyTaskAssigned(task, task.assigneeId);
    }
    if (status !== undefined && status !== prevStatus && task.assigneeId) {
      await notifyStatusChange(task, task.assigneeId);
    }

    res.json({ task });
  }
);

router.delete('/:id', loadTaskAccess, async (req, res) => {
  const isAdmin = req.membership.role === 'ADMIN';
  const isCreator = req.task.createdById === req.user.id;

  if (!isAdmin && !isCreator) {
    return res.status(403).json({ error: 'Only admins or task creators can delete tasks' });
  }

  await prisma.task.delete({ where: { id: req.task.id } });
  res.json({ message: 'Task deleted' });
});

module.exports = router;
