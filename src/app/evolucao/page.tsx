"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, CalendarDays, Dumbbell, GraduationCap, ListTodo } from 'lucide-react';
import GymEvolution from '@/components/evolucao/GymEvolution';
import UniEvolution from '@/components/evolucao/UniEvolution';
import TasksEvolution from '@/components/evolucao/TasksEvolution';

// Tipagem e Ícones Premium
type NavItem = { id: string; label: string; icon: React.ReactNode };

const baseNavItems: NavItem[] = [
  { id: 'gym', label: 'Gym', icon: <Dumbbell size={14} /> },
  { id: 'uni', label: 'Universidade', icon: <GraduationCap size={14} /> },
  { id: 'tarefas', label: 'Tarefas', icon: <ListTodo size={14} /> },
];

export default function EvolucaoPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [navClicks, setNavClicks] = useState<Record<string, number>>({});

  // 🔥 O SILENCIADOR DO RECHARTS
  useEffect(() => {
    // Guarda as funções originais da consola
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Filtra os Erros
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('The width(-1) and height(-1)')) {
        return; // Ignora o erro silenciosamente
      }
      originalConsoleError(...args);
    };

    // Filtra os Avisos
    console.warn = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('The width(-1) and height(-1)')) {
        return; // Ignora o aviso silenciosamente
      }
      originalConsoleWarn(...args);
    };

    // Restaura a consola quando saíres da página
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Carrega os cliques guardados (Blindado contra ecrãs brancos)
  useEffect(() => {
    setTimeout(() => {
      try {
        const storedNavClicks = localStorage.getItem('evoSmartClicks');
        if (storedNavClicks) {
          setNavClicks(JSON.parse(storedNavClicks));
        }
      } catch (error) {
        console.error("Erro ao ler cliques de evolução:", error);
      } finally {
        // Aconteça o que acontecer, a página carrega!
        setIsLoaded(true);
      }
    }, 0);
  }, []);

  // Regista o clique e atualiza a inteligência
  const handleNavClick = (id: string) => {
    const newClicks = { ...navClicks, [id]: (navClicks[id] || 0) + 1 };
    setNavClicks(newClicks);
    localStorage.setItem('evoSmartClicks', JSON.stringify(newClicks));
  };

  // O motor de ordenação: do mais clicado para o menos clicado
  const sortedNavItems = [...baseNavItems].sort((a, b) => {
    const countA = navClicks[a.id] || 0;
    const countB = navClicks[b.id] || 0;
    return countB - countA;
  });

  return (
    // CORREÇÃO 1: h-screen e gap-8 garantem que o scroll e o sticky funcionam a 100%
    // TEMA: bg-[#0f1523] substituído por bg-app-bg
    <div className="w-full min-h-full flex flex-col gap-8 p-6 md:p-8  bg-app-bg transition-colors duration-300 scroll-smooth relative">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-5 shrink-0 gap-4 flex-wrap transition-colors duration-300">
        <div className="flex items-center gap-3">
            {/* TEMA: rose-500 substituído por accent (Muda de cor conforme o tema!) */}
            <div className="p-2 bg-accent/10 rounded-lg transition-colors duration-300">
                <TrendingUp className="text-accent" size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-black text-text-main tracking-tighter leading-tight">Evolução</h1>
                <p className="text-xs text-text-muted font-medium">Acompanha o teu progresso detalhado.</p>
            </div>
        </div>
        
        {/* TEMA: bg-[#182132] e text-slate-300 substituídos pelas variáveis dinâmicas */}
        <div className="flex items-center gap-1.5 bg-card-bg px-4 py-2 rounded-xl border border-border-subtle shadow-inner transition-colors duration-300">
            <CalendarDays size={14} className="text-text-muted" />
            <span className="text-[11px] font-bold text-text-main uppercase tracking-widest">Geral</span>
        </div>
      </div>

    {/* BARRA DE NAVEGAÇÃO STICKY (Tal como no Dashboard) */}
      <nav className="md:hidden sticky top-0 z-50 bg-app-bg/95 backdrop-blur-xl border-b border-border-subtle py-3 -mx-6 px-6 flex items-center gap-3 overflow-x-auto custom-scrollbar shadow-md shrink-0 transition-colors">
        {isLoaded && sortedNavItems.map(item => (
          <a 
            key={item.id} 
            href={`#${item.id}`} 
            onClick={() => handleNavClick(item.id)} 
            className="shrink-0 bg-card-bg hover:bg-border-subtle text-text-main px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest border border-border-subtle transition-colors flex items-center gap-1.5"
          >
            <span className="text-accent">{item.icon}</span>{item.label}
          </a>
        ))}
      </nav>

      {/* BLOCOS DA PÁGINA */}
      <div id="gym" className="scroll-mt-24 shrink-0">
        <GymEvolution />
      </div>

      <div id="uni" className="scroll-mt-24 shrink-0">
        <UniEvolution />
      </div>

      <div id="tarefas" className="scroll-mt-24 shrink-0">
        <TasksEvolution />
      </div>

    </div>
  );
}