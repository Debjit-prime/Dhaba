'use client';

import Link from 'next/link';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoleSwitcherModal({ isOpen, onClose }: RoleSwitcherModalProps) {
  if (!isOpen) return null;

  const roles = [
    {
      title: 'Customer Portal',
      description: 'Browse menus, place orders, and pay seamlessly.',
      icon: 'restaurant_menu',
      href: '/menu?table=12',
      color: 'bg-ink text-on-ink',
    },
    {
      title: 'Kitchen KDS',
      description: 'Manage live tickets, track cook times, and dispatch.',
      icon: 'soup_kitchen',
      href: '/kds',
      color: 'bg-panel text-dot border border-white/15',
    },
    {
      title: 'Valet System',
      description: 'Track incoming vehicles, coordinate car retrieval.',
      icon: 'directions_car',
      href: '/valet',
      color: 'bg-secondary-container text-accent',
    },
    {
      title: 'Admin Dashboard',
      description: 'AI forecasting, ingredient inventory, and analytics.',
      icon: 'monitoring',
      href: '/admin',
      color: 'bg-bowl-rim text-ink',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/65 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fffcf7]/95 dark:bg-[#17110e]/95 backdrop-blur-md rounded-[24px] p-6 md:p-8 max-w-2xl w-full shadow-level-2 border border-outline-variant dark:border-white/15 relative">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-accent text-2xl">swap_horiz</span>
            <h3 className="text-[22px] tracking-[-0.03em] text-ink font-normal">
              Switch Portal Role
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container text-muted hover:text-ink transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <p className="text-[14px] text-muted mb-6">
          Select an authorized role experience for{' '}
          <strong className="text-ink font-medium">Highway Junction Branch</strong>:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roles.map((r) => (
            <Link
              key={r.title}
              href={r.href}
              onClick={onClose}
              className="p-4 rounded-[20px] bg-white/90 dark:bg-[#231a15]/95 border border-outline-variant hover:border-ink/25 transition-all duration-200 group flex items-start gap-4 shadow-ambient hover:shadow-active hover:-translate-y-0.5"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${r.color}`}
              >
                <span className="material-symbols-outlined text-[22px]">{r.icon}</span>
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-medium text-ink group-hover:text-accent transition-colors flex items-center justify-between">
                  {r.title}
                  <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    arrow_forward
                  </span>
                </div>
                <p className="text-[12.5px] text-muted mt-1 leading-snug">{r.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-outline-variant flex flex-wrap gap-2 justify-between items-center text-[12.5px] text-muted">
          <span>
            Logged in as: <strong className="text-ink font-medium">Admin (Highway Branch)</strong>
          </span>
          <Link href="/" onClick={onClose} className="text-ink hover:text-accent font-medium transition-colors">
            Go to Portal Switcher Screen →
          </Link>
        </div>
      </div>
    </div>
  );
}
