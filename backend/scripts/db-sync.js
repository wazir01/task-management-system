require('./ensure-env');
const { execSync } = require('child_process');

const url = process.env.DATABASE_URL || '';
const isSqlite = url.startsWith('file:');

if (isSqlite) {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: require('path').join(__dirname, '..') });
} else {
  execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: require('path').join(__dirname, '..') });
}
