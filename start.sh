#!/bin/bash
# ==============================================================================
# DhabaOS - Local Hosting Startup Script
# Run: ./start.sh or bash start.sh
# ==============================================================================

cd "$(dirname "$0")"

echo ""
echo "=========================================================="
echo "   🥘  DhabaOS - Restaurant Management System Launcher   "
echo "=========================================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not found on your system."
    echo "Please download and install Node.js from: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js detected: $(node -v)"

if [ ! -d "node_modules" ]; then
    echo "📦 Dependencies missing. Running npm install..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "📝 Creating default local .env file..."
    cat <<EOT > .env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
EOT
fi

if [ ! -f "dev.db" ] && [ ! -f "prisma/dev.db" ]; then
    echo "🗄️ Initializing and seeding local Dhaba database..."
    npm run db:push
    npm run db:seed
fi

echo ""
echo "=========================================================="
echo "🚀 DhabaOS is starting up locally on http://localhost:3000"
echo "   Press Ctrl + C to stop the server."
echo "=========================================================="
echo ""

(sleep 2 && open "http://localhost:3000" 2>/dev/null || true) &

npm run dev
