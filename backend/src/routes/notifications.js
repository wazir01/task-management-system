const express = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { ensureUserSettings } = require('../services/notifications');
const { getVapidPublicKey } = require('../services/push');

const router = express.Router();

router.use(authenticate);

router.get('/vapid-public-key', (_req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

router.get('/settings', async (req, res) => {
  const settings = await ensureUserSettings(req.user.id);
  res.json({ settings });
});

router.put(
  '/settings',
  [
    body('emailReminders').optional().isBoolean(),
    body('deadlineAlerts').optional().isBoolean(),
    body('pushNotifications').optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    const settings = await prisma.userSettings.update({
      where: { userId: req.user.id },
      data: {
        ...(req.body.emailReminders !== undefined && { emailReminders: req.body.emailReminders }),
        ...(req.body.deadlineAlerts !== undefined && { deadlineAlerts: req.body.deadlineAlerts }),
        ...(req.body.pushNotifications !== undefined && {
          pushNotifications: req.body.pushNotifications,
        }),
      },
    });
    res.json({ settings });
  }
);

router.get('/', async (req, res) => {
  const { unreadOnly } = req.query;
  const notifications = await prisma.notification.findMany({
    where: {
      userId: req.user.id,
      ...(unreadOnly === 'true' && { read: false }),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: req.user.id, read: false },
  });
  res.json({ notifications, unreadCount });
});

router.patch('/read-all', async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  });
  res.json({ message: 'All marked as read' });
});

router.patch('/:id/read', async (req, res) => {
  const n = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!n) return res.status(404).json({ error: 'Notification not found' });

  const updated = await prisma.notification.update({
    where: { id: n.id },
    data: { read: true },
  });
  res.json({ notification: updated });
});

router.post(
  '/subscribe',
  [
    body('endpoint').isURL(),
    body('keys.p256dh').notEmpty(),
    body('keys.auth').notEmpty(),
  ],
  validate,
  async (req, res) => {
    const { endpoint, keys } = req.body;

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId: req.user.id },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: req.user.id,
      },
    });

    res.status(201).json({ message: 'Subscribed to push notifications' });
  }
);

router.delete('/subscribe', async (req, res) => {
  await prisma.pushSubscription.deleteMany({ where: { userId: req.user.id } });
  res.json({ message: 'Unsubscribed' });
});

module.exports = router;
