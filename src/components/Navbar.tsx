"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, Home, User, TrendingUp } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 md:top-0 md:bottom-auto left-0 w-full h-16 bg-app-bg/90 backdrop-blur-xl border-t md:border-t-0 md:border-b border-border-subtle z-[100] px-4 md:px-8 transition-colors duration-300">
      {/* justify-between distribui os 4 botões perfeitamente no telemóvel */}
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between md:justify-start md:gap-10">
        
        {/* 1. INÍCIO */}
        <Link 
          href="/"
          prefetch={false}
          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 w-16 md:w-auto transition-all ${pathname === '/' ? 'text-accent' : 'text-text-muted hover:text-text-main'}`}
        >
          <Home size={24} className={pathname === '/' ? 'drop-shadow-[0_0_8px_var(--color-accent)] opacity-80' : ''} />
          <span className="text-[10px] md:text-sm font-bold tracking-wider uppercase">Início</span>
        </Link>

        {/* 2. EVOLUÇÃO */}
        <Link 
          href="/evolucao"
          prefetch={false}
          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 w-16 md:w-auto transition-all ${pathname === '/evolucao' ? 'text-accent' : 'text-text-muted hover:text-text-main'}`}
        >
          <TrendingUp size={24} className={pathname === '/evolucao' ? 'drop-shadow-[0_0_8px_var(--color-accent)] opacity-80' : ''} />
          <span className="text-[10px] md:text-sm font-bold tracking-wider uppercase">Evolução</span>
        </Link>

        {/* 3. FINANÇAS */}
        <Link 
          href="/financas"
          prefetch={false}
          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 w-16 md:w-auto transition-all ${pathname === '/financas' ? 'text-accent' : 'text-text-muted hover:text-text-main'}`}
        >
          <Wallet size={24} className={pathname === '/financas' ? 'drop-shadow-[0_0_8px_var(--color-accent)] opacity-80' : ''} />
          <span className="text-[10px] md:text-sm font-bold tracking-wider uppercase">Finanças</span>
        </Link>

        <div className="hidden md:block flex-1"></div>

        {/* 4. DIREITA: Minha Conta */}
        <Link 
          href="/conta"
          prefetch={false}
          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 w-16 md:w-auto transition-all ${pathname === '/conta' ? 'text-accent' : 'text-text-muted hover:text-text-main'}`}
        >
          <User size={24} className={pathname === '/conta' ? 'drop-shadow-[0_0_8px_var(--color-accent)] opacity-80' : ''} />
          <span className="text-[10px] md:text-sm font-bold tracking-wider uppercase">Conta</span>
        </Link>
      </div>
    </nav>
  );
}