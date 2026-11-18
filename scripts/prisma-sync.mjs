import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvFallback() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const val = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

loadEnvFallback();

const databaseUrl = (process.env.DATABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
const isPostgres = /^postgres(ql)?:\/\//i.test(databaseUrl);
const schemaPath = isPostgres ? 'prisma/schema.postgresql.prisma' : 'prisma/schema.prisma';
const action = process.argv[2] || 'generate';

console.log(`[DhabaOS Prisma] Mode: ${isPostgres ? 'PostgreSQL' : 'SQLite'} (${schemaPath})`);

if (action === 'generate') {
  run(`npx prisma generate --schema=${schemaPath}`);
} else if (action === 'push') {
  run(`npx prisma db push --schema=${schemaPath}`);
} else if (action === 'build') {
  run(`npx prisma generate --schema=${schemaPath}`);

  if (isPostgres) {
    console.log('[DhabaOS Prisma] Syncing PostgreSQL schema...');
    run(`npx prisma db push --schema=${schemaPath} --accept-data-loss`);

    const checkCmd = [
      'node -e "',
      "const { PrismaClient } = require('@prisma/client');",
      'const prisma = new PrismaClient();',
      '(async () => {',
      '  try {',
      '    const [cats, items, tables] = await Promise.all([',
      '      prisma.category.count(),',
      '      prisma.menuItem.count(),',
      '      prisma.table.count(),',
      '    ]);',
      "    if (cats === 0 || items === 0 || tables < 20) console.log('NEEDS_SEED');",
      "    else console.log('ALREADY_SEEDED');",
      '  } finally {',
      '    await prisma.$disconnect();',
      '  }',
      '})().catch((e) => { console.error(e); process.exit(1); });',
      '"',
    ].join(' ');

    const status = execSync(checkCmd, { env: process.env, encoding: 'utf8' }).trim();
    if (status === 'NEEDS_SEED') {
      console.log('[DhabaOS Prisma] Database is empty — seeding initial DhabaOS data...');
      run('npx tsx prisma/seed.ts');
    } else {
      console.log('[DhabaOS Prisma] PostgreSQL database already seeded.');
    }
  }
} else {
  console.error(`Unknown action: ${action}`);
  process.exit(1);
}
