const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function shouldSeed() {
  if (process.env.RUN_DB_SEED === 'true') {
    return { run: true, reason: 'RUN_DB_SEED=true' };
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      return { run: true, reason: 'database has no users' };
    }
    return { run: false, reason: `database already has ${count} user(s)` };
  } catch (err) {
    console.warn('Could not check user count, skipping seed:', err.message);
    return { run: false, reason: 'user count check failed' };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const { run, reason } = await shouldSeed();
  if (!run) {
    console.log(`DB seed skipped (${reason}).`);
    return;
  }

  console.log(`Seeding demo data (${reason})...`);
  execSync('node prisma/seed.js', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
