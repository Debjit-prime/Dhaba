#!/bin/bash
# ==============================================================================
# DhabaOS - One-Click Local Hosting Launcher
# Double-click this file in macOS Finder or run `./start-dhabaos.command`
# ==============================================================================

# Ensure script runs in the project directory regardless of where it's called from
cd "$(dirname "$0")"

echo ""
echo "=========================================================="
echo "   🥘  DhabaOS - Restaurant Management System Launcher   "
echo "=========================================================="
echo ""

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not found on your system."
    echo "Please download and install Node.js from: https://nodejs.org"
    read -p "Press Enter to exit..."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js detected: $NODE_VERSION"

# 2. Check and Install Dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Dependencies missing. Running npm install..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed. Please check your internet connection."
        read -p "Press Enter to exit..."
        exit 1
    fi
fi

# 3. Ensure Environment File exists
if [ ! -f ".env" ]; then
    echo "📝 Creating default local .env file..."
    cat <<EOT > .env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
EOT
fi

# 4. Ensure Local SQLite Database is synced and seeded
if [ ! -f "dev.db" ] && [ ! -f "prisma/dev.db" ]; then
    echo "🗄️ Initializing and seeding local Dhaba database..."
    npm run db:push
    npm run db:seed
fi

echo ""
echo "=========================================================="
echo "🚀 DhabaOS is starting up locally!"
echo "   Opening http://localhost:3000 in your browser..."
echo "   Press Ctrl + C in this window to stop the server."
echo "=========================================================="
echo ""

# 5. Automatically open the default browser after 2 seconds
(sleep 2 && open "http://localhost:3000") &

# 6. Start the local server
npm run dev
