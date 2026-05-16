const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const backendRoot = path.join(__dirname, '..');

async function seedIfEmpty() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.user.count();
    if (count > 0) {
      console.log(`Database ready (${count} user(s)).`);
      return;
    }
    console.log('No users found — seeding demo data...');
    execSync('node prisma/seed.js', { stdio: 'inherit', cwd: backendRoot });
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  execSync('node scripts/set-db-provider.js', { stdio: 'inherit', cwd: backendRoot });
  execSync('node scripts/db-sync.js', { stdio: 'inherit', cwd: backendRoot });
  await seedIfEmpty();
}

main().catch((err) => {
  console.error('Database prepare failed:', err.message);
  process.exit(1);
});
