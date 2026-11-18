'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SidebarNav } from '@/components/shared/SidebarNav';
import { MobileBottomNav } from '@/components/shared/MobileBottomNav';
import { useRealtimeSubscription } from '@/hooks/useRealtime';
import { RoleSwitcherModal } from '@/components/shared/RoleSwitcherModal';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  customInstructions: string | null;
  isPrepared: boolean;
  menuItem: {
    name: string;
    isVeg: boolean;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  source: 'DINE_IN' | 'SWIGGY' | 'ZOMATO';
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  tableId: string | null;
  table?: {
    number: string;
  } | null;
  totalAmount: number;
  notes: string | null;
  items: OrderItem[];
  createdAt: string;
}

export default function KitchenKDSPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isSimulating, setIsSimulating] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error('Failed to load KDS orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Live timer tick every second for real elapsed time calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time events subscription
  useRealtimeSubscription(
    ['order:created', 'order:status_changed', 'order:item_toggled'],
    (type, data) => {
      if (type === 'order:created') {
        setOrders((prev) => {
          if (prev.some((o) => o.id === data.id)) return prev;
          return [data, ...prev];
        });
      } else if (type === 'order:status_changed') {
        setOrders((prev) =>
          prev.map((o) => (o.id === data.id ? { ...o, status: data.status } : o))
        );
      } else if (type === 'order:item_toggled') {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === data.orderId) {
              return {
                ...o,
                items: o.items.map((it) =>
                  it.id === data.itemId ? { ...it, isPrepared: data.isPrepared } : it
                ),
              };
            }
            return o;
          })
        );
      }
    }
  );

  // Status transition handlers
  const handleUpdateStatus = async (
    orderId: string,
    newStatus: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED'
  ) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update order status:', err);
      loadOrders();
    }
  };

  const handleToggleItem = async (orderId: string, itemId: string, currentState: boolean) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            items: o.items.map((i) =>
              i.id === itemId ? { ...i, isPrepared: !currentState } : i
            ),
          };
        }
        return o;
      })
    );

    try {
      await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrepared: !currentState }),
      });
    } catch (err) {
      console.error('Failed to toggle item:', err);
      loadOrders();
    }
  };

  const handleSimulateDeliveryOrder = async (source: 'SWIGGY' | 'ZOMATO') => {
    setIsSimulating(true);
    try {
      await fetch('/api/mock/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Helper to compute elapsed minutes/seconds and urgency tier
  const getElapsedDetails = (createdAt: string) => {
    const elapsedSeconds = Math.max(0, Math.floor((currentTime - new Date(createdAt).getTime()) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (mins < 10) {
      return {
        formatted,
        tier: 'FRESH',
        borderColor: 'border-t-[#0f766e] dark:border-t-[#38b89a]',
        textColor: 'text-[#0f766e] dark:text-[#6ee7c8]',
        badgeBg:
          'bg-[#0f766e]/10 text-[#0f766e] border border-[#0f766e]/25 dark:bg-[#38b89a]/15 dark:text-[#7cecd0] dark:border-[#38b89a]/35',
        badgeLabel: 'New',
      };
    } else if (mins < 20) {
      return {
        formatted,
        tier: 'WARNING',
        borderColor: 'border-t-[#b45309] dark:border-t-[#dca54a]',
        textColor: 'text-[#b45309] dark:text-[#f2c478]',
        badgeBg:
          'bg-[#b45309]/10 text-[#92400e] border border-[#b45309]/25 dark:bg-[#dca54a]/15 dark:text-[#f2c478] dark:border-[#dca54a]/35',
        badgeLabel: '10m+',
      };
    } else {
      return {
        formatted,
        tier: 'LATE',
        borderColor: 'border-t-[#b91c1c] dark:border-t-[#d96363]',
        textColor: 'text-[#b91c1c] dark:text-[#f38b8b]',
        badgeBg:
          'bg-[#b91c1c]/10 text-[#991b1b] border border-[#b91c1c]/25 dark:bg-[#d96363]/20 dark:text-[#fca5a5] dark:border-[#d96363]/40',
        badgeLabel: 'Late',
      };
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  return (
    <div className="portal-wash text-ink h-screen flex flex-col overflow-hidden font-body-md">
      {/* TopNavBar */}
      <header className="w-full px-4 md:px-[var(--gut)] pt-3 md:pt-4 pb-2 z-50 flex-shrink-0">
        <div className="halden-nav flex justify-between items-center w-full px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[18px] tracking-[-0.03em] font-medium text-ink flex items-center gap-2 halden-nav-link">
              <span className="material-symbols-outlined text-[22px] text-ink" style={{ fontVariationSettings: "'FILL' 1" }}>
                restaurant
              </span>
              DhabaOS
            </Link>
            <span className="bg-secondary-container text-ink text-[12px] px-3 py-1 rounded-full font-medium border border-outline-variant hidden sm:inline-flex items-center">
              Kitchen KDS Live
            </span>
          </div>

          {/* Action controls & simulator */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Quick Mock Ingest Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSimulateDeliveryOrder('SWIGGY')}
                disabled={isSimulating}
                className="bg-surface-container hover:bg-surface-container-high text-[12.5px] font-medium text-ink px-3 py-1.5 rounded-full border border-outline-variant transition-colors flex items-center gap-1"
                title="Simulate incoming Swiggy delivery order"
              >
                <span className="material-symbols-outlined text-[16px] text-accent">moped</span>
                <span className="hidden sm:inline">+ Swiggy</span>
              </button>
              <button
                onClick={() => handleSimulateDeliveryOrder('ZOMATO')}
                disabled={isSimulating}
                className="bg-surface-container hover:bg-surface-container-high text-[12.5px] font-medium text-ink px-3 py-1.5 rounded-full border border-outline-variant transition-colors flex items-center gap-1"
                title="Simulate incoming Zomato delivery order"
              >
                <span className="material-symbols-outlined text-[16px] text-error">two_wheeler</span>
                <span className="hidden sm:inline">+ Zomato</span>
              </button>
            </div>

            <ThemeToggle />

            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-ink flex items-center justify-center border border-outline-variant transition-colors"
              title="Switch Role"
            >
              <span className="material-symbols-outlined text-[19px]">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 h-full overflow-hidden">
        {/* Desktop Sidebar */}
        <SidebarNav activePortal="kds" />

        {/* Main KDS Kanban Board */}
        <main className="flex-1 flex overflow-x-auto p-4 md:p-6 gap-5 h-full pb-24 md:pb-6">
          {/* COLUMN 1: PENDING */}
          <div className="flex flex-col min-w-[310px] max-w-[400px] flex-1 kds-column p-4 h-full">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[20px] tracking-[-0.03em] text-ink font-normal">Pending</h2>
              <span className="bg-ink/10 text-ink border border-ink/15 dark:bg-white/10 dark:text-white dark:border-white/15 text-[12.5px] px-3 py-0.5 rounded-full font-medium tabular-nums">
                {pendingOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-6">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-12 text-muted text-[13.5px]">
                  No pending tickets
                </div>
              ) : (
                pendingOrders.map((order) => {
                  const elapsed = getElapsedDetails(order.createdAt);
                  return (
                    <div
                      key={order.id}
                      className={`kds-ticket p-4 kds-card border-t-[3px] ${elapsed.borderColor} relative flex flex-col min-h-[220px] animate-fade-in transition-all`}
                    >
                      {/* Ticket Header */}
                      <div className="flex justify-between items-start mb-3 border-b border-outline-variant pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`${elapsed.badgeBg} text-[11.5px] px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wider`}>
                            {elapsed.badgeLabel}
                          </span>
                          <span className="text-[19px] tracking-[-0.02em] text-ink font-medium">
                            {order.orderNumber}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`text-[18px] font-medium tabular-nums ${elapsed.textColor}`}>
                            {elapsed.formatted}
                          </div>
                          <div className="flex items-center justify-end text-muted text-[12px] gap-1 font-medium">
                            <span className="material-symbols-outlined text-[14px]">
                              {order.source === 'DINE_IN'
                                ? 'restaurant'
                                : order.source === 'SWIGGY'
                                ? 'moped'
                                : 'two_wheeler'}
                            </span>
                            <span>{order.source === 'DINE_IN' ? 'Dine-in' : order.source}</span>
                          </div>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="flex-1 space-y-2.5 mb-4 text-[14px]">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-start border-b border-outline-variant border-dashed pb-1.5"
                          >
                            <span className="text-[14.5px] font-medium text-ink">
                              {item.quantity}x {item.menuItem.name}
                            </span>
                            {item.customInstructions && (
                              <span className="text-[11.5px] text-[#991b1b] bg-[#b91c1c]/10 border border-[#b91c1c]/25 dark:text-[#fca5a5] dark:bg-[#d96363]/20 dark:border-[#d96363]/35 px-2.5 py-0.5 rounded-full font-medium ml-2">
                                {item.customInstructions}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                        className="btn btn-full mt-auto"
                      >
                        <span>Start Order</span>
                        <span className="btn-dot" aria-hidden="true">
                          <span className="btn-chevron">
                            <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
                          </span>
                        </span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: PREPARING */}
          <div className="flex flex-col min-w-[310px] max-w-[400px] flex-1 kds-column p-4 h-full">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[20px] tracking-[-0.03em] text-ink font-normal">Preparing</h2>
              <span className="bg-accent/15 text-accent border border-accent/25 dark:bg-accent/25 dark:text-bowl-rim dark:border-accent/40 text-[12.5px] px-3 py-0.5 rounded-full font-medium tabular-nums">
                {preparingOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-6">
              {preparingOrders.length === 0 ? (
                <div className="text-center py-12 text-muted text-[13.5px]">
                  No active orders in prep
                </div>
              ) : (
                preparingOrders.map((order) => {
                  const elapsed = getElapsedDetails(order.createdAt);
                  const isLate = elapsed.tier === 'LATE';

                  return (
                    <div
                      key={order.id}
                      className={`kds-ticket p-4 ${
                        isLate
                          ? 'kds-card-urgent border-t-[3px] border-t-[#b91c1c] dark:border-t-[#d96363]'
                          : 'kds-card border-t-[3px] border-t-accent'
                      } relative flex flex-col min-h-[220px] animate-fade-in transition-all`}
                    >
                      {/* Overdue Alert Ping */}
                      {isLate && (
                        <div className="absolute -top-2 -right-2">
                          <span className="flex h-6 w-6 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d96363] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-6 w-6 bg-[#b91c1c] dark:bg-[#d96363] text-white items-center justify-center text-xs material-symbols-outlined">
                              warning
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Header */}
                      <div className="flex justify-between items-start mb-3 border-b border-outline-variant pb-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`${
                              isLate
                                ? 'bg-[#b91c1c]/10 text-[#991b1b] border border-[#b91c1c]/25 dark:bg-[#d96363]/20 dark:text-[#fca5a5] dark:border-[#d96363]/40'
                                : 'bg-accent/15 text-accent border border-accent/25 dark:bg-accent/25 dark:text-bowl-rim dark:border-accent/40'
                            } text-[11.5px] px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wider`}
                          >
                            {isLate ? 'Late' : 'Cooking'}
                          </span>
                          <span className="text-[19px] tracking-[-0.02em] text-ink font-medium">
                            {order.orderNumber}
                          </span>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-[18px] font-medium tabular-nums ${
                              isLate ? 'text-[#b91c1c] dark:text-[#f38b8b]' : 'text-[#b45309] dark:text-bowl-core'
                            }`}
                          >
                            {elapsed.formatted}
                          </div>
                          <div className="flex items-center justify-end text-muted text-[12px] gap-1 font-medium">
                            <span className="material-symbols-outlined text-[14px]">
                              {order.source === 'DINE_IN'
                                ? 'restaurant'
                                : order.source === 'SWIGGY'
                                ? 'moped'
                                : 'two_wheeler'}
                            </span>
                            <span>{order.source === 'DINE_IN' ? 'Dine-in' : order.source}</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Item Checkboxes */}
                      <div className="flex-1 space-y-2.5 mb-4 text-[14px]">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 border-b border-outline-variant border-dashed pb-2 cursor-pointer select-none"
                            onClick={() => handleToggleItem(order.id, item.id, item.isPrepared)}
                          >
                            <input
                              type="checkbox"
                              checked={item.isPrepared}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-ink/30 dark:border-white/30 bg-white/60 dark:bg-white/10 text-accent focus:ring-accent cursor-pointer accent-[#9e2a2b]"
                            />
                            <span
                              className={`text-[14.5px] ${
                                item.isPrepared
                                  ? 'text-muted/60 line-through font-normal'
                                  : 'text-ink font-medium'
                              }`}
                            >
                              {item.quantity}x {item.menuItem.name}
                            </span>
                            {item.customInstructions && (
                              <span className="text-[11.5px] text-[#991b1b] bg-[#b91c1c]/10 border border-[#b91c1c]/25 dark:text-[#fca5a5] dark:bg-[#d96363]/20 dark:border-[#d96363]/35 px-2.5 py-0.5 rounded-full font-medium ml-auto">
                                {item.customInstructions}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                        className="btn btn-full !bg-[#9e2a2b] !text-white hover:!bg-[#822021] mt-auto"
                      >
                        <span>Mark Ready</span>
                        <span className="btn-dot" aria-hidden="true">
                          <span className="btn-chevron">
                            <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
                          </span>
                        </span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 3: READY */}
          <div className="flex flex-col min-w-[310px] max-w-[400px] flex-1 kds-column p-4 h-full">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[20px] tracking-[-0.03em] text-ink font-normal">Ready</h2>
              <span className="bg-[#0f766e]/15 text-[#0f766e] border border-[#0f766e]/25 dark:bg-[#38b89a]/20 dark:text-[#7cecd0] dark:border-[#38b89a]/35 text-[12.5px] px-3 py-0.5 rounded-full font-medium tabular-nums">
                {readyOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-6">
              {readyOrders.length === 0 ? (
                <div className="text-center py-12 text-muted text-[13.5px]">
                  No orders waiting for pickup
                </div>
              ) : (
                readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="kds-ticket p-4 border-t-[3px] border-t-[#0f766e] dark:border-t-[#38b89a] relative flex flex-col min-h-[175px] kds-card animate-fade-in"
                  >
                    <div className="flex justify-between items-start mb-3 border-b border-outline-variant pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[19px] tracking-[-0.02em] text-ink/75 font-medium line-through">
                          {order.orderNumber}
                        </span>
                        <span className="bg-[#0f766e]/15 text-[#0f766e] border border-[#0f766e]/25 dark:bg-[#38b89a]/20 dark:text-[#7cecd0] dark:border-[#38b89a]/35 text-[11.5px] px-2.5 py-0.5 rounded-full font-medium">
                          Plated
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end text-muted text-[12px] gap-1 font-medium">
                          <span className="material-symbols-outlined text-[14px]">
                            {order.source === 'DINE_IN'
                              ? 'restaurant'
                              : order.source === 'SWIGGY'
                              ? 'moped'
                              : 'two_wheeler'}
                          </span>
                          <span>{order.source === 'DINE_IN' ? 'Dine-in' : order.source}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-1.5 mb-4 text-ink/80 text-[14px]">
                      {order.items.map((item) => (
                        <div key={item.id}>
                          {item.quantity}x {item.menuItem.name}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      className="btn btn-full !bg-ink/10 !text-ink hover:!bg-ink/15 !border-ink/15 dark:!bg-white/10 dark:!text-white dark:hover:!bg-white/20 dark:!border-white/15 mt-auto"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#0f766e] dark:text-[#6ee7c8]">
                          check_circle
                        </span>
                        Served / Dispatched
                      </span>
                      <span className="btn-dot" aria-hidden="true">
                        <span className="btn-chevron">
                          <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
                        </span>
                      </span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab="kds" />

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </div>
  );
}
