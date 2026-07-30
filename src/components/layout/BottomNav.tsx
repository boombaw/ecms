'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Users, Trophy, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Beranda', icon: Home },
    { href: '/dashboard/events', label: 'Event', icon: Calendar },
    { href: '/dashboard/competitions', label: 'Lomba', icon: Trophy },
    { href: '/dashboard/participants', label: 'Peserta', icon: Users },
    { href: '/dashboard/results', label: 'Hasil', icon: Award },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 glass-nav bg-white dark:bg-zinc-950 border-t border-outline-variant/50 md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-20 pb-safe px-4">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard' 
            ? pathname === '/dashboard' 
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center transition-all duration-200 active:scale-90 rounded-xl py-1.5",
                isActive 
                  ? "text-primary dark:text-inverse-primary font-bold bg-secondary-container/50 px-4" 
                  : "text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-high px-2"
              )}
            >
              <item.icon className="w-[24px] h-[24px]" strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-label-md text-label-md mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
