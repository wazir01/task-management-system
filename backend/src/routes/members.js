const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

async function requireAdminAnywhere(req, res, next) {
  const adminMembership = await prisma.projectMember.findFirst({
    where: { userId: req.user.id, role: 'ADMIN' },
    select: { id: true },
  });
  if (!adminMembership) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

router.get('/', requireAdminAnywhere, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      memberships: {
        select: {
          role: true,
          joinedAt: true,
          project: {
            select: { id: true, name: true },
          },
        },
        orderBy: { joinedAt: 'desc' },
      },
      _count: {
        select: { assignedTasks: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const members = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    assignedTaskCount: u._count.assignedTasks,
    projects: u.memberships.map((m) => ({
      id: m.project.id,
      name: m.project.name,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  }));

  res.json({ members });
});

module.exports = router;
