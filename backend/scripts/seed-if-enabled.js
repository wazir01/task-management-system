const path = require('path');
const { execSync } = require('child_process');

if (process.env.RUN_DB_SEED !== 'true') {
  console.log('DB seed skipped (set RUN_DB_SEED=true on the web service to load demo data).');
  process.exit(0);
}

console.log('RUN_DB_SEED=true — seeding demo data...');
execSync('node prisma/seed.js', {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});
