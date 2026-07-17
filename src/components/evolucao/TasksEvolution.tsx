"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Flame, Target, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface Task {
  id: string;
  text: string;
  date: string;
  completed: boolean;
  isRecurring?: boolean;
}

interface TooltipPayload {
  name: string;
  value: number | string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

type Timeframe = 'semana' | 'mes' | 'ano';

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-app-bg border border-border-subtle p-3 rounded-lg shadow-xl">
        <p className="text-text-muted text-xs font-bold mb-2 uppercase tracking-wider">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-black flex items-center justify-between gap-4 mb-1" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <span>{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TasksEvolution() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [timeframe, setTimeframe] = useState<Timeframe>('semana');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchTasks = () => {
      const saved = localStorage.getItem('userTasks');
      if (saved) {
        try {
          setTasks(JSON.parse(saved));
        } catch (e) {
          console.error("Erro a ler dados das tarefas", e);
        }
      }
    };

    setTimeout(() => {
      fetchTasks();
      setIsLoaded(true);
    }, 0);

    window.addEventListener('syncTasks', fetchTasks);
    return () => window.removeEventListener('syncTasks', fetchTasks);
  }, []);

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (timeframe === 'semana') newDate.setDate(newDate.getDate() - 7);
    if (timeframe === 'mes') newDate.setMonth(newDate.getMonth() - 1);
    if (timeframe === 'ano') newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (timeframe === 'semana') newDate.setDate(newDate.getDate() + 7);
    if (timeframe === 'mes') newDate.setMonth(newDate.getMonth() + 1);
    if (timeframe === 'ano') newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };

  const dateRangeLabel = useMemo(() => {
    if (timeframe === 'semana') {
      const d = new Date(currentDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      
      const formatStr = (date: Date) => `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      return `${formatStr(startOfWeek)} - ${formatStr(endOfWeek)}`;
    }
    if (timeframe === 'mes') {
      const mes = currentDate.toLocaleDateString('pt-PT', { month: 'long' });
      return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${currentDate.getFullYear()}`;
    }
    return currentDate.getFullYear().toString();
  }, [currentDate, timeframe]);

  const periodData = useMemo(() => {
    const data = [];
    
    if (timeframe === 'semana') {
      const d = new Date(currentDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));

      for (let i = 0; i < 7; i++) {
        const current = new Date(startOfWeek);
        current.setDate(current.getDate() + i);
        const dateStr = current.toISOString().split('T')[0];
        const dayLabel = current.toLocaleDateString('pt-PT', { weekday: 'short' });

        const dayTasks = tasks.filter(t => t.date === dateStr);
        const total = dayTasks.length;
        const completed = dayTasks.filter(t => t.completed).length;

        data.push({
          name: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
          dateStr,
          Total: total,
          Concluídas: completed,
          Taxa: total > 0 ? Math.round((completed / total) * 100) : 0
        });
      }
    } 
    else if (timeframe === 'mes') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let i = 1; i <= daysInMonth; i++) {
        const current = new Date(year, month, i);
        const dateStr = new Date(current.getTime() - (current.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        
        const dayTasks = tasks.filter(t => t.date === dateStr);
        const total = dayTasks.length;
        const completed = dayTasks.filter(t => t.completed).length;

        data.push({
          name: i.toString(),
          dateStr,
          Total: total,
          Concluídas: completed,
          Taxa: total > 0 ? Math.round((completed / total) * 100) : 0
        });
      }
    }
    else if (timeframe === 'ano') {
      const year = currentDate.getFullYear();
      const monthsStr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      for (let i = 0; i < 12; i++) {
        const monthTasks = tasks.filter(t => {
          const tDate = new Date(t.date);
          return tDate.getFullYear() === year && tDate.getMonth() === i;
        });
        const total = monthTasks.length;
        const completed = monthTasks.filter(t => t.completed).length;

        data.push({
          name: monthsStr[i],
          Total: total,
          Concluídas: completed,
          Taxa: total > 0 ? Math.round((completed / total) * 100) : 0
        });
      }
    }
    return data;
  }, [tasks, currentDate, timeframe]);

  const periodStats = useMemo(() => {
    let total = 0;
    let concluidas = 0;
    let streak = 0;

    periodData.forEach(item => {
      total += item.Total;
      concluidas += item.Concluídas;
    });

    for (let i = periodData.length - 1; i >= 0; i--) {
      const item = periodData[i];
      if (item.Total > 0 && item.Total === item.Concluídas) {
        streak++;
      } else if (item.Total > 0 && item.Total !== item.Concluídas) {
        break; 
      }
    }

    const taxa = total === 0 ? 0 : Math.round((concluidas / total) * 100);

    return { total, concluidas, taxa, streak };
  }, [periodData]);

  // Usei var(--color-accent) para o gráfico de pizza em vez do verde fixo
  const pieData = [
    { name: 'Feitas', value: periodStats.concluidas, color: 'var(--color-accent)' }, 
    { name: 'Pendentes', value: periodStats.total - periodStats.concluidas, color: '#334155' }
  ];

  if (!isLoaded) return <div className="h-100 bg-card-bg rounded-2xl border border-border-subtle animate-pulse mt-8"></div>;

  return (
    <div id="tarefas-evolution" className="bg-card-bg border border-border-subtle rounded-2xl p-6 flex flex-col gap-6 w-full mt-8 transition-colors duration-300">
      
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg transition-colors">
            <CheckCircle className="text-accent transition-colors" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-text-main uppercase tracking-wide">Evolução de Tarefas</h2>
            <p className="text-xs text-text-muted font-medium">O teu ritmo de produtividade no tempo</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-app-bg/50 border border-border-subtle/50 rounded-xl p-4 flex flex-col transition-colors">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h3 className="text-xs font-bold text-text-main flex items-center gap-2">
              <BarChart2 size={16} className="text-text-muted" />
              Volume de Tarefas
            </h3>
            
            <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
              <div className="flex items-center bg-app-bg rounded-lg border border-border-subtle p-1 shadow-inner">
                <button onClick={handlePrev} className="p-1 px-2 text-text-muted hover:text-text-main transition-colors"><ChevronLeft size={14}/></button>
                <span className="text-xs font-bold text-accent min-w-27.5 text-center tracking-wider">{dateRangeLabel}</span>
                <button onClick={handleNext} className="p-1 px-2 text-text-muted hover:text-text-main transition-colors"><ChevronRight size={14}/></button>
              </div>

              <div className="flex items-center bg-app-bg rounded-lg border border-border-subtle p-1 shadow-inner">
                <button onClick={() => setTimeframe('semana')} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${timeframe === 'semana' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-main'}`}>Semana</button>
                <button onClick={() => setTimeframe('mes')} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${timeframe === 'mes' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-main'}`}>Mês</button>
                <button onClick={() => setTimeframe('ano')} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${timeframe === 'ano' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-main'}`}>Ano</button>
              </div>
            </div>
          </div>

          <div className="h-100 min-h-100 w-full relative">
            <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
              <ComposedChart data={periodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.2 }} />
                
                {/* Alterei a cor da barra de fundo para usar o border-subtle para garantir contraste em todos os temas */}
                <Bar dataKey="Total" fill="var(--color-border-subtle)" radius={[4, 4, 0, 0]} barSize={timeframe === 'mes' ? 8 : 32} />
                
                <Line 
                  type="monotone" 
                  dataKey="Concluídas" 
                  stroke="var(--color-accent)" 
                  strokeWidth={3} 
                  dot={timeframe === 'mes' ? false : { fill: 'var(--color-app-bg)', stroke: 'var(--color-accent)', strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6, fill: 'var(--color-accent)', stroke: 'var(--color-app-bg)' }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-app-bg/50 border border-border-subtle/50 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-colors">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                <Flame size={12} className="text-rose-500" /> Streak do Período
              </span>
              <span className="text-xl font-black text-text-main leading-none">{periodStats.streak} <span className="text-sm font-medium text-text-muted">{timeframe === 'ano' ? 'meses' : 'dias'}</span></span>
            </div>
            <div className="bg-app-bg/50 border border-border-subtle/50 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-colors">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Concluídas</span>
              <span className="text-xl font-black text-accent leading-none">{periodStats.concluidas}</span>
            </div>
          </div>

          <div className="bg-app-bg/50 border border-border-subtle/50 rounded-xl p-4 flex-1 flex flex-col min-h-64 relative items-center justify-center transition-colors">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest absolute top-4 left-4 flex items-center gap-1.5">
              <Target size={14} className="text-accent" /> Sucesso do Período
            </h3>
            
            <div className="h-56 min-h-56 w-full mt-6 relative flex-1">
              <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-2 pointer-events-none">
                <span className="text-2xl font-black text-text-main">{periodStats.taxa}%</span>
                <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Taxa</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}