"use client";

import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

interface FinanceChartsProps {
  transactions: Transaction[];
  timeScale?: 'week' | 'month' | 'year';
}

type GroupedBarData = Record<string, { 
  key: string; 
  displayDate: string; 
  income: number; 
  expense: number; 
  dateVal: number;
}>;

export default function FinanceCharts({ transactions, timeScale = 'month' }: FinanceChartsProps) {
  
  const { pieData, totalExpenses } = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    const grouped = expenses.reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    const data = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    return { pieData: data, totalExpenses: total };
  }, [transactions]);

  // Mantive o array original de cores, pois estas são as fatias do pie chart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b', '#14b8a6'];

  const barData = useMemo(() => {
    const groupByMonth = timeScale === 'year';

    const grouped = transactions.reduce((acc: GroupedBarData, t) => {
      const d = new Date(t.date);
      
      const key = groupByMonth ? `${d.getFullYear()}-${d.getMonth()}` : t.date;
      const display = groupByMonth 
        ? d.toLocaleString('pt-PT', { month: 'short' }).toUpperCase()
        : `${d.getDate()} ${d.toLocaleString('pt-PT', { month: 'short' })}`;

      if (!acc[key]) {
        acc[key] = { key, displayDate: display, income: 0, expense: 0, dateVal: d.getTime() };
      }
      
      if (t.type === 'income') acc[key].income += t.amount;
      if (t.type === 'expense') acc[key].expense += t.amount;
      
      return acc;
    }, {} as GroupedBarData);

    return Object.values(grouped).sort((a, b) => a.dateVal - b.dateVal);
  }, [transactions, timeScale]);

  const formatValue = (val: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);
  };

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-xs sm:text-sm font-medium py-10 opacity-70 text-center px-4 transition-colors">
        Gráficos indisponíveis (sem dados neste período)
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12 flex-1 flex flex-col transition-colors duration-300">
      
      {/* GRÁFICO 1: DISTRIBUIÇÃO */}
      <div className="h-64 sm:h-72 w-full relative flex items-center justify-center">
        <h4 className="text-[9px] sm:text-[10px] font-black text-text-muted uppercase tracking-widest absolute top-0 left-0 z-10">
          Distribuição por Categoria
        </h4>
        
        <div className="absolute inset-0 pb-6 flex flex-col items-center justify-center pointer-events-none z-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">Despesas</span>
            <span className="text-lg sm:text-xl font-black text-text-main drop-shadow-md px-2 text-center max-w-40 truncate">
              {formatValue(totalExpenses)}
            </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)', borderRadius: '12px', color: 'var(--color-text-main)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
              itemStyle={{ color: 'var(--color-text-main)', fontWeight: 'bold', fontSize: '13px' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => formatValue(Number(value || 0))}
            />
            <Legend 
              verticalAlign="bottom" 
              align="center" 
              iconType="circle" 
              wrapperStyle={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: '600', paddingTop: '10px' }} 
            />
            <Pie
              data={pieData}
              cx="50%" cy="50%" 
              innerRadius="65%" outerRadius="85%"
              paddingAngle={3} dataKey="value" stroke="none" cornerRadius={4}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="drop-shadow-sm outline-none" style={{ outline: 'none' }} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="h-px bg-linear-to-r from-transparent via-border-subtle to-transparent w-full opacity-50" />

      {/* GRÁFICO 2: BARRAS */}
      <div className="h-64 sm:h-72 w-full relative">
        <h4 className="text-[9px] sm:text-[10px] font-black text-text-muted uppercase tracking-widest absolute top-0 left-0 z-10">
          Balanço Temporal
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 25, right: 10, left: 15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} opacity={0.5} />
            <XAxis dataKey="displayDate" stroke="var(--color-text-muted)" fontSize={9} fontWeight={600} tickMargin={10} axisLine={false} tickLine={false} />
            <YAxis stroke="var(--color-text-muted)" fontSize={9} fontWeight={600} tickFormatter={(value) => `${value}€`} axisLine={false} tickLine={false} width={40} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
              labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => formatValue(Number(value || 0))}
              cursor={{ fill: 'var(--color-border-subtle)', opacity: 0.4 }}
            />
            <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '600', marginTop: '-20px', color: 'var(--color-text-muted)' }} />
            {/* Mantive as cores da contabilidade: Verde (Income), Vermelho (Expense) */}
            <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="expense" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}