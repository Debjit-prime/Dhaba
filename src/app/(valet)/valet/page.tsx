'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SidebarNav } from '@/components/shared/SidebarNav';
import { MobileBottomNav } from '@/components/shared/MobileBottomNav';
import { RoleSwitcherModal } from '@/components/shared/RoleSwitcherModal';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useRealtimeSubscription } from '@/hooks/useRealtime';

interface ValetRequest {
  id: string;
  ticketNumber: string;
  vehicleModel: string;
  vehicleNumber: string;
  parkingSpot: string | null;
  guestName: string | null;
  tableId: string | null;
  table?: {
    number: string;
  } | null;
  status: 'PARKED' | 'REQUESTED' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedMins: number;
  requestedAt: string | null;
  createdAt: string;
}

export default function ValetSystemPage() {
  const [activeView, setActiveView] = useState<'customer' | 'staff'>('customer');
  const [valetQueue, setValetQueue] = useState<ValetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'DELIVERED'>('ACTIVE');

  // Customer View State
  const [customerTicketNumber, setCustomerTicketNumber] = useState('#V-8492');
  const [customerVehicle, setCustomerVehicle] = useState({
    model: 'White Toyota Innova',
    number: 'MH-12-AB-1234',
    spot: 'Zone B Parking',
    guest: 'Table 12 Guest',
  });
  const [isCustomerRequested, setIsCustomerRequested] = useState(false);
  const [customerEtaMins, setCustomerEtaMins] = useState(4);
  const [customerStatus, setCustomerStatus] = useState<string>('PARKED');

  // New Ticket Creation Modal for Staff
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleNumber, setNewVehicleNumber] = useState('');
  const [newParkingSpot, setNewParkingSpot] = useState('Zone A Parking');
  const [newGuestName, setNewGuestName] = useState('');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Load Valet Queue from API
  const loadValetQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/valet');
      const json = await res.json();
      if (json.success) {
        setValetQueue(json.data);

        // Synchronize customer view if matching ticket exists
        const myTicket = json.data.find(
          (v: ValetRequest) => v.ticketNumber === customerTicketNumber
        );
        if (myTicket) {
          setCustomerStatus(myTicket.status);
          if (myTicket.status === 'REQUESTED' || myTicket.status === 'IN_PROGRESS') {
            setIsCustomerRequested(true);
            setCustomerEtaMins(myTicket.estimatedMins || 4);
          } else if (myTicket.status === 'DELIVERED') {
            setIsCustomerRequested(true);
            setCustomerEtaMins(0);
          } else if (myTicket.status === 'PARKED') {
            setIsCustomerRequested(false);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load valet queue:', err);
    } finally {
      setLoading(false);
    }
  }, [customerTicketNumber]);

  useEffect(() => {
    loadValetQueue();
  }, [loadValetQueue]);

  // Live timer tick for wait times
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time synchronization
  useRealtimeSubscription(['valet:requested', 'valet:status_changed'], (type, data) => {
    if (type === 'valet:requested') {
      setValetQueue((prev) => {
        const filtered = prev.filter((v) => v.id !== data.id);
        return [data, ...filtered];
      });
      if (data.ticketNumber === customerTicketNumber) {
        setIsCustomerRequested(true);
        setCustomerStatus('REQUESTED');
      }
    } else if (type === 'valet:status_changed') {
      setValetQueue((prev) =>
        prev.map((v) =>
          v.id === data.id ? { ...v, status: data.status, estimatedMins: data.estimatedMins } : v
        )
      );
      if (data.ticketNumber === customerTicketNumber) {
        setCustomerStatus(data.status);
        if (data.status === 'DELIVERED') {
          setCustomerEtaMins(0);
        }
      }
    }
  });

  // Customer: Request Car
  const handleCustomerRequestCar = async () => {
    setIsCustomerRequested(true);
    setCustomerStatus('REQUESTED');

    try {
      await fetch('/api/valet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketNumber: customerTicketNumber,
          vehicleModel: customerVehicle.model,
          vehicleNumber: customerVehicle.number,
          parkingSpot: customerVehicle.spot,
          tableNumber: 'T-12',
          guestName: customerVehicle.guest,
        }),
      });
    } catch (err) {
      console.error('Error requesting car:', err);
    }
  };

  // Customer: Cancel Request
  const handleCustomerCancelRequest = async () => {
    setIsCustomerRequested(false);
    setCustomerStatus('PARKED');

    const myTicket = valetQueue.find((v) => v.ticketNumber === customerTicketNumber);
    if (myTicket) {
      try {
        await fetch(`/api/valet/${myTicket.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PARKED' }),
        });
      } catch (err) {
        console.error('Error cancelling request:', err);
      }
    }
  };

  // Staff: Update Valet Status
  const handleStaffUpdateStatus = async (
    valetId: string,
    newStatus: 'IN_PROGRESS' | 'DELIVERED'
  ) => {
    setValetQueue((prev) =>
      prev.map((v) => (v.id === valetId ? { ...v, status: newStatus } : v))
    );

    try {
      await fetch(`/api/valet/${valetId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update valet status:', err);
      loadValetQueue();
    }
  };

  // Staff: Create New Parked Ticket
  const handleCreateNewTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleModel || !newVehicleNumber) return;
    setIsCreatingTicket(true);

    try {
      const generatedTicket = `#V-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await fetch('/api/valet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketNumber: generatedTicket,
          vehicleModel: newVehicleModel,
          vehicleNumber: newVehicleNumber,
          parkingSpot: newParkingSpot,
          guestName: newGuestName || 'Valet Guest',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsNewTicketModalOpen(false);
        setNewVehicleModel('');
        setNewVehicleNumber('');
        setNewGuestName('');
        loadValetQueue();
      }
    } catch (err) {
      console.error('Error creating valet ticket:', err);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // Calculate wait time in minutes
  const getWaitMinutes = (requestedAt: string | null) => {
    if (!requestedAt) return 0;
    const diffMs = currentTime - new Date(requestedAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const activeStaffQueue = valetQueue.filter(
    (v) => v.status === 'REQUESTED' || v.status === 'IN_PROGRESS'
  );

  const filteredStaffQueue = valetQueue.filter((v) => {
    if (filterStatus === 'ACTIVE') return v.status === 'REQUESTED' || v.status === 'IN_PROGRESS';
    if (filterStatus === 'DELIVERED') return v.status === 'DELIVERED';
    return true;
  });

  return (
    <div className="portal-wash text-ink h-screen flex flex-col overflow-hidden font-body-md antialiased selection:bg-bowl-rim selection:text-ink">
      {/* Top Header Bar */}
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
              Valet System Live
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {activeView === 'staff' && (
              <button
                onClick={() => setIsNewTicketModalOpen(true)}
                className="btn"
              >
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>New Vehicle</span>
                </span>
                <span className="btn-dot" aria-hidden="true">
                  <span className="btn-chevron">
                    <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
                  </span>
                </span>
              </button>
            )}

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

      {/* Main Layout Container */}
      <div className="flex flex-1 h-full overflow-hidden relative">
        {/* Desktop Sidebar */}
        <SidebarNav activePortal="valet" />

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto pb-24 md:pb-8 relative">
          {/* View Toggle Capsule (Centered) */}
          <div className="w-full max-w-2xl mx-auto px-4 md:px-[var(--gut)] py-4 md:py-6 flex justify-center z-20 flex-shrink-0">
            <div className="bg-[#fffcf7]/90 dark:bg-[#19120e]/85 backdrop-blur-md rounded-full p-1 flex shadow-ambient relative w-full md:w-auto border border-outline-variant">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-ink rounded-full transition-all duration-300 ${
                  activeView === 'customer' ? 'left-1' : 'left-[calc(50%+2px)]'
                }`}
              />
              <button
                type="button"
                onClick={() => setActiveView('customer')}
                className={`flex-1 md:w-48 text-center py-2.5 relative z-10 text-[13.5px] transition-colors duration-300 font-medium ${
                  activeView === 'customer' ? 'text-on-ink' : 'text-muted hover:text-ink'
                }`}
              >
                Customer View
              </button>
              <button
                type="button"
                onClick={() => setActiveView('staff')}
                className={`flex-1 md:w-48 text-center py-2.5 relative z-10 text-[13.5px] transition-colors duration-300 font-medium ${
                  activeView === 'staff' ? 'text-on-ink' : 'text-muted hover:text-ink'
                }`}
              >
                Staff Queue ({activeStaffQueue.length})
              </button>
            </div>
          </div>

          {/* VIEW 1: CUSTOMER VIEW */}
          {activeView === 'customer' && (
            <section className="flex-1 flex flex-col items-center justify-center px-4 md:px-[var(--gut)] py-4 max-w-xl mx-auto w-full fade-up">
              {!isCustomerRequested ? (
                /* Initial State: Retrieve Button */
                <div className="flex flex-col items-center w-full gap-6 text-center">
                  <div className="halden-card p-6 md:p-8 w-full">
                    <div className="w-16 h-16 rounded-full bg-secondary-container text-ink flex items-center justify-center mx-auto mb-5 border border-outline-variant">
                      <span className="material-symbols-outlined text-[32px] text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>
                        local_parking
                      </span>
                    </div>
                    <h3 className="text-[30px] md:text-[34px] tracking-[-0.032em] font-normal text-ink">
                      Ticket {customerTicketNumber}
                    </h3>
                    <p className="text-[15px] text-muted mt-2 font-medium">
                      {customerVehicle.model} • <span className="font-mono font-medium text-ink">{customerVehicle.number}</span>
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-ink bg-surface-container px-4 py-1.5 rounded-full border border-outline-variant font-medium">
                      <span className="material-symbols-outlined text-[15px] text-accent">location_on</span>
                      Parked at: <strong className="font-medium">{customerVehicle.spot}</strong>
                    </div>
                  </div>

                  <button
                    onClick={handleCustomerRequestCar}
                    className="btn btn-lg btn-full pulse-bg shadow-level-2"
                  >
                    <span className="flex flex-col items-center leading-tight">
                      <span className="text-[16px] tracking-wide font-medium">RETRIEVE MY CAR</span>
                      <span className="text-[11.5px] opacity-75 font-normal mt-0.5">
                        Tap when ready to leave
                      </span>
                    </span>
                    <span className="btn-dot" aria-hidden="true">
                      <span className="btn-chevron">
                        <ChevronRight className="w-5 h-5" strokeWidth={2.2} />
                      </span>
                    </span>
                  </button>
                </div>
              ) : (
                /* Status State: Car In Transit / Ready */
                <div className="flex flex-col items-center w-full gap-6 text-center fade-up">
                  <div className="halden-card p-6 md:p-8 w-full relative overflow-hidden">
                    {/* Top Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-surface-container overflow-hidden">
                      <div className="h-full bg-accent w-1/3 rounded-r-full animate-[progress_3s_ease-in-out_infinite_alternate]" />
                    </div>

                    <div className="w-16 h-16 rounded-full bg-secondary-container text-accent flex items-center justify-center mx-auto mb-5 border border-outline-variant">
                      <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        timer
                      </span>
                    </div>

                    <h2 className="text-[30px] md:text-[34px] tracking-[-0.032em] font-normal text-ink mb-1.5">
                      {customerStatus === 'DELIVERED' ? 'Car Ready at Desk' : 'Car is on its way'}
                    </h2>
                    <p className="text-[19px] tracking-[-0.02em] text-accent font-medium">
                      {customerStatus === 'DELIVERED' ? 'Ready for pickup' : `Approx ${customerEtaMins} mins`}
                    </p>

                    {/* Driving Car CSS Animation */}
                    <div className="mt-6 car-anim-container">
                      <div className="car-anim-path" />
                      <span
                        className="material-symbols-outlined text-[40px] text-ink car-anim-icon"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        directions_car
                      </span>
                    </div>

                    <p className="text-[14px] text-muted mt-5 bg-surface-container rounded-full px-5 py-2.5 inline-block font-medium border border-outline-variant">
                      Please head to the Valet Desk at the Main Exit
                    </p>
                  </div>

                  <button
                    onClick={handleCustomerCancelRequest}
                    className="text-[13.5px] text-muted underline hover:text-ink transition-colors py-2 px-4 font-medium"
                  >
                    Cancel Request
                  </button>
                </div>
              )}
            </section>
          )}

          {/* VIEW 2: STAFF VIEW */}
          {activeView === 'staff' && (
            <section className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-[var(--gut)] pb-8 fade-up">
              {/* Header with Queue Filters */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-6">
                <div>
                  <h2 className="text-[30px] md:text-[34px] tracking-[-0.032em] font-normal text-ink">
                    Valet Queue
                  </h2>
                  <p className="text-[14.5px] text-muted mt-1">
                    {activeStaffQueue.length} {activeStaffQueue.length === 1 ? 'car requested' : 'cars requested'}
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-[#fffcf7]/90 dark:bg-[#19120e]/85 backdrop-blur-md rounded-full p-1 border border-outline-variant shadow-ambient">
                  <button
                    onClick={() => setFilterStatus('ACTIVE')}
                    className={`px-4 py-1.5 text-[12.5px] font-medium rounded-full transition-all ${
                      filterStatus === 'ACTIVE'
                        ? 'bg-ink text-on-ink shadow-sm'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    Active ({activeStaffQueue.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('DELIVERED')}
                    className={`px-4 py-1.5 text-[12.5px] font-medium rounded-full transition-all ${
                      filterStatus === 'DELIVERED'
                        ? 'bg-ink text-on-ink shadow-sm'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    Returned
                  </button>
                  <button
                    onClick={() => setFilterStatus('ALL')}
                    className={`px-4 py-1.5 text-[12.5px] font-medium rounded-full transition-all ${
                      filterStatus === 'ALL'
                        ? 'bg-ink text-on-ink shadow-sm'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    All ({valetQueue.length})
                  </button>
                </div>
              </div>

              {/* Staff Queue Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStaffQueue.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-muted halden-card">
                    <span className="material-symbols-outlined text-4xl text-muted/60 mb-2">directions_car</span>
                    <p className="text-[14px] font-medium">No valet tickets found in this view</p>
                  </div>
                ) : (
                  filteredStaffQueue.map((item, idx) => {
                    const waitMins = getWaitMinutes(item.requestedAt);
                    const isLate = waitMins >= 6;
                    const isInTransit = item.status === 'IN_PROGRESS';
                    const isDelivered = item.status === 'DELIVERED';

                    // Priority styling
                    let borderClass = 'border-t-outline';
                    let badgeClass = 'bg-surface-container text-muted border border-outline-variant';
                    let badgeIcon = 'info';
                    let badgeText = item.status === 'PARKED' ? 'Parked' : 'Just Requested';

                    if (isDelivered) {
                      borderClass = 'border-t-[#38b89a]';
                      badgeClass = 'bg-tertiary-fixed text-ink border border-dot/40';
                      badgeIcon = 'check_circle';
                      badgeText = 'Delivered';
                    } else if (isLate || item.priority === 'HIGH') {
                      borderClass = 'border-t-error';
                      badgeClass = 'bg-error-container text-on-error-container border border-error/25';
                      badgeIcon = 'warning';
                      badgeText = `${waitMins} mins waiting`;
                    } else if (isInTransit || item.priority === 'MEDIUM') {
                      borderClass = 'border-t-accent';
                      badgeClass = 'bg-secondary-container text-ink border border-accent/25';
                      badgeIcon = 'schedule';
                      badgeText = `${Math.max(1, waitMins)} mins waiting`;
                    }

                    return (
                      <div
                        key={item.id}
                        style={{ animationDelay: `${Math.min(idx * 0.06, 0.3)}s` }}
                        className={`halden-card border-t-[3px] ${borderClass} relative overflow-hidden flex flex-col h-full fade-up`}
                      >
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-3">
                            <span className={`${badgeClass} px-3 py-1 rounded-full text-[12px] font-medium flex items-center gap-1`}>
                              <span className="material-symbols-outlined text-[15px]">{badgeIcon}</span>
                              {badgeText}
                            </span>
                            <span className="text-[17px] tracking-[-0.02em] text-ink font-medium tabular-nums">
                              {item.ticketNumber}
                            </span>
                          </div>

                          <h3 className="text-[20px] tracking-[-0.025em] text-ink mt-2 font-normal">
                            {item.vehicleModel}
                          </h3>
                          <div className="text-[22px] text-muted font-mono tracking-wider mt-1 mb-4 font-medium">
                            {item.vehicleNumber}
                          </div>

                          <div className="mt-auto flex items-center gap-2 text-[13.5px] text-muted bg-surface-container px-3.5 py-2.5 rounded-[14px] font-medium">
                            <span className="material-symbols-outlined text-[18px] text-accent">
                              {item.parkingSpot ? 'location_on' : 'person'}
                            </span>
                            <span className="truncate">{item.parkingSpot || item.guestName || 'Valet Lot'}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 bg-surface-container-low border-t border-outline-variant mt-auto">
                          {isDelivered ? (
                            <div className="w-full h-[42px] bg-tertiary-fixed text-ink rounded-full text-[13.5px] font-medium flex items-center justify-center gap-2 border border-dot/40">
                              <span className="material-symbols-outlined text-[18px]">done_all</span>
                              CAR RETURNED
                            </div>
                          ) : isInTransit ? (
                            <button
                              onClick={() => handleStaffUpdateStatus(item.id, 'DELIVERED')}
                              className="btn btn-full !bg-accent !text-white hover:!bg-[#822021]"
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[17px]">check_circle</span>
                                MARK DELIVERED
                              </span>
                              <span className="btn-dot" aria-hidden="true">
                                <span className="btn-chevron">
                                  <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
                                </span>
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStaffUpdateStatus(item.id, 'IN_PROGRESS')}
                              className="btn btn-full"
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[17px]">local_shipping</span>
                                ACCEPT & IN TRANSIT
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
                    );
                  })
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Staff: New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fffcf7]/95 dark:bg-[#19120e]/95 backdrop-blur-md rounded-[24px] p-6 max-w-md w-full shadow-level-2 border border-outline-variant">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-accent text-2xl">
                  local_parking
                </span>
                <h3 className="text-[20px] tracking-[-0.025em] text-ink font-normal">
                  Park New Vehicle
                </h3>
              </div>
              <button
                onClick={() => setIsNewTicketModalOpen(false)}
                aria-label="Close modal"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container text-muted hover:text-ink transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateNewTicket} className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-muted uppercase tracking-wider block mb-1.5">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Black Mahindra Thar, White Fortuner"
                  value={newVehicleModel}
                  onChange={(e) => setNewVehicleModel(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-[14px] p-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-accent font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-muted uppercase tracking-wider block mb-1.5">
                  License Number Plate
                </label>
                <input
                  type="text"
                  placeholder="e.g. DL-01-XY-9876, HR-26-AB-1234"
                  value={newVehicleNumber}
                  onChange={(e) => setNewVehicleNumber(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-[14px] p-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-accent font-mono font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-muted uppercase tracking-wider block mb-1.5">
                  Parking Spot / Zone
                </label>
                <select
                  value={newParkingSpot}
                  onChange={(e) => setNewParkingSpot(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-[14px] p-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-accent font-medium"
                >
                  <option value="Zone A VIP">Zone A VIP</option>
                  <option value="Zone B Parking">Zone B Parking</option>
                  <option value="Valet Lot 2">Valet Lot 2</option>
                  <option value="Courtyard Basement">Courtyard Basement</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-medium text-muted uppercase tracking-wider block mb-1.5">
                  Guest Name / Table (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Table 12 Guest"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-[14px] p-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-accent font-medium"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="flex-1 h-[42px] rounded-full border border-outline-variant font-medium text-[13.5px] text-ink hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTicket}
                  className="btn flex-1 justify-center"
                >
                  <span>{isCreatingTicket ? 'Saving...' : 'Issue Valet Ticket'}</span>
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
      <MobileBottomNav activeTab="valet" />

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </div>
  );
}
