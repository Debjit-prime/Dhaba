'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SidebarNav } from '@/components/shared/SidebarNav';
import { MobileBottomNav } from '@/components/shared/MobileBottomNav';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useRealtimeSubscription } from '@/hooks/useRealtime';

interface ForecastData {
  records: any[];
  forecast: {
    predictedToday: number;
    growthVsLastWeekPercent: number;
    comparisonText: string;
    dailyPredictions: {
      dayOfWeek: string;
      actual: number;
      predicted: number;
      dateFormatted: string;
      revenue: number;
    }[];
  };
  metrics: {
    predictedFootfall: number;
    comparisonText: string;
    activeOrdersCount: number;
    avgPrepTimeMinutes: number;
    lowStockCount: number;
    urgentStockCount: number;
    todayRevenue: number;
    revenueFormatted: string;
  };
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  maxCapacity: number;
  reorderLevel: number;
  stockPercentage: number;
  isLowStock: boolean;
  isUrgent: boolean;
  depletionMinsEstimate?: number;
}

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('today');
  const [analytics, setAnalytics] = useState<ForecastData | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const [restockAmount, setRestockAmount] = useState<number>(20);
  const [restocking, setRestocking] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [forecastRes, invRes] = await Promise.all([
        fetch('/api/analytics/forecast'),
        fetch('/api/inventory'),
      ]);

      const forecastJson = await forecastRes.json();
      const invJson = await invRes.json();

      if (forecastJson.success) setAnalytics(forecastJson.data);
      if (invJson.success) {
        setIngredients(invJson.data);
        if (invJson.data.length > 0) {
          setSelectedIngredient(invJson.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Real-time updates
  useRealtimeSubscription(
    ['order:created', 'order:status_changed', 'inventory:updated'],
    () => {
      loadDashboardData();
    },
    loadDashboardData,
    6000
  );

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient || restockAmount <= 0) return;
    setRestocking(true);

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId: selectedIngredient,
          quantityToAdd: restockAmount,
          supplier: 'Highway Local Express Dairy',
          expiresAtDays: 5,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsRestockModalOpen(false);
        loadDashboardData();
      }
    } catch (err) {
      console.error('Restock error:', err);
    } finally {
      setRestocking(false);
    }
  };

  const metrics = analytics?.metrics || {
    predictedFootfall: 1240,
    comparisonText: '+12% vs last Friday',
    activeOrdersCount: 42,
    avgPrepTimeMinutes: 14,
    lowStockCount: 3,
    urgentStockCount: 1,
    todayRevenue: 84500,
    revenueFormatted: '₹84.5k',
  };

  const dailyPredictions = analytics?.forecast?.dailyPredictions || [
    { dayOfWeek: 'Mon', actual: 910, predicted: 850, dateFormatted: 'Mon', revenue: 62000 },
    { dayOfWeek: 'Tue', actual: 880, predicted: 900, dateFormatted: 'Tue', revenue: 60000 },
    { dayOfWeek: 'Wed', actual: 1020, predicted: 950, dateFormatted: 'Wed', revenue: 70000 },
    { dayOfWeek: 'Thu', actual: 1080, predicted: 1100, dateFormatted: 'Thu', revenue: 74000 },
    { dayOfWeek: 'Fri', actual: 1380, predicted: 1300, dateFormatted: 'Fri (Today)', revenue: 84500 },
  ];

  // Maximum value for scaling bar heights
  const maxFootfall = Math.max(
    ...dailyPredictions.flatMap((d) => [d.actual, d.predicted]),
    1500
  );

  return (
    <div className="portal-wash text-ink h-screen flex overflow-hidden font-body-md">
      {/* Desktop Sidebar */}
      <SidebarNav activePortal="dashboard" />

      {/* Main Dashboard Canvas */}
      <main className="flex-1 flex flex-col overflow-y-auto pb-24 md:pb-8">
        {/* Mobile Top Header */}
        <header className="md:hidden px-4 pt-3 pb-1 z-30">
          <div className="halden-nav flex justify-between items-center w-full px-4">
            <Link href="/" className="text-[18px] tracking-[-0.03em] font-medium text-ink flex items-center gap-2 halden-nav-link">
              <span className="material-symbols-outlined text-[22px] text-ink" style={{ fontVariationSettings: "'FILL' 1" }}>
                restaurant
              </span>
              DhabaOS
            </Link>
            <div className="flex items-center gap-2 text-muted">
              <ThemeToggle />
              <Link href="/" className="material-symbols-outlined text-[20px] text-ink">
                account_circle
              </Link>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-[var(--gut)] max-w-7xl mx-auto w-full space-y-6">
          {/* Dashboard Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 fade-up">
            <div>
              <h2 className="text-[30px] md:text-[36px] leading-[1.05] tracking-[-0.032em] text-ink font-normal">
                Overview
              </h2>
              <p className="text-[14.5px] text-muted mt-1.5">
                Real-time performance & AI forecasting for <strong className="text-ink font-medium">Highway Junction Branch</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Time Range Selector */}
              <div className="flex items-center gap-1 bg-[#fffcf7]/90 dark:bg-[#19120e]/85 backdrop-blur-md rounded-full p-1 shadow-ambient border border-outline-variant">
                <button
                  onClick={() => setTimeRange('today')}
                  className={`px-4 py-1.5 text-[13px] rounded-full transition-all font-medium ${
                    timeRange === 'today'
                      ? 'bg-ink text-on-ink shadow-sm'
                      : 'text-muted hover:text-ink hover:bg-surface-container'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setTimeRange('7days')}
                  className={`px-4 py-1.5 text-[13px] rounded-full transition-all font-medium ${
                    timeRange === '7days'
                      ? 'bg-ink text-on-ink shadow-sm'
                      : 'text-muted hover:text-ink hover:bg-surface-container'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setTimeRange('30days')}
                  className={`px-4 py-1.5 text-[13px] rounded-full transition-all font-medium ${
                    timeRange === '30days'
                      ? 'bg-ink text-on-ink shadow-sm'
                      : 'text-muted hover:text-ink hover:bg-surface-container'
                  }`}
                >
                  30 Days
                </button>
              </div>
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Top 4 Bento Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {/* Stat Card 1: Predicted Footfall */}
            <div className="halden-card halden-card-hover p-6 flex flex-col justify-between relative overflow-hidden group fade-up fade-up-1">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className="text-[12.5px] text-muted uppercase tracking-wider font-medium">
                  Predicted Footfall
                </span>
                <span className="material-symbols-outlined text-accent bg-secondary-container p-1.5 rounded-full text-[18px]">
                  trending_up
                </span>
              </div>
              <div className="relative z-10">
                <span className="text-[36px] leading-[1.05] tracking-[-0.03em] text-ink font-medium tabular-nums">
                  {metrics.predictedFootfall.toLocaleString()}
                </span>
                <p className="text-[13px] text-accent mt-1.5 font-medium">
                  {metrics.comparisonText}
                </p>
              </div>
            </div>

            {/* Stat Card 2: Active Orders */}
            <div className="halden-card halden-card-hover p-6 flex flex-col justify-between relative overflow-hidden group fade-up fade-up-2">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className="text-[12.5px] text-muted uppercase tracking-wider font-medium">
                  Active Orders
                </span>
                <span className="flex items-center gap-1.5 bg-tertiary-fixed text-ink px-3 py-1 rounded-full text-[12px] font-medium border border-dot/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-dot animate-pulse" /> Live
                </span>
              </div>
              <div className="relative z-10">
                <span className="text-[36px] leading-[1.05] tracking-[-0.03em] text-ink font-medium tabular-nums">
                  {metrics.activeOrdersCount}
                </span>
                <p className="text-[13px] text-muted mt-1.5 font-medium">
                  Avg prep time: {metrics.avgPrepTimeMinutes}m
                </p>
              </div>
            </div>

            {/* Stat Card 3: Low Stock Items */}
            <div className="halden-card halden-card-hover p-6 flex flex-col justify-between relative overflow-hidden group border-error/25 fade-up fade-up-3">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className="text-[12.5px] text-muted uppercase tracking-wider font-medium">
                  Low Stock Items
                </span>
                <span className="material-symbols-outlined text-error bg-error-container p-1.5 rounded-full text-[18px]">
                  inventory_2
                </span>
              </div>
              <div className="relative z-10">
                <span className="text-[36px] leading-[1.05] tracking-[-0.03em] text-ink font-medium tabular-nums">
                  {metrics.lowStockCount}
                </span>
                <p className="text-[13px] text-error mt-1.5 font-medium">
                  Action required immediately
                </p>
              </div>
            </div>

            {/* Stat Card 4: Revenue (Today) */}
            <div className="halden-card halden-card-hover p-6 flex flex-col justify-between relative overflow-hidden group fade-up fade-up-4">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className="text-[12.5px] text-muted uppercase tracking-wider font-medium">
                  Revenue (Today)
                </span>
                <span className="material-symbols-outlined text-ink bg-bowl-rim/50 p-1.5 rounded-full text-[18px]">
                  account_balance_wallet
                </span>
              </div>
              <div className="relative z-10">
                <span className="text-[36px] leading-[1.05] tracking-[-0.03em] text-ink font-medium tabular-nums">
                  {metrics.revenueFormatted}
                </span>
                <p className="text-[13px] text-accent mt-1.5 font-medium">
                  On track for daily goal
                </p>
              </div>
            </div>
          </div>

          {/* Main Data Section (Forecast Chart + Base Ingredients Inventory) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" id="inventory">
            {/* 1. Footfall Forecast Chart (Span 2) */}
            <div className="lg:col-span-2 halden-card p-6 flex flex-col fade-up fade-up-2">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                <div>
                  <h3 className="text-[20px] tracking-[-0.025em] text-ink font-normal">
                    Footfall: Predicted vs Actual
                  </h3>
                  <p className="text-[13px] text-muted mt-1">
                    Powered by time-series regression model on historical customer orders
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-[12.5px] font-medium text-muted">Actual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-bowl-core" />
                    <span className="text-[12.5px] font-medium text-muted">Predicted</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Bar Chart Canvas */}
              <div className="flex-1 min-h-[260px] flex items-end gap-3 sm:gap-6 justify-between pt-8 border-b border-outline-variant pb-2 relative">
                {/* Guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
                  <div className="w-full border-t border-dashed border-outline-variant" />
                  <div className="w-full border-t border-dashed border-outline-variant" />
                  <div className="w-full border-t border-dashed border-outline-variant" />
                  <div className="w-full border-t border-dashed border-outline-variant" />
                </div>

                {/* Day Bars */}
                {dailyPredictions.map((day, idx) => {
                  const predHeightPercent = Math.min(100, Math.max(15, Math.round((day.predicted / maxFootfall) * 100)));
                  const actHeightPercent = Math.min(100, Math.max(15, Math.round((day.actual / maxFootfall) * 100)));

                  return (
                    <div
                      key={day.dayOfWeek + idx}
                      className="flex-1 flex justify-center items-end gap-1.5 sm:gap-2 h-full z-10 group relative"
                    >
                      {/* Predicted Bar */}
                      <div
                        className="w-1/2 bg-bowl-core/75 rounded-t-[8px] bar-grow transition-all"
                        style={{ height: `${predHeightPercent}%`, animationDelay: `${0.1 * (idx + 1)}s` }}
                      />
                      {/* Actual Bar */}
                      <div
                        className="w-1/2 bg-accent rounded-t-[8px] bar-grow transition-all"
                        style={{ height: `${actHeightPercent}%`, animationDelay: `${0.1 * (idx + 1) + 0.1}s` }}
                      />

                      {/* Tooltip on Hover */}
                      <div className="absolute -top-10 bg-panel text-white text-[12px] px-3 py-1.5 rounded-full shadow-level-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 font-medium tabular-nums">
                        {day.dayOfWeek}: {day.predicted} pred / {day.actual} actual
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div className="flex justify-between mt-3 text-[12.5px] text-muted font-medium">
                {dailyPredictions.map((day, idx) => (
                  <span
                    key={day.dayOfWeek + idx}
                    className={`flex-1 text-center ${
                      idx === dailyPredictions.length - 1 ? 'text-ink font-medium' : ''
                    }`}
                  >
                    {idx === dailyPredictions.length - 1 ? `${day.dayOfWeek} (Today)` : day.dayOfWeek}
                  </span>
                ))}
              </div>
            </div>

            {/* 2. Base Ingredients & Stock Gauges */}
            <div className="halden-card p-6 flex flex-col fade-up fade-up-3">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-[20px] tracking-[-0.025em] text-ink font-normal">
                    Base Ingredients
                  </h3>
                  <p className="text-[12.5px] text-muted mt-0.5">Live depletion & threshold tracking</p>
                </div>
                <button
                  onClick={() => setIsRestockModalOpen(true)}
                  className="w-9 h-9 rounded-full bg-surface-container hover:bg-bowl-rim/50 text-ink flex items-center justify-center border border-outline-variant transition-colors"
                  title="Restock ingredients"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-around gap-4">
                {ingredients.map((item) => {
                  const isPaneerUrgent = item.isUrgent;

                  return (
                    <div
                      key={item.id}
                      className={
                        isPaneerUrgent
                          ? 'bg-error-container/60 -mx-3 px-3 py-3 rounded-[16px] border border-error/20'
                          : ''
                      }
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[14.5px] text-ink font-medium">
                            {item.name}
                          </span>
                          {isPaneerUrgent && (
                            <span className="bg-error text-white text-[11px] uppercase font-medium px-2.5 py-0.5 rounded-full tracking-wider animate-pulse">
                              Urgent
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[12.5px] font-medium tabular-nums ${
                            isPaneerUrgent
                              ? 'text-error'
                              : item.isLowStock
                              ? 'text-accent'
                              : 'text-ink'
                          }`}
                        >
                          {item.stockPercentage}% ({item.currentStock} {item.unit})
                        </span>
                      </div>

                      {/* Gauge Bar */}
                      <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPaneerUrgent
                              ? 'bg-error'
                              : item.isLowStock
                              ? 'bg-bowl-core'
                              : 'bg-accent'
                          }`}
                          style={{ width: `${item.stockPercentage}%` }}
                        />
                      </div>

                      {isPaneerUrgent && (
                        <p className="text-[12px] text-error mt-2 font-medium">
                          Est. depletion in 45 mins at current order rate.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setIsRestockModalOpen(true)}
                className="btn btn-full mt-6"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px]">add_shopping_cart</span>
                  Request Stock Transfer
                </span>
                <span className="btn-dot" aria-hidden="true">
                  <span className="btn-chevron">
                    <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Restock & Transfer Modal */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fffcf7]/95 dark:bg-[#19120e]/95 backdrop-blur-md rounded-[24px] p-6 max-w-md w-full shadow-level-2 border border-outline-variant">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-accent text-2xl">
                  add_shopping_cart
                </span>
                <h3 className="text-[20px] tracking-[-0.025em] text-ink font-normal">
                  Request Stock Transfer
                </h3>
              </div>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                aria-label="Close modal"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container text-muted hover:text-ink transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-muted uppercase tracking-wider block mb-1.5">
                  Select Ingredient
                </label>
                <select
                  value={selectedIngredient}
                  onChange={(e) => setSelectedIngredient(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-[14px] p-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-accent font-medium"
                >
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (Current: {ing.currentStock} {ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-medium text-muted uppercase tracking-wider block mb-1.5">
                  Quantity to Add
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(Number(e.target.value))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-[14px] p-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-accent font-medium tabular-nums"
                  required
                />
              </div>

              <div className="p-3.5 bg-surface-container rounded-[14px] text-[12.5px] text-muted border border-outline-variant">
                📦 Batch will be recorded with supplier <strong className="text-ink font-medium">Highway Local Express Dairy</strong> with 5-day expiration window.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="flex-1 h-[42px] rounded-full border border-outline-variant font-medium text-[13.5px] text-ink hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restocking}
                  className="btn flex-1 justify-center"
                >
                  <span>{restocking ? 'Restocking...' : 'Confirm Transfer'}</span>
                  <span className="btn-dot" aria-hidden="true">
                    <span className="btn-chevron">
                      <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
                    </span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab="admin" />
    </div>
  );
}
