const webpush = require('web-push');
const prisma = require('../lib/prisma');

let configured = false;

function configurePush() {
  if (configured) return !!process.env.VAPID_PUBLIC_KEY;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@tasknest.local',
    pub,
    priv
  );
  configured = true;
  return true;
}

function getVapidPublicKey() {
  configurePush();
  return process.env.VAPID_PUBLIC_KEY || null;
}

async function sendPushToUser(userId, payload) {
  if (!configurePush()) return false;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) return false;

  const body = JSON.stringify(payload);
  let sent = false;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
        sent = true;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );

  return sent;
}

module.exports = { getVapidPublicKey, sendPushToUser, configurePush };
