DhabaOS — Dual-Portal Restaurant Management System
DhabaOS is a full-stack Restaurant Management System (RMS) built with Next.js 14, Prisma, and Tailwind CSS for high-volume highway and urban dhabas. It connects guests, kitchen staff, valet attendants, and branch managers on a single synchronized real-time platform.
Live Deployment (Render): https://dhaba-qav3.onrender.com
GitHub Repository: Debjit-prime/Dhaba
Live Portal Links
Portal	Route	Live Render Link
Portal Switcher	/	https://dhaba-qav3.onrender.com/
Customer Menu & Ordering	/menu?table=12	https://dhaba-qav3.onrender.com/menu?table=12
Kitchen Display System (KDS)	/kds	https://dhaba-qav3.onrender.com/kds
Valet Queue & Retrieval	/valet	https://dhaba-qav3.onrender.com/valet
Admin Forecasting & Inventory	/admin	https://dhaba-qav3.onrender.com/admin#inventory
Key Features
1. Portal Switcher (/)
Central role-selection hub with frosted glass cards and a character-blur entrance headline.
Includes a liquid-glass Light / Dark Mode toggle in the floating pill header, crossfading seamlessly between sunlit and evening dining-room backdrops with top and bottom edge-blur overlays.
2. Customer Menu & Ordering (/menu?table=12 or /customer)
Table Selector (Tables 1–20): Interactive header dropdown (Table 1 through Table 20) synced with the URL query parameter (?table=1–20), propagating table context to orders and valet requests.
5 Curated Menu Categories: Starters, Mains, Tandoor (Tandoori Chicken, Achari Paneer Tikka, Chicken Malai Tikka, Tandoori Stuffed Mushroom), Breads, and Beverages, with Veg/Non-Veg badges and quantity steppers.
Checkout & Live Tracking: Slide-up cart drawer with cooking notes, 5% GST calculation, simulated payment (UPI / GPay, Card, Cash on Table), live kitchen ticket status, and one-tap Retrieve My Car valet integration.
3. Kitchen Display System — KDS (/kds or /kitchen)
Translucent Kanban Board: Airy frosted glass Pending → Preparing → Ready columns that let the ambient backdrop show through in Light Mode and shift to smoked glass in Dark Mode.
Multi-Source Order Feed: Combines Dine-in, Swiggy, and Zomato tickets with + Swiggy and + Zomato live simulation buttons.
Live Urgency Timers & Checklists: Real-time second-by-second elapsed timers (<10m New, 10–20m 10m+ warning, >20m pulsing Late alert) and interactive dish-level checkboxes.
4. Valet System (/valet)
Customer View: Ticket card with a pulsing Retrieve My Car trigger, live ETA progress bar, and animated vehicle track.
Staff View: Priority-ordered queue (HIGH, MEDIUM, LOW) with status filters, Accept & In Transit / Mark Delivered actions, and a New Ticket modal, synced across tabs over Server-Sent Events (SSE).
5. Admin Forecasting & Inventory (/admin or /dashboard)
Footfall Analytics: Today / 7 Days / 30 Days views with KPI cards (Predicted Footfall, Active Orders, Low Stock Items, Today's Revenue) and a Predicted vs. Actual Footfall chart powered by moving-average & weekday seasonality forecasting.
Inventory & Restocking (#inventory): Real-time ingredient capacity bars with urgent depletion alerts and an interactive Request Stock Transfer modal.
Tech Stack
Framework: Next.js 14.2 (App Router) + React 18 + TypeScript
Styling & Theme: Tailwind CSS + CSS custom properties (light / dark theme persistence via localStorage)
Typography & Icons: Inter Tight (next/font/google), lucide-react, and Material Symbols Outlined
Database & ORM: SQLite (default via prisma/schema.prisma) with Prisma ORM (prisma/schema.postgresql.prisma also included)
Real-Time Updates: Server-Sent Events (/api/realtime) with an in-memory pub/sub broadcast bus
Running Locally (One-Click)
Prerequisites
Node.js (v18 or v20+ LTS)
Option 1: One-Click Launcher (Recommended)
Linux / macOS / Windows (Git Bash):
Bash
bash start.sh
macOS Finder: Double-click start-dhabaos.command.
start.sh automatically checks Node.js, installs missing packages, creates .env if needed, generates the Prisma client for your OS, syncs the SQLite schema, seeds all sample data if the database is empty (Menu, Tandoor, 20 Tables, KDS orders, Valet queue, Inventory, and 14 days of Footfall records), opens http://localhost:3000, and starts the server.
Option 2: Manual Setup
Bash
# 1. Install dependencies
npm install

# 2. Create local environment file
cp .env.example .env

# 3. Generate Prisma Client, push schema, and seed demo data
npm run db:generate
npm run db:push
npm run db:seed

# 4. Start development server
npm run dev
Open http://localhost:3000 in your browser.
Deployment on Render
This project is deployed on Render using the Node runtime:
Runtime: Node
Branch: main
Build Command:
Bash
npm install --include=dev && npm run db:generate && npm run build
Start Command:
Bash
npx prisma db push && npm run db:seed && npm run start
Environment Variables:
DATABASE_URL = file:./dev.db
NEXT_PUBLIC_APP_URL = https://dhaba-qav3.onrender.com
(Note: On Render's free tier, the service sleeps after 15 minutes of inactivity; the first request after idle takes ~30–50 seconds to wake up and initialize the seeded demo database.)
Project Structure
Text
├── prisma/
│   ├── schema.prisma              # SQLite Prisma schema
│   ├── schema.postgresql.prisma   # Optional PostgreSQL schema
│   └── seed.ts                    # Menu, Tandoor, 20 tables, KDS, valet, inventory & footfall seed
├── public/assets/aistudio/        # Light & dark ambient background imagery
├── src/
│   ├── app/
│   │   ├── page.tsx               # Portal Switcher (/)
│   │   ├── (customer)/menu/       # Customer Ordering (/menu)
│   │   ├── (kitchen)/kds/         # Kitchen Display System (/kds)
│   │   ├── (valet)/valet/         # Valet System (/valet)
│   │   ├── (admin)/admin/         # Admin Dashboard (/admin)
│   │   └── api/                   # REST & SSE endpoints (/api/*)
│   ├── components/shared/         # ThemeProvider, ThemeToggle, SiteBackground, Nav & RoleSwitcherModal
│   ├── hooks/useRealtime.ts       # Client SSE subscription hook
│   └── lib/                       # Prisma client, realtime bus, forecasting engine, shared types
├── next.config.mjs                # Isolated .next-dev (dev) and .next (prod) build directories
├── start.sh                       # Cross-platform one-click local launcher
└── start-dhabaos.command          # macOS Finder one-click launcher
API Endpoints
GET /api/menu — Fetch ordered categories and available menu items
GET /api/orders & POST /api/orders — List or create dine-in / delivery orders
PATCH /api/orders/[id]/status — Transition order status (PENDING → PREPARING → READY → COMPLETED)
PATCH /api/orders/[id]/items/[itemId] — Toggle individual dish preparation status
POST /api/mock/ingest — Simulate incoming Swiggy / Zomato delivery orders
GET /api/valet & POST /api/valet — Fetch valet queue or create/request vehicle retrieval
PATCH /api/valet/[id]/status — Transition valet ticket (REQUESTED → IN_PROGRESS → DELIVERED)
GET /api/inventory & POST /api/inventory — View ingredient stock levels and record restock batches
GET /api/analytics/forecast — Retrieve historical footfall, revenue, and AI demand predictions
GET /api/realtime — Server-Sent Events stream for live multi-portal synchronization
