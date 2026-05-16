const prisma = require('../lib/prisma');

async function getMembership(projectId, userId) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
}

function requireProjectMember(req, res, next) {
  if (!req.membership) {
    return res.status(403).json({ error: 'You are not a member of this project' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.membership || req.membership.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

async function loadProjectAccess(req, res, next) {
  const projectId = req.params.projectId || req.params.id;
  if (!projectId) {
    return res.status(400).json({ error: 'Project ID required' });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const membership = await getMembership(projectId, req.user.id);
  req.project = project;
  req.membership = membership;
  next();
}

async function loadTaskAccess(req, res, next) {
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId || req.params.id },
    include: {
      project: true,
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const membership = await getMembership(task.projectId, req.user.id);
  if (!membership) {
    return res.status(403).json({ error: 'You are not a member of this project' });
  }

  req.task = task;
  req.membership = membership;
  next();
}

module.exports = {
  getMembership,
  requireProjectMember,
  requireAdmin,
  loadProjectAccess,
  loadTaskAccess,
};
