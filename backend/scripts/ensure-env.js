require('./set-db-provider');

const url = process.env.DATABASE_URL || '';
const onRailway = Boolean(
  process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.RAILWAY_SERVICE_ID
);
const isProduction = process.env.NODE_ENV === 'production';

function fail(message, steps) {
  console.error(`\n${message}\n`);
  if (steps?.length) {
    steps.forEach((line) => console.error(line));
    console.error('');
  }
  process.exit(1);
}

if (!url) {
  fail(
    'DATABASE_URL is not set. Prisma cannot run migrations or connect to the database.',
    onRailway || isProduction
      ? [
          'Railway setup:',
          '  1. In your project: + New → Database → PostgreSQL (wait until Active)',
          '  2. Open the web service (task-management-system), not the Postgres service',
          '  3. Variables → + New Variable → Add Reference → PostgreSQL → DATABASE_URL',
          '  4. Add JWT_SECRET (long random string) and NODE_ENV=production',
          '  5. Redeploy the web service',
        ]
      : [
          'Local setup:',
          '  1. Copy backend/.env.example to backend/.env',
          '  2. Set DATABASE_URL to your PostgreSQL connection string',
        ]
  );
}

if ((onRailway || isProduction) && !process.env.JWT_SECRET) {
  fail(
    'JWT_SECRET is not set. Authentication will not work in production.',
    [
      'Railway: open the web service → Variables → add JWT_SECRET (32+ random characters).',
    ]
  );
}

if (onRailway) {
  if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
    fail('DATABASE_URL must be a PostgreSQL URL on Railway.', [
      'Use Add Reference → PostgreSQL → DATABASE_URL on the web service.',
    ]);
  }
}
