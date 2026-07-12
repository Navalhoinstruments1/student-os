"use client";

import React, { useState, useEffect } from 'react';
import { Utensils, CalendarDays, ChevronDown, ChevronRight, CheckCircle2, Circle, Coffee } from 'lucide-react';

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

type MealPlan = {
  breakfast: string;
  lunch: string;
  dinner: string;
};

export default function WeeklyMeals() {
  const [meals, setMeals] = useState<Record<string, MealPlan>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [weekDates, setWeekDates] = useState('');
  const [currentDayName, setCurrentDayName] = useState('');

  useEffect(() => {
    // 1. Sem setTimeout, executamos tudo de forma imediata e síncrona
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const formatDate = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWeekDates(`${formatDate(start)} - ${formatDate(end)}`);

    const daysPt = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const todayStr = daysPt[now.getDay()];
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentDayName(todayStr);
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedDay(todayStr); 

    const saved = localStorage.getItem('studentOs_meals');
    if (saved) {
      const parsed = JSON.parse(saved);
      const migratedMeals: Record<string, MealPlan> = {};
      
      Object.keys(parsed).forEach(day => {
        if (typeof parsed[day] === 'string') {
          migratedMeals[day] = { breakfast: '', lunch: parsed[day], dinner: '' };
        } else {
          migratedMeals[day] = parsed[day];
        }
      });
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMeals(migratedMeals);
    }
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoaded(true);
  }, []);
  const handleChange = (day: string, field: keyof MealPlan, value: string) => {
    const newMeals = { ...meals };
    if (!newMeals[day]) {
        newMeals[day] = { breakfast: '', lunch: '', dinner: '' };
    }
    newMeals[day][field] = value;
    setMeals(newMeals);
    localStorage.setItem('studentOs_meals', JSON.stringify(newMeals)); 
  };

  if (!isLoaded) return <div className="animate-pulse bg-card-bg rounded-xl h-100 border border-border-subtle"></div>;

  return (
    <div className="bg-card-bg p-5 rounded-xl shadow-lg border border-border-subtle flex flex-col h-full min-h-100 transition-colors duration-300">
      
      {/* CABEÇALHO ELITE */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 shrink-0 pb-3 border-b border-accent/20 transition-colors">
        <div className="flex items-center gap-2">
          <Utensils size={18} className="text-accent transition-colors" />
          <h3 className="text-text-main font-black text-sm uppercase tracking-wide transition-colors">Plano de Refeições</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-app-bg/80 border border-border-subtle px-2.5 py-1 rounded text-text-muted transition-colors">
           <CalendarDays size={12} />
           <span className="text-[10px] font-bold tracking-widest">{weekDates}</span>
        </div>
      </div>
      
      {/* CORPO DO ACORDEÃO */}
      <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {DAYS.map(day => {
          const isToday = day === currentDayName;
          const isExpanded = expandedDay === day;
          const dayMeals = meals[day] || { breakfast: '', lunch: '', dinner: '' };
          
          const filledMeals = [dayMeals.breakfast, dayMeals.lunch, dayMeals.dinner].filter(m => m.trim() !== '');
          const summary = filledMeals.length > 0 ? filledMeals.join(' • ') : 'Sem plano';
          
          return (
            <div key={day} className={`flex flex-col border rounded-lg transition-all duration-300 overflow-hidden ${isExpanded ? 'border-accent/50 bg-app-bg/80 shadow-md' : 'bg-app-bg/40 border-border-subtle/50 hover:border-text-muted/50'}`}>
              
              {/* CABEÇALHO DO DIA (Clicável) */}
              <div 
                 onClick={() => setExpandedDay(isExpanded ? null : day)}
                 className="flex items-center justify-between p-3 cursor-pointer select-none"
              >
                 <div className="flex items-center gap-3">
                    {filledMeals.length > 0 ? (
                       <CheckCircle2 size={16} className="text-accent shrink-0 transition-colors" />
                    ) : (
                       <Circle size={16} className="text-text-muted shrink-0 transition-colors" />
                    )}
                    <div className="flex flex-col">
                       <div className="flex items-center gap-2">
                          <p className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isToday ? 'text-accent' : 'text-text-main'}`}>
                              {day}
                          </p>
                          {isToday && <span className="bg-accent/20 text-accent text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider transition-colors">Hoje</span>}
                       </div>
                       {!isExpanded && (
                           <p className="text-[10px] text-text-muted truncate max-w-45 sm:max-w-55 mt-0.5 transition-colors">{summary}</p>
                       )}
                    </div>
                 </div>
                 {isExpanded ? <ChevronDown size={16} className="text-accent shrink-0 transition-colors" /> : <ChevronRight size={16} className="text-text-muted shrink-0 transition-colors" />}
              </div>
              
              {/* INTERIOR DO DIA (Expanded) */}
              {isExpanded && (
                 <div className="p-3 pt-0 border-t border-border-subtle/50 flex flex-col gap-2.5 mt-2 animate-in slide-in-from-top-2 duration-200 transition-colors">
                    
                    <div className="flex items-center bg-card-bg/50 rounded-lg p-2.5 border border-border-subtle focus-within:border-accent/50 transition-colors">
                       <Coffee size={14} className="text-text-muted mr-2.5 shrink-0 transition-colors" />
                       <input 
                          type="text" placeholder="Pequeno-almoço / Lanche..." 
                          className="bg-transparent text-xs text-text-main font-medium w-full outline-none placeholder:text-text-muted/60 transition-colors"
                          value={dayMeals.breakfast} onChange={e => handleChange(day, 'breakfast', e.target.value)}
                       />
                    </div>

                    <div className="flex items-center bg-card-bg/50 rounded-lg p-2.5 border border-border-subtle focus-within:border-accent/50 transition-colors">
                       <Utensils size={14} className="text-accent/70 mr-2.5 shrink-0 transition-colors" />
                       <input 
                          type="text" placeholder="Almoço..." 
                          className="bg-transparent text-xs text-text-main font-medium w-full outline-none placeholder:text-text-muted/60 transition-colors"
                          value={dayMeals.lunch} onChange={e => handleChange(day, 'lunch', e.target.value)}
                       />
                    </div>

                    <div className="flex items-center bg-card-bg/50 rounded-lg p-2.5 border border-border-subtle focus-within:border-accent/50 transition-colors">
                       <Utensils size={14} className="text-text-muted mr-2.5 shrink-0 transition-colors" />
                       <input 
                          type="text" placeholder="Jantar..." 
                          className="bg-transparent text-xs text-text-main font-medium w-full outline-none placeholder:text-text-muted/60 transition-colors"
                          value={dayMeals.dinner} onChange={e => handleChange(day, 'dinner', e.target.value)}
                       />
                    </div>

                 </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}