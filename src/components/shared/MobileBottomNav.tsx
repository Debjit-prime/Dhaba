'use client';

import Link from 'next/link';

interface MobileBottomNavProps {
  activeTab: 'menu' | 'kds' | 'valet' | 'admin' | 'orders';
}

export function MobileBottomNav({ activeTab }: MobileBottomNavProps) {
  const tabs = [
    {
      id: 'menu',
      label: 'Menu',
      icon: 'restaurant_menu',
      href: '/menu?table=12',
    },
    {
      id: 'kds',
      label: 'KDS',
      icon: 'receipt_long',
      href: '/kds',
    },
    {
      id: 'valet',
      label: 'Valet',
      icon: 'local_parking',
      href: '/valet',
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: 'monitoring',
      href: '/admin',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-3 left-4 right-4 z-50 flex justify-around items-center px-2 py-1.5 md:hidden bg-[#fffbf6]/90 dark:bg-[#16100d]/90 backdrop-blur-md shadow-halden-nav border border-outline-variant rounded-full h-[58px]"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex flex-col items-center justify-center transition-all duration-200 rounded-full ${
              isActive
                ? 'bg-ink text-on-ink px-5 py-1.5 font-medium shadow-ambient'
                : 'text-muted px-3 py-1 hover:text-ink'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[19px] ${
                isActive ? 'text-dot dark:text-[#9e2a2b] fill-1' : ''
              }`}
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
            </span>
            <span className="text-[11px] font-medium mt-0.5 leading-none">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
