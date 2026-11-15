#!/bin/bash
# ==============================================================================
# DhabaOS - Local Hosting Startup Script
# Run: ./start.sh, bash start.sh, or double-click in file manager
# ==============================================================================

set -e
cd "$(dirname "$0")"

echo ""
echo "=========================================================="
echo "   DhabaOS - Restaurant Management System Launcher"
echo "=========================================================="
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is not found on your system."
    echo "Please download and install Node.js (LTS) from: https://nodejs.org"
    read -p "Press Enter to exit..." || true
    exit 1
fi

echo "Node.js detected: $(node -v)"

# 2. Install dependencies if missing
if [ ! -d "node_modules" ] || [ ! -d "node_modules/@prisma/client" ]; then
    echo "Installing dependencies (npm install)..."
    npm install
fi

# 3. Ensure .env exists and has DATABASE_URL (without forcing NODE_ENV)
if [ ! -f ".env" ]; then
    echo "Creating .env from defaults..."
    cat <<EOT > .env
DATABASE_URL=file:./dev.db
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOT
elif ! grep -q '^DATABASE_URL=' .env; then
    echo "Adding DATABASE_URL to .env..."
    printf '\nDATABASE_URL=file:./dev.db\n' >> .env
fi

# 4. Always ensure Prisma Client is generated for this OS and schema is synced
echo "Syncing Prisma client & SQLite schema..."
npm run db:generate
npm run db:push

# 5. Seed database automatically if Menu, Tandoor, Tables (1-20), Valet, or Orders are empty
NEEDS_SEED=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const [cats, items, tandoorItems, tables, orders, valet] = await Promise.all([
      prisma.category.count(),
      prisma.menuItem.count(),
      prisma.menuItem.count({ where: { category: { slug: 'tandoor' } } }),
      prisma.table.count(),
      prisma.order.count(),
      prisma.valetRequest.count(),
    ]);
    if (cats === 0 || items === 0 || tandoorItems === 0 || tables < 20 || (orders === 0 && valet === 0)) {
      console.log('yes');
    } else {
      console.log('no');
    }
  } catch (e) {
    console.log('yes');
  } finally {
    await prisma.\$disconnect();
  }
})();
")

if [ "$NEEDS_SEED" = "yes" ]; then
    echo "Seeding DhabaOS database (Menu, Tandoor, 20 Tables, KDS, Valet, Analytics)..."
    npm run db:seed
else
    echo "Database ready and populated."
fi

echo ""
echo "=========================================================="
echo "DhabaOS is starting on http://localhost:3000"
echo "Press Ctrl + C to stop the server."
echo "=========================================================="
echo ""

# 6. Open default browser cross-platform (macOS / Linux / Windows Git Bash)
(
  sleep 3
  if command -v open &> /dev/null; then
    open "http://localhost:3000" 2>/dev/null || true
  elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000" 2>/dev/null || true
  elif command -v cmd.exe &> /dev/null; then
    cmd.exe /c start "" "http://localhost:3000" 2>/dev/null || true
  fi
) &

# 7. Start Next.js server
npm run dev
