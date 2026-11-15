# DhabaOS — High-Volume Restaurant Management System

**DhabaOS** is a dual-portal Restaurant Management System (RMS) engineered specifically for high-velocity highway and urban dhabas. It unifies four connected experiences into a single synchronized real-time web application:

1. 📱 **Customer Portal** (`/menu?table=12` or `/customer`) — Scan, order & pay with live cart, simulated payment (UPI / Card / Cash), table context, and one-tap valet car retrieval.
2. 🥘 **Kitchen Display System (KDS)** (`/kds` or `/kitchen`) — 3-column Kanban for Dine-in, Swiggy, and Zomato orders with dynamic urgency color-coding (<10m Green, 10–20m Amber, >20m Red pulsing), item checkboxes, and simulated external order injection.
3. 🚗 **Valet System** (`/valet`) — Dual-view experience with animated car driving ETA for customers and real-time wait-time queue with status transitions for valet attendants.
4. 📊 **Admin Dashboard** (`/admin` or `/dashboard`) — Time-series AI footfall forecasting model (predicted vs. actual footfall), real stock depletion tracking with urgent warnings, and instant stock transfers.
5. 🔀 **Portal Switcher** (`/`) — Central hub matching the Stitch design system to jump between all roles.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS with custom design tokens extracted from `DESIGN.md` (Terracotta `#9e3d00`, Mustard `#735c00`, Cream `#fff8f6`, Charcoal-Brown `#251913`, 8px spacing, and tactile shadows)
- **Typography & Icons**: Google Fonts `Manrope` (400, 600, 700, 800) + `Material Symbols Outlined`
- **Database & ORM**: PostgreSQL / SQLite via **Prisma ORM**
- **Real-Time Layer**: Server-Sent Events (SSE) via `/api/realtime` with in-memory pub-sub event bus
- **Forecasting Engine**: Statistical time-series regression with 7-day moving averages and weekday seasonality multipliers

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd "2. Dhaba"
npm install
```

### 2. Environment Configuration
Create your `.env` file (an `.env.example` is provided):
```bash
# SQLite (Zero-config out of the box)
DATABASE_URL="file:./dev.db"

# Or PostgreSQL (Production / Docker)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dhabaos?schema=public"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Initialize Database & Seed Authentic Dhaba Data
```bash
# Generate Prisma client and push schema
npm run db:generate
npm run db:push

# Seed realistic menu (INR), active KDS tickets, valet requests, stock gauges, and 14 days of footfall records
npm run db:seed
```

### 4. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the **Portal Switcher**.

---

## 📖 Walkthrough of the 4 Portals

### 1. Portal Switcher (`/`)
- Choose between **Customer Portal**, **Kitchen KDS**, **Valet System**, or **Admin Dashboard**.
- Features tactile elevation, ambient shadows, and role icons.

### 2. Customer Portal (`/menu?table=12`)
- **Table-Scoped Ordering**: URL param determines the table (`?table=12`).
- **Category Tabs**: Horizontal scroll for Starters, Mains, Tandoor, Breads, Beverages.
- **Menu Cards**: Veg/non-veg indicators, item photos, and tactile quantity steppers (`+/-`).
- **Cart & Checkout Drawer**: Floating bottom bar opens slide-up drawer with cooking instructions, GST breakdown, simulated UPI/Card/Cash payment, and order submission.
- **Live Ticket & Valet Link**: Once ordered, displays live ticket status and an embedded **"Retrieve My Car"** valet button.

### 3. Kitchen Display System (KDS) (`/kds`)
- **Multi-Source Ingestion**: Unifies Dine-in, Swiggy (`moped`), and Zomato (`two_wheeler`) orders.
- **Kanban Columns**: **Pending** ➔ **Preparing** ➔ **Ready** ➔ **Served**.
- **Real-Time Urgency Timers**: Computed dynamically from real `createdAt` timestamps with live ticking seconds:
  - `< 10 mins`: Green border / badge "New"
  - `10–20 mins`: Amber border / badge "10m+"
  - `> 20 mins`: Red border / pulsing badge "Late"
- **Interactive Checklists**: Item-level checkboxes in the Preparing column strike through completed dishes.
- **Simulate Orders**: Use the **"+ Swiggy"** or **"+ Zomato"** header buttons to test incoming external delivery orders in real time!

### 4. Valet System (`/valet`)
- **Capsule View Toggle**: Switch seamlessly between **Customer View** and **Staff View**.
- **Customer View**: Displays ticket `#V-8492` (White Toyota Innova) with a large pulsing **"RETRIEVE MY CAR"** button. When tapped, switches to a live progress bar, approx 4 min ETA, and a CSS animated car driving along a track.
- **Staff View**: Shows the live queue sorted by wait time with priority badges (High/Medium/Low) and action buttons (**"ACCEPT & IN TRANSIT"**, **"MARK DELIVERED"**).
- Synchronized live over SSE — status changes in staff view instantly update customer view.

### 5. Admin AI Forecasting & Inventory Dashboard (`/admin`)
- **Time Filters**: Today, 7 Days, 30 Days.
- **4 Bento Stat Cards**: Predicted Footfall (`1,240`), Active Orders (`42` live), Low Stock Items (`3`), and Today's Revenue (`₹84.5k`).
- **Footfall: Predicted vs Actual Chart**: Visualizes actual footfall vs AI projected footfall with day-wise hover tooltips.
- **Base Ingredients Gauges**: Stock percentage bars for Maida (80%), Cooking Oil (45%), Fresh Paneer (12% Urgent Alert: *"Est. depletion in 45 mins at current order rate"*), and Marinated Chicken (60%).
- **Request Stock Transfer**: Interactive restock modal allowing instant restock with batch expiry tracking.

---

## 🗄 Switching to PostgreSQL

To deploy with PostgreSQL:
1. Replace `prisma/schema.prisma` with `prisma/schema.postgresql.prisma` (or change `provider = "postgresql"` in `schema.prisma`).
2. Update `DATABASE_URL` in `.env` to your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/dhabaos?schema=public"
   ```
3. Run `npm run db:push && npm run db:seed`.

---

## 🧪 Verification & Build

To test production build and strict TypeScript compliance:
```bash
npm run build
```
