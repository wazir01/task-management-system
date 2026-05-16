const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const url = process.env.DATABASE_URL || '';
// Local SQLite file URLs use sqlite; Railway PostgreSQL (or empty at build) uses postgresql.
const provider = url.startsWith('file:') ? 'sqlite' : 'postgresql';

let schema = fs.readFileSync(schemaPath, 'utf8');
schema = schema.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${provider}"`);
fs.writeFileSync(schemaPath, schema);

console.log(`Prisma datasource provider set to ${provider}`);
