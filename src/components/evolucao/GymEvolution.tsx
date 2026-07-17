"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Dumbbell, Zap, Flame, ChevronLeft, ChevronRight } from 'lucide-react';

// Constantes
const MUSCLE_GROUPS = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abs', 'Cardio', 'Outro'];

const CATEGORY_COLORS: Record<string, string> = {
  Peito: '#f43f5e', Costas: '#3b82f6', Pernas: '#10b981', Ombros: '#a855f7',
  Bíceps: '#f59e0b', Tríceps: '#6366f1', Abs: '#ec4899', Cardio: '#14b8a6', Outro: '#64748b'
};

interface WorkoutHistoryLog {
  date: string;
  dayOfWeek: string;
  categoryVolumes: Record<string, number>;
}

interface ChartData {
  name: string;
  totalVolume: number;
  [key: string]: string | number;
}

interface TooltipPayloadEntry {
  name: string; value: number; color: string; payload: ChartData;
}
interface CustomTooltipProps {
  active?: boolean; payload?: TooltipPayloadEntry[]; label?: string;
}

const getISOWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
};

// Tooltip Customizado
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const totalVisibleVolume = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
      return (
        <div className="bg-card-bg p-4 rounded-xl border border-border-subtle shadow-2xl z-50">
          <p className="text-text-muted font-bold mb-2 text-xs uppercase tracking-wider">{label}</p>
          <p className="text-accent font-black text-xl mb-3 border-b border-border-subtle pb-2 flex items-baseline gap-1.5">
            {totalVisibleVolume.toLocaleString('pt-PT')} <span className="text-[10px] text-accent/70 font-bold uppercase">kg total</span>
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {payload.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between gap-8 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-text-muted font-medium">{entry.name}</span>
                </div>
                <span className="text-text-main font-bold">{entry.value.toLocaleString('pt-PT')} kg</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
};

export default function GymEvolution() {
  const [history, setHistory] = useState<WorkoutHistoryLog[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>(MUSCLE_GROUPS);
  const [timeView, setTimeView] = useState<'semana' | 'mes' | 'ano'>('semana');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [isMounted, setIsMounted] = useState(false);

  const loadData = () => {
    try {
      const saved = localStorage.getItem('studentOs_workout_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {
       // Ignora erro silenciosamente
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    loadData();
    window.addEventListener('syncGymWorkouts', loadData);
    return () => window.removeEventListener('syncGymWorkouts', loadData);
  }, []);

  const handlePrev = () => {
      setReferenceDate(prev => {
          const d = new Date(prev);
          if (timeView === 'semana') d.setDate(d.getDate() - 7);
          else if (timeView === 'mes') d.setMonth(d.getMonth() - 1);
          else if (timeView === 'ano') d.setFullYear(d.getFullYear() - 1);
          return d;
      });
  };

  const handleNext = () => {
      setReferenceDate(prev => {
          const d = new Date(prev);
          if (timeView === 'semana') d.setDate(d.getDate() + 7);
          else if (timeView === 'mes') d.setMonth(d.getMonth() + 1);
          else if (timeView === 'ano') d.setFullYear(d.getFullYear() + 1);
          return d;
      });
  };

  const getDateLabel = () => {
      if (timeView === 'semana') {
          const d = new Date(referenceDate);
          const day = d.getDay();
          const sunday = new Date(d.setDate(d.getDate() - day));
          const saturday = new Date(sunday); saturday.setDate(sunday.getDate() + 6);
          return `${sunday.toLocaleDateString('pt-PT', {day:'2-digit', month:'2-digit'})} - ${saturday.toLocaleDateString('pt-PT', {day:'2-digit', month:'2-digit'})}`;
      }
      if (timeView === 'mes') {
          const m = referenceDate.toLocaleDateString('pt-PT', {month:'long', year:'numeric'});
          return m.charAt(0).toUpperCase() + m.slice(1);
      }
      return referenceDate.getFullYear().toString();
  };

  const chartData = useMemo(() => {
    const refWeek = getISOWeek(referenceDate);
    const refMonth = referenceDate.getMonth();
    const refYear = referenceDate.getFullYear();

    const filteredHistory = history.filter(log => {
        const logDate = new Date(log.date);
        if (timeView === 'semana') return getISOWeek(logDate) === refWeek && logDate.getFullYear() === refYear;
        if (timeView === 'mes') return logDate.getMonth() === refMonth && logDate.getFullYear() === refYear;
        return logDate.getFullYear() === refYear;
    });

    if (timeView === 'semana') {
        const weekDaysFull = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const baseData: ChartData[] = weekDaysFull.map(d => ({ name: d.slice(0,3), totalVolume: 0 }));
        
        filteredHistory.forEach(log => {
            const dayIndex = weekDaysFull.indexOf(log.dayOfWeek);
            if (dayIndex !== -1) {
                const target = baseData[dayIndex];
                Object.keys(log.categoryVolumes).forEach(cat => {
                    if (activeCategories.includes(cat)) {
                        target[cat] = ((target[cat] as number) || 0) + log.categoryVolumes[cat];
                        target.totalVolume += log.categoryVolumes[cat];
                    }
                });
            }
        });
        return baseData;
    } 
    else if (timeView === 'mes') {
        const daysInMonth = new Date(refYear, refMonth + 1, 0).getDate();
        const baseData: ChartData[] = Array.from({length: daysInMonth}, (_, i) => ({ name: `${i+1}`, totalVolume: 0 }));
        
        filteredHistory.forEach(log => {
            const logDate = new Date(log.date);
            const targetIndex = logDate.getDate() - 1;
            if (baseData[targetIndex]) {
                const target = baseData[targetIndex];
                Object.keys(log.categoryVolumes).forEach(cat => {
                    if (activeCategories.includes(cat)) {
                        target[cat] = ((target[cat] as number) || 0) + log.categoryVolumes[cat];
                        target.totalVolume += log.categoryVolumes[cat];
                    }
                });
            }
        });
        return baseData;
    } 
    else { 
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const baseData: ChartData[] = months.map(m => ({ name: m, totalVolume: 0 }));
        
        filteredHistory.forEach(log => {
            const mIdx = new Date(log.date).getMonth();
            if (baseData[mIdx]) {
                const target = baseData[mIdx];
                Object.keys(log.categoryVolumes).forEach(cat => {
                    if (activeCategories.includes(cat)) {
                        target[cat] = ((target[cat] as number) || 0) + log.categoryVolumes[cat];
                        target.totalVolume += log.categoryVolumes[cat];
                    }
                });
            }
        });
        return baseData;
    }
  }, [history, activeCategories, timeView, referenceDate]);

  const kpis = useMemo(() => {
    let periodVol = 0;
    const catTotals: Record<string, number> = {};

    chartData.forEach(point => {
        periodVol += point.totalVolume;
        MUSCLE_GROUPS.forEach(cat => {
            if (point[cat]) {
                catTotals[cat] = (catTotals[cat] || 0) + (point[cat] as number);
            }
        });
    });

    let topCat = '--'; let maxCatVol = 0;
    Object.keys(catTotals).forEach(cat => {
        if (catTotals[cat] > maxCatVol) { maxCatVol = catTotals[cat]; topCat = cat; }
    });

    const weeksTrained = new Set<string>();
    history.forEach(log => weeksTrained.add(`${new Date(log.date).getFullYear()}-W${getISOWeek(new Date(log.date))}`));
    
    let streak = 0; const checkDate = new Date();
    while (true) {
        if (weeksTrained.has(`${checkDate.getFullYear()}-W${getISOWeek(checkDate)}`)) {
            streak++; checkDate.setDate(checkDate.getDate() - 7);
        } else { break; }
        if (streak > 520) break; 
    }

    return { streak, periodVol, topCat };
  }, [history, chartData]);

  const toggleCategory = (category: string) => {
    setActiveCategories((prev) => prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]);
  };

  if (!isMounted) return null;

  return (
    <section id="ginasio" className="space-y-4">
        <div className="flex items-center gap-2 pl-1 mb-2">
            <Dumbbell size={18} className="text-accent" />
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Performance no Ginásio</h2>
        </div>

        <div className="bg-card-bg p-5 md:p-6 rounded-2xl border border-border-subtle shadow-lg w-full flex flex-col transition-colors duration-300">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle pb-4 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div>
                        <h3 className="text-base font-bold text-text-main flex items-center gap-2">Volume Levantado</h3>
                    </div>
                    <div className="flex items-center gap-2 bg-app-bg p-1 rounded-lg border border-border-subtle shadow-inner">
                        <button onClick={handlePrev} className="p-1 text-text-muted hover:text-text-main hover:bg-border-subtle/50 rounded transition-colors"><ChevronLeft size={16}/></button>
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest w-28 text-center">{getDateLabel()}</span>
                        <button onClick={handleNext} className="p-1 text-text-muted hover:text-text-main hover:bg-border-subtle/50 rounded transition-colors"><ChevronRight size={16}/></button>
                    </div>
                </div>
                
                <div className="flex bg-app-bg p-1 rounded-lg border border-border-subtle shadow-inner">
                    {(['semana', 'mes', 'ano'] as const).map((view) => (
                        <button 
                            key={view} 
                            onClick={() => { setTimeView(view); setReferenceDate(new Date()); }}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${timeView === view ? 'bg-accent text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
                        >
                            {view}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap mb-6">
                {MUSCLE_GROUPS.map(cat => {
                    const isActive = activeCategories.includes(cat);
                    return (
                        <button 
                            key={cat} onClick={() => toggleCategory(cat)}
                            className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border ${isActive ? 'bg-app-bg text-text-main border-border-subtle' : 'bg-transparent text-text-muted border-border-subtle/30 hover:border-border-subtle'}`}
                        >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat], opacity: isActive ? 1 : 0.2 }} />
                            {cat}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 flex-1 min-h-75">
                {/* AQUI ESTÁ A MAGIA: min-w-0, h-100 e min-h-[350px] */}
                <div className="flex-1 w-full min-w-0 -ml-4 h-100 min-h-[350px]">
                    <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={timeView === 'ano' ? 32 : timeView === 'mes' ? 8 : 24}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.4} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? `${(value/1000).toFixed(1)}t` : `${value}kg`}`} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.15 }} />
                            
                            {MUSCLE_GROUPS.map((cat, index) => {
                                const activeGroupIndices = MUSCLE_GROUPS.map((c, i) => activeCategories.includes(c) ? i : -1).filter(i => i !== -1);
                                const lastActiveIndex = activeGroupIndices[activeGroupIndices.length - 1];
                                return (
                                    <Bar 
                                        key={cat} dataKey={cat} stackId="a" fill={CATEGORY_COLORS[cat]} 
                                        radius={index === lastActiveIndex ? [4, 4, 0, 0] : [0, 0, 0, 0]} 
                                        hide={!activeCategories.includes(cat)} 
                                        isAnimationActive={true} animationDuration={600}
                                    />
                                );
                            })}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="w-full xl:w-64 flex flex-col gap-3 shrink-0 border-t xl:border-t-0 xl:border-l border-border-subtle pt-5 xl:pt-0 xl:pl-6">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Resumo do Período</h4>
                    <KpiCard title="Volume Total" value={`${(kpis.periodVol / 1000).toFixed(1)}t`} icon={Zap} color="text-accent" bgColor="bg-accent/10" description="No período selecionado." />
                    <KpiCard title="Top Músculo" value={kpis.topCat} icon={Target} color="text-blue-500" bgColor="bg-blue-500/10" description="No período selecionado." />
                    <KpiCard title="Streak Semanal" value={`${kpis.streak} sem.`} icon={Flame} color="text-orange-500" bgColor="bg-orange-500/10" description="Semanas consecutivas." />
                </div>
            </div>
        </div>
    </section>
  );
}

interface KpiCardProps { title: string; value: string; icon: React.ElementType; color: string; bgColor: string; description: string; }
function KpiCard({ title, value, icon: Icon, color, bgColor, description }: KpiCardProps) {
    return (
        <div className="bg-app-bg/50 p-4 rounded-xl border border-border-subtle shadow-sm hover:border-text-muted/50 transition-colors flex items-center gap-4 cursor-default group">
            <div className={`p-2.5 rounded-lg ${bgColor} border border-border-subtle/50 group-hover:scale-105 transition-transform duration-300`}>
                <Icon size={18} className={color} />
            </div>
            <div>
                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-0.5">{title}</p>
                <p className="text-xl font-black text-text-main tracking-tight leading-none mb-1">{value}</p>
                <p className="text-[9px] text-text-muted font-medium">{description}</p>
            </div>
        </div>
    )
}