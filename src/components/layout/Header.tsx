'use client';

import { Trophy } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-primary dark:bg-primary-container text-on-primary dark:text-on-primary-container md:bg-surface md:text-on-surface md:dark:bg-surface-container md:dark:text-on-surface md:border-b top-0 rounded-b-xl md:rounded-none shadow-md md:shadow-none z-40 sticky w-full">
      <div className="flex justify-between items-center px-container-margin py-4 w-full">
        <div className="flex items-center gap-3 md:hidden">
          <Trophy className="w-[28px] h-[28px]" strokeWidth={2.5} />
          <h1 className="text-headline-md font-extrabold tracking-tight">ECMS</h1>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <span className="text-sm text-on-primary/90 md:text-secondary hidden sm:block">Admin Panitia</span>
          <div className="w-10 h-10 md:w-8 md:h-8 rounded-full border-2 border-on-primary/20 md:border-outline-variant/30 flex items-center justify-center bg-white/10 md:bg-surface-container-high overflow-hidden active:scale-95 transition-transform duration-150 text-on-primary md:text-on-surface">
            <span className="text-label-md font-bold">AU</span>
          </div>
        </div>
      </div>
    </header>
  );
}
