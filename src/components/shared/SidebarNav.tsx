'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { RoleSwitcherModal } from './RoleSwitcherModal';

interface SidebarNavProps {
  activePortal: 'kds' | 'dashboard' | 'valet' | 'menu';
}

export function SidebarNav({ activePortal }: SidebarNavProps) {
  const pathname = usePathname();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const navLinks = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      href: '/admin',
    },
    {
      id: 'kds',
      label: 'KDS',
      icon: 'restaurant',
      href: '/kds',
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: 'menu_book',
      href: '/menu?table=12',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: 'inventory_2',
      href: '/admin#inventory',
    },
    {
      id: 'valet',
      label: 'Valet',
      icon: 'directions_car',
      href: '/valet',
    },
  ];

  return (
    <>
      <nav
        aria-label="Portal Navigation"
        className="hidden md:flex flex-col h-full border-r border-outline-variant py-6 bg-[#fffbf6]/85 dark:bg-[#16100d]/90 backdrop-blur-md docked left-0 w-64 flex-shrink-0 z-40 select-none"
      >
        {/* Manager Badge Header */}
        <div className="px-5 mb-7">
          <div className="flex items-center gap-3 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Manager Avatar"
              className="w-11 h-11 rounded-full object-cover border border-outline-variant shadow-ambient"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDR5DzqIxPWlcpvLS5fZ3JbX9dn0zsjaBrOYWoDZHAp4GcCgrAyMeJeesxvQviwDFXfecWCxnahGCa9kToc9m4Jq4cCnosyDGlluPWPjX3wGEU8LclxllQixtRSyO4clqbg-pxSJ-j-oBc8It3dIb_hWQeTelxPNm8mbdlOF1SnTWPVJ_GmHALmTCbY7QxZjDJtYAfhrk-bJ58wwAx2Z-rfpy9c92Ugdv_dnlU8dt8DMn-w2naJOhs"
            />
            <div className="min-w-0">
              <div className="text-[17px] leading-tight tracking-[-0.025em] text-ink font-medium truncate">
                DhabaOS Admin
              </div>
              <div className="text-[12px] text-muted truncate mt-0.5">
                Highway Junction Branch
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsRoleModalOpen(true)}
            className="btn btn-full"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              Switch Role
            </span>
            <span className="btn-dot" aria-hidden="true">
              <span className="btn-chevron">
                <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
              </span>
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3">
          <ul className="space-y-1">
            {navLinks.map((item) => {
              const isActive = activePortal === item.id;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-[14px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-ink text-on-ink shadow-ambient'
                        : 'text-ink opacity-90 hover:opacity-55 hover:bg-surface-container'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[19px] ${
                        isActive ? 'text-dot dark:text-[#9e2a2b] fill-1' : 'text-muted'
                      }`}
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Utility Items */}
        <div className="mt-auto px-3 border-t border-outline-variant pt-4 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 text-ink opacity-90 hover:opacity-55 px-4 py-2 hover:bg-surface-container transition-all rounded-full text-[14px] font-medium"
          >
            <span className="material-symbols-outlined text-[19px] text-muted">settings</span>
            <span>Settings</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 text-ink opacity-90 hover:opacity-55 px-4 py-2 hover:bg-surface-container transition-all rounded-full text-[14px] font-medium"
          >
            <span className="material-symbols-outlined text-[19px] text-muted">logout</span>
            <span>Exit to Switcher</span>
          </Link>
        </div>
      </nav>

      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </>
  );
}
