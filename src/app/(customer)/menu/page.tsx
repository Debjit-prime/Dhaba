'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { RoleSwitcherModal } from '@/components/shared/RoleSwitcherModal';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useRealtimeSubscription } from '@/hooks/useRealtime';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  items: MenuItem[];
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customInstructions?: string;
}

const MIN_TABLE = 1;
const MAX_TABLE = 20;
const TABLE_OPTIONS = Array.from({ length: MAX_TABLE - MIN_TABLE + 1 }, (_, i) => MIN_TABLE + i);

function parseTableParam(raw: string | null): number {
  if (!raw) return 12;
  const numeric = Number.parseInt(raw.replace(/[^0-9]/g, ''), 10);
  if (Number.isNaN(numeric)) return 12;
  return Math.min(MAX_TABLE, Math.max(MIN_TABLE, numeric));
}

function CustomerMenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTableParam = searchParams.get('table');
  const [selectedTable, setSelectedTable] = useState<number>(() => parseTableParam(rawTableParam));

  useEffect(() => {
    setSelectedTable(parseTableParam(rawTableParam));
  }, [rawTableParam]);

  const tableParam = String(selectedTable);
  const tableNumber = `Table ${selectedTable}`;

  const handleTableChange = (nextTable: number) => {
    const clamped = Math.min(MAX_TABLE, Math.max(MIN_TABLE, nextTable));
    setSelectedTable(clamped);
    router.replace(`/menu?table=${clamped}`, { scroll: false });
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Starters');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'CASH'>('UPI');
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [isValetRequested, setIsValetRequested] = useState(false);
  const [valetEtaMins, setValetEtaMins] = useState(4);

  // Fetch Menu from API
  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch('/api/menu');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setCategories(json.data);
          setActiveCategory(json.data[0].name);
        }
      } catch (err) {
        console.error('Failed to load menu:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  const refreshLiveStatus = useCallback(async () => {
    try {
      if (placedOrder && placedOrder.status !== 'COMPLETED') {
        const res = await fetch('/api/orders');
        const json = await res.json();
        if (json.success) {
          const latest = json.data.find((o: any) => o.id === placedOrder.id);
          if (latest) setPlacedOrder(latest);
        }
      }
      if (isValetRequested && valetEtaMins > 0) {
        const res = await fetch('/api/valet?ticketNumber=%23V-8492');
        const json = await res.json();
        const latestValet = json.success ? json.data?.[0] : null;
        if (latestValet?.status === 'DELIVERED') {
          setValetEtaMins(0);
        } else if (latestValet?.estimatedMins !== undefined) {
          setValetEtaMins(latestValet.estimatedMins);
        }
      }
    } catch {
      // Ignore transient polling errors
    }
  }, [placedOrder, isValetRequested, valetEtaMins]);

  // Listen for live updates to the placed order
  useRealtimeSubscription(
    ['order:status_changed', 'valet:status_changed'],
    (type, data) => {
      if (type === 'order:status_changed' && placedOrder && data.id === placedOrder.id) {
        setPlacedOrder(data);
      }
      if (type === 'valet:status_changed' && isValetRequested) {
        if (data.status === 'DELIVERED') {
          setValetEtaMins(0);
        }
      }
    },
    refreshLiveStatus
  );

  const cartItemsArray = useMemo(() => Object.values(cart), [cart]);
  const totalItemsCount = useMemo(
    () => cartItemsArray.reduce((sum, item) => sum + item.quantity, 0),
    [cartItemsArray]
  );
  const subtotal = useMemo(
    () => cartItemsArray.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
    [cartItemsArray]
  );
  const gstTax = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const grandTotal = subtotal + gstTax;

  const updateQuantity = (item: MenuItem, delta: number) => {
    setCart((prev) => {
      const current = prev[item.id]?.quantity || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return {
        ...prev,
        [item.id]: {
          menuItem: item,
          quantity: next,
          customInstructions: prev[item.id]?.customInstructions || '',
        },
      };
    });
  };

  const handlePlaceOrder = async () => {
    if (cartItemsArray.length === 0) return;
    setSubmittingOrder(true);

    try {
      const formattedTableNumber = `T-${tableParam.replace('T-', '').padStart(2, '0')}`;
      const payload = {
        tableNumber: formattedTableNumber,
        source: 'DINE_IN',
        items: cartItemsArray.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          customInstructions: c.customInstructions || undefined,
        })),
        customerName: `Guest - ${tableNumber}`,
        notes: orderNotes,
        paymentMethod,
        paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'PAID',
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setPlacedOrder(json.data);
        setCart({});
        setIsCartOpen(false);
      } else {
        alert(json.error || 'Failed to place order.');
      }
    } catch (err) {
      console.error('Order submission error:', err);
      alert('Network error while placing order. Please try again.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleRequestValet = async () => {
    try {
      const formattedTableNumber = `T-${tableParam.replace('T-', '').padStart(2, '0')}`;
      const res = await fetch('/api/valet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketNumber: '#V-8492',
          vehicleModel: 'White Toyota Innova',
          vehicleNumber: 'MH-12-AB-1234',
          parkingSpot: 'Zone B Parking',
          tableNumber: formattedTableNumber,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsValetRequested(true);
      }
    } catch (err) {
      console.error('Failed to request valet:', err);
    }
  };

  return (
    <div className="portal-wash text-ink font-body-md antialiased min-h-screen flex flex-col relative pb-36">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 pt-3 md:pt-5 px-4 md:px-[var(--gut)] bg-gradient-to-b from-[#fffaf3]/65 via-[#fffaf3]/25 dark:from-[#140e0b]/70 dark:via-[#140e0b]/30 to-transparent pb-3">
        <div className="halden-nav flex justify-between items-center w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 halden-nav-link shrink-0">
            <span
              className="material-symbols-outlined text-ink text-[21px] sm:text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              restaurant_menu
            </span>
            <span className="text-[16px] sm:text-[18px] tracking-[-0.03em] font-medium text-ink">
              DhabaOS
            </span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="relative inline-flex items-center bg-secondary-container hover:bg-surface-container-high text-ink rounded-full border border-outline-variant transition-colors shrink-0">
              <span className="material-symbols-outlined text-[15px] text-accent pl-2.5 sm:pl-3 pointer-events-none">
                table_restaurant
              </span>
              <select
                aria-label="Select table number"
                value={selectedTable}
                onChange={(e) => handleTableChange(Number(e.target.value))}
                className="appearance-none bg-transparent text-ink text-[12px] sm:text-[12.5px] font-medium pl-1.5 pr-6 sm:pr-7 py-1.5 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {TABLE_OPTIONS.map((num) => (
                  <option key={num} value={num} className="bg-surface text-ink">
                    Table {num}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="w-3.5 h-3.5 text-ink/75 absolute right-2 sm:right-2.5 pointer-events-none"
                strokeWidth={2.2}
              />
            </div>
            <ThemeToggle />
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors border border-outline-variant"
              title="Switch Portal"
            >
              <span className="material-symbols-outlined text-[18px] text-ink">swap_horiz</span>
            </button>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <nav
          aria-label="Menu Categories"
          className="mt-3 overflow-x-auto no-scrollbar flex gap-2 max-w-4xl mx-auto px-1 py-1"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-ink text-on-ink shadow-ambient'
                    : 'bg-[#fffcf7]/85 dark:bg-[#19120e]/85 backdrop-blur-sm text-muted border border-outline-variant hover:text-ink hover:bg-surface-container'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Menu Content */}
      <main className="flex-1 px-4 md:px-[var(--gut)] py-4 flex flex-col gap-4 max-w-4xl w-full mx-auto">
        {/* Active Order Banner if order has been placed */}
        {placedOrder && (
          <div className="halden-card p-5 mb-2 fade-up">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-ink text-on-ink text-[12px] font-medium px-3 py-1 rounded-full">
                  Active Ticket #{placedOrder.orderNumber}
                </span>
                <span className="text-[12.5px] text-muted">Table {tableParam}</span>
              </div>
              <span
                className={`text-[12px] font-medium px-3 py-1 rounded-full uppercase tracking-wide ${
                  placedOrder.status === 'READY'
                    ? 'bg-tertiary-fixed text-ink'
                    : placedOrder.status === 'PREPARING'
                    ? 'bg-secondary-container text-ink'
                    : 'bg-surface-container text-muted'
                }`}
              >
                {placedOrder.status}
              </span>
            </div>
            <p className="text-[13.5px] text-muted">
              Your order is with the kitchen. Current status:{' '}
              <strong className="text-ink font-medium">{placedOrder.status}</strong>.
            </p>

            {/* Valet Quick Integration */}
            <div className="mt-4 pt-3.5 border-t border-outline-variant flex flex-wrap gap-3 justify-between items-center">
              <div>
                <span className="text-[13.5px] font-medium text-ink">Valet Ticket #V-8492</span>
                <p className="text-[12px] text-muted">White Toyota Innova</p>
              </div>
              {isValetRequested ? (
                <div className="flex items-center gap-1.5 text-[12.5px] text-ink font-medium bg-tertiary-fixed px-3.5 py-1.5 rounded-full border border-dot/40">
                  <span className="material-symbols-outlined text-sm animate-spin text-accent">
                    autorenew
                  </span>
                  <span>Car arriving in ~{valetEtaMins}m</span>
                </div>
              ) : (
                <button onClick={handleRequestValet} className="btn">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">directions_car</span>
                    Retrieve My Car
                  </span>
                  <span className="btn-dot" aria-hidden="true">
                    <span className="btn-chevron">
                      <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-muted">
            <span className="material-symbols-outlined text-4xl animate-spin text-accent">
              progress_activity
            </span>
            <p className="mt-2 text-[14px]">Loading authentic dhaba menu...</p>
          </div>
        ) : (
          categories
            .filter((c) => !activeCategory || c.name === activeCategory)
            .map((cat) => (
              <div key={cat.id} className="space-y-4 fade-up">
                <h2 className="text-[24px] md:text-[28px] tracking-[-0.03em] font-normal text-ink mb-2 mt-2 border-b border-outline-variant pb-2">
                  {cat.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cat.items.map((item, idx) => {
                    const quantity = cart[item.id]?.quantity || 0;
                    return (
                      <div
                        key={item.id}
                        style={{ animationDelay: `${Math.min(idx * 0.04, 0.28)}s` }}
                        className="halden-card halden-card-hover p-3.5 flex gap-4 relative overflow-hidden group fade-up"
                      >
                        {/* Food Image */}
                        <div className="w-24 h-24 shrink-0 rounded-[16px] overflow-hidden relative bg-surface-container">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              item.imageUrl ||
                              'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-1.5 right-1.5 bg-white/95 rounded-sm p-[2px] flex items-center justify-center shadow-sm">
                            <span
                              className={`w-3 h-3 border rounded-sm flex items-center justify-center ${
                                item.isVeg ? 'border-green-600' : 'border-red-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.isVeg ? 'bg-green-600' : 'bg-red-600'
                                }`}
                              />
                            </span>
                          </div>
                        </div>

                        {/* Info & Quantity Stepper */}
                        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                          <div>
                            <h3 className="text-[15.5px] tracking-[-0.015em] text-ink leading-snug font-medium">
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className="text-[12.5px] text-muted line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            )}
                            <p className="text-[17px] tracking-[-0.02em] text-ink mt-1.5 font-medium tabular-nums">
                              ₹{item.price}
                            </p>
                          </div>

                          {/* Stepper */}
                          {quantity > 0 ? (
                            <div className="flex items-center self-end bg-ink rounded-full p-1 w-24 justify-between text-on-ink shadow-ambient">
                              <button
                                onClick={() => updateQuantity(item, -1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-ink-2 rounded-full transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <span className="material-symbols-outlined text-[16px]">remove</span>
                              </button>
                              <span className="text-[13px] w-4 text-center font-medium tabular-nums">
                                {quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item, 1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-ink-2 rounded-full transition-colors"
                                aria-label="Increase quantity"
                              >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center self-end bg-surface-container rounded-full p-1 w-24 justify-between border border-outline-variant">
                              <button
                                onClick={() => updateQuantity(item, -1)}
                                disabled={quantity === 0}
                                className="w-7 h-7 flex items-center justify-center text-muted/40 rounded-full cursor-not-allowed"
                                aria-label="Decrease quantity"
                              >
                                <span className="material-symbols-outlined text-[16px]">remove</span>
                              </button>
                              <span className="text-[13px] text-ink w-4 text-center font-medium tabular-nums">
                                0
                              </span>
                              <button
                                onClick={() => updateQuantity(item, 1)}
                                className="w-7 h-7 flex items-center justify-center text-ink hover:bg-bowl-rim/50 rounded-full transition-colors"
                                aria-label="Increase quantity"
                              >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
        )}
      </main>

      {/* Sticky Bottom Cart Bar */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-0 left-0 w-full z-50 px-4 md:px-[var(--gut)] pb-5 pt-8 bg-gradient-to-t from-[#fffaf3]/75 via-[#fffaf3]/35 dark:from-[#140e0b]/80 dark:via-[#140e0b]/40 to-transparent">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="btn btn-lg w-full justify-between shadow-level-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-[13px] opacity-80 font-medium">
                  {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
                </span>
                <span className="opacity-35">·</span>
                <span className="text-[17px] font-medium tabular-nums">₹{subtotal}</span>
              </div>
              <span className="text-[16px] font-medium">View Cart</span>
              <span className="btn-dot" aria-hidden="true">
                <span className="btn-chevron">
                  <ChevronRight className="w-5 h-5" strokeWidth={2.2} />
                </span>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Slide-Up Cart & Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
          <div className="bg-[#fffcf7]/95 dark:bg-[#19120e]/95 backdrop-blur-md rounded-t-[28px] sm:rounded-[24px] w-full max-w-lg max-h-[85vh] flex flex-col shadow-level-2 border border-outline-variant overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-accent text-2xl">
                  shopping_cart
                </span>
                <h3 className="text-[20px] tracking-[-0.025em] font-normal text-ink">
                  Your Order ({tableNumber})
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container text-muted hover:text-ink transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cartItemsArray.map((cartItem) => (
                <div
                  key={cartItem.menuItem.id}
                  className="bg-surface-container-low rounded-[18px] p-3.5 flex justify-between items-center border border-outline-variant"
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          cartItem.menuItem.isVeg ? 'bg-green-600' : 'bg-red-600'
                        }`}
                      />
                      <span className="text-[14.5px] font-medium text-ink">
                        {cartItem.menuItem.name}
                      </span>
                    </div>
                    <span className="text-[12.5px] text-muted font-medium tabular-nums">
                      ₹{cartItem.menuItem.price * cartItem.quantity}
                    </span>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center bg-surface-container-lowest rounded-full p-1 gap-2 border border-outline-variant">
                    <button
                      onClick={() => updateQuantity(cartItem.menuItem, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-container hover:bg-ink hover:text-on-ink transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <span className="text-[13px] font-medium w-4 text-center tabular-nums">
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(cartItem.menuItem, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-container hover:bg-ink hover:text-on-ink transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Special Instructions */}
              <div className="mt-4">
                <label className="text-[12px] font-medium text-muted uppercase tracking-wider block mb-1.5">
                  Cooking Notes / Special Requests
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Extra spicy, less butter, no onions..."
                  className="w-full bg-surface-container-low border border-outline-variant rounded-[14px] p-3 text-[14px] text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Payment Method Selector */}
              <div className="mt-4">
                <label className="text-[12px] font-medium text-muted uppercase tracking-wider block mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI / GPay', icon: 'qr_code_2' },
                    { id: 'CARD', label: 'Card', icon: 'credit_card' },
                    { id: 'CASH', label: 'Cash on Table', icon: 'payments' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaymentMethod(p.id as any)}
                      className={`p-3 rounded-[16px] border text-[12.5px] font-medium flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === p.id
                          ? 'bg-ink text-on-ink border-ink shadow-ambient'
                          : 'bg-surface-container-lowest text-muted border-outline-variant hover:bg-surface-container hover:text-ink'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bill Breakdown */}
              <div className="bg-surface-container-low rounded-[18px] p-4 space-y-1.5 border border-outline-variant text-[13px]">
                <div className="flex justify-between text-muted">
                  <span>Item Subtotal</span>
                  <span className="tabular-nums">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>GST & Service Tax (5%)</span>
                  <span className="tabular-nums">₹{gstTax}</span>
                </div>
                <div className="flex justify-between font-medium text-[15px] text-ink border-t border-outline-variant pt-2 mt-1.5">
                  <span>Grand Total</span>
                  <span className="text-ink tabular-nums">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Footer Place Order Button */}
            <div className="p-5 bg-surface-container-low border-t border-outline-variant">
              <button
                onClick={handlePlaceOrder}
                disabled={submittingOrder}
                className="btn btn-lg btn-full"
              >
                {submittingOrder ? (
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-lg">
                      progress_activity
                    </span>
                    Sending to Kitchen...
                  </span>
                ) : (
                  <span>Place Order & Pay ₹{grandTotal}</span>
                )}
                <span className="btn-dot" aria-hidden="true">
                  <span className="btn-chevron">
                    <ChevronRight className="w-5 h-5" strokeWidth={2.2} />
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </div>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-transparent flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
        </div>
      }
    >
      <CustomerMenuContent />
    </Suspense>
  );
}
