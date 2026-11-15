#!/bin/bash
# ==============================================================================
# DhabaOS - One-Click Local Hosting Launcher (macOS)
# Double-click this file in macOS Finder or run `./start-dhabaos.command`
# ==============================================================================

set -e
cd "$(dirname "$0")"

echo ""
echo "=========================================================="
echo "   DhabaOS - Restaurant Management System Launcher"
echo "=========================================================="
echo ""

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is not found on your system."
    echo "Please download and install Node.js (LTS) from: https://nodejs.org"
    read -p "Press Enter to exit..." || true
    exit 1
fi

echo "Node.js detected: $(node -v)"

# 2. Install dependencies if missing
if [ ! -d "node_modules" ] || [ ! -d "node_modules/@prisma/client" ]; then
    echo "Dependencies missing. Running npm install..."
    npm install
fi

# 3. Ensure .env exists and has DATABASE_URL (without forcing NODE_ENV)
if [ ! -f ".env" ]; then
    echo "Creating default local .env file..."
    cat <<EOT > .env
DATABASE_URL=file:./dev.db
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOT
elif ! grep -q '^DATABASE_URL=' .env; then
    echo "Adding DATABASE_URL to .env..."
    printf '\nDATABASE_URL=file:./dev.db\n' >> .env
fi

# 4. Generate Prisma client for macOS and sync schema
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
echo "DhabaOS is starting up locally!"
echo "Opening http://localhost:3000 in your browser..."
echo "Press Ctrl + C in this window to stop the server."
echo "=========================================================="
echo ""

(sleep 3 && open "http://localhost:3000" 2>/dev/null || true) &

npm run dev
