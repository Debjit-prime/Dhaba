'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

function splitWordsWithChars(
  text: string,
  charClassName: string,
  baseDelay: number,
  spread: number
) {
  const words = text.split(' ');
  const totalChars = text.replace(/\s+/g, '').length || 1;
  let runningIdx = 0;

  return words.map((word, wIdx) => {
    const chars = Array.from(word).map((ch, cIdx) => {
      const delay = baseDelay + (runningIdx / totalChars) * spread;
      runningIdx += 1;
      return (
        <span
          key={`${wIdx}-${cIdx}`}
          className={charClassName}
          style={{ animationDelay: `${delay.toFixed(3)}s` }}
        >
          {ch}
        </span>
      );
    });

    return (
      <span key={wIdx} className="inline-block whitespace-nowrap">
        {chars}
        {wIdx < words.length - 1 ? '\u00A0' : ''}
      </span>
    );
  });
}

export default function PortalSwitcherPage() {
  const portals = [
    {
      id: 'customer',
      title: 'Customer Portal',
      description: 'Browse menus, place orders, and manage your account seamlessly.',
      icon: 'restaurant_menu',
      href: '/menu?table=12',
      badgeBg: 'bg-ink',
      badgeText: 'text-on-ink',
    },
    {
      id: 'kitchen',
      title: 'Kitchen KDS',
      description: 'Manage live tickets, track preparation times, and mark orders ready.',
      icon: 'soup_kitchen',
      href: '/kds',
      badgeBg: 'bg-panel border border-white/15',
      badgeText: 'text-dot',
    },
    {
      id: 'valet',
      title: 'Valet System',
      description: 'Track incoming vehicles, manage parking spots, and coordinate retrieval.',
      icon: 'directions_car',
      href: '/valet',
      badgeBg: 'bg-secondary-container',
      badgeText: 'text-accent',
    },
    {
      id: 'admin',
      title: 'Admin Dashboard',
      description: 'View analytics, manage inventory, adjust menus, and configure settings.',
      icon: 'monitoring',
      href: '/admin',
      badgeBg: 'bg-bowl-rim',
      badgeText: 'text-ink',
    },
  ];

  return (
    <div className="bg-transparent text-ink min-h-screen flex flex-col antialiased selection:bg-bowl-rim selection:text-ink relative">
      {/* Floating Pill Navbar */}
      <header className="halden-nav halden-nav-fixed flex justify-between items-center px-5 md:px-7">
        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className="material-symbols-outlined text-ink text-[22px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            restaurant
          </span>
          <span className="text-[18px] tracking-[-0.03em] font-medium text-ink">
            DhabaOS
          </span>
        </div>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
          <Link href="/menu?table=12" className="halden-nav-link">
            Customer
          </Link>
          <Link href="/kds" className="halden-nav-link">
            Kitchen KDS
          </Link>
          <Link href="/valet" className="halden-nav-link">
            Valet
          </Link>
          <Link href="/admin" className="halden-nav-link">
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="hidden sm:block text-[12px] md:text-[13px] font-medium text-muted bg-surface-container/90 px-3.5 py-1.5 rounded-full border border-outline-variant whitespace-nowrap">
            Highway Junction Branch
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-[var(--gut)] pt-32 pb-16">
        <div className="text-center mb-10 md:mb-12 max-w-2xl mx-auto px-6 py-5 rounded-[28px] bg-[#fffaf3]/75 dark:bg-[#120c09]/85 backdrop-blur-md border border-outline-variant dark:border-white/15 shadow-ambient">
          <h1 className="text-[38px] md:text-[54px] leading-[1.05] tracking-[-0.035em] font-normal dark:font-medium text-ink dark:drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] mb-3">
            {splitWordsWithChars('Welcome to DhabaOS', 'halden-char', 0.25, 0.35)}
          </h1>
          <p className="text-[17px] md:text-[19px] font-medium tracking-[-0.01em] text-muted">
            {splitWordsWithChars('Select Your Role', 'halden-char-muted', 0.55, 0.35)}
          </p>
        </div>

        {/* Role Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 w-full max-w-7xl mx-auto">
          {portals.map((portal, idx) => (
            <Link
              key={portal.id}
              href={portal.href}
              className={`group relative flex flex-col halden-card halden-card-hover p-6 md:p-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 fade-up fade-up-${idx + 1}`}
            >
              <div
                className={`mb-7 h-12 w-12 ${portal.badgeBg} rounded-full flex items-center justify-center ${portal.badgeText} transition-transform duration-300 group-hover:scale-105`}
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {portal.icon}
                </span>
              </div>
              <h2 className="text-[22px] leading-[1.1] tracking-[-0.03em] font-normal text-ink mb-2.5 group-hover:text-ink-2 transition-colors">
                {portal.title}
              </h2>
              <p className="text-[14.5px] leading-[1.5] font-medium text-muted flex-grow mb-6">
                {portal.description}
              </p>
              <div className="mt-auto">
                <span className="btn">
                  <span>Enter Portal</span>
                  <span className="btn-dot" aria-hidden="true">
                    <span className="btn-chevron">
                      <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
                    </span>
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center border-t border-outline-variant mt-auto bg-[#fffaf3]/75 dark:bg-[#120c09]/85 backdrop-blur-md">
        <p className="text-[13px] font-medium text-muted">
          © 2024 DhabaOS. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
