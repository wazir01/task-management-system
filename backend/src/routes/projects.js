const express = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const {
  loadProjectAccess,
  requireProjectMember,
  requireAdmin,
} = require('../middleware/rbac');
const { validate } = require('../utils/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const projects = await prisma.project.findMany({
    where: {
      members: { some: { userId: req.user.id } },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const enriched = projects.map((p) => ({
    ...p,
    myRole: p.members.find((m) => m.userId === req.user.id)?.role,
  }));

  res.json({ projects: enriched });
});

router.post(
  '/',
  [
    body('name').trim().notEmpty().isLength({ max: 120 }),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  async (req, res) => {
    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    res.status(201).json({ project: { ...project, myRole: 'ADMIN' } });
  }
);

router.get('/:id', loadProjectAccess, requireProjectMember, async (req, res) => {
  const taskCounts = await prisma.task.groupBy({
    by: ['status'],
    where: { projectId: req.project.id },
    _count: true,
  });

  res.json({
    project: {
      ...req.project,
      myRole: req.membership.role,
      taskCounts: Object.fromEntries(taskCounts.map((t) => [t.status, t._count])),
    },
  });
});

router.put(
  '/:id',
  loadProjectAccess,
  requireAdmin,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 120 }),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  async (req, res) => {
    const project = await prisma.project.update({
      where: { id: req.project.id },
      data: {
        ...(req.body.name && { name: req.body.name }),
        ...(req.body.description !== undefined && {
          description: req.body.description || null,
        }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    res.json({ project: { ...project, myRole: req.membership.role } });
  }
);

router.delete('/:id', loadProjectAccess, requireAdmin, async (req, res) => {
  if (req.project.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Only the project owner can delete the project' });
  }

  await prisma.project.delete({ where: { id: req.project.id } });
  res.json({ message: 'Project deleted' });
});

router.get('/:id/members', loadProjectAccess, requireProjectMember, (req, res) => {
  res.json({ members: req.project.members });
});

router.post(
  '/:id/members',
  loadProjectAccess,
  requireAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('role').optional().isIn(['ADMIN', 'MEMBER']),
  ],
  validate,
  async (req, res) => {
    const { email, role = 'MEMBER' } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'No user found with that email' });
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.project.id, userId: user.id } },
    });
    if (existing) {
      return res.status(409).json({ error: 'User is already a project member' });
    }

    const member = await prisma.projectMember.create({
      data: { projectId: req.project.id, userId: user.id, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ member });
  }
);

router.put(
  '/:id/members/:userId',
  loadProjectAccess,
  requireAdmin,
  [body('role').isIn(['ADMIN', 'MEMBER'])],
  validate,
  async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (userId === req.project.ownerId && role !== 'ADMIN') {
      return res.status(400).json({ error: 'Project owner must remain an admin' });
    }

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.project.id, userId } },
    });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const updated = await prisma.projectMember.update({
      where: { id: member.id },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json({ member: updated });
  }
);

router.delete('/:id/members/:userId', loadProjectAccess, requireAdmin, async (req, res) => {
  const { userId } = req.params;

  if (userId === req.project.ownerId) {
    return res.status(400).json({ error: 'Cannot remove the project owner' });
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: req.project.id, userId } },
  });
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  await prisma.projectMember.delete({ where: { id: member.id } });
  res.json({ message: 'Member removed' });
});

module.exports = router;
