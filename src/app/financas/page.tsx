"use client";

import FinanceCharts from '@/components/financas/FinanceCharts';
import StatCard from '@/components/financas/StatCard';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, 
  DollarSign, PieChart as PieChartIcon, Plus, 
  X, ShoppingBag, Lightbulb, ChevronLeft, ChevronRight
} from 'lucide-react';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

export const formatEur = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
};

const getStartOfWeek = (d: Date) => { const date = new Date(d); const day = date.getDay() || 7; date.setHours(0,0,0,0); date.setDate(date.getDate() - day + 1); return date; };
const getEndOfWeek = (start: Date) => { const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999); return end; };
const getStartOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const getEndOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
const getStartOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1);
const getEndOfYear = (d: Date) => new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);

export default function FinancasPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [timeScale, setTimeScale] = useState<'week' | 'month' | 'year'>('month');
  const [referenceDate, setReferenceDate] = useState(new Date());
  
  const [newTx, setNewTx] = useState({
    title: '', amount: '', type: 'expense' as 'income' | 'expense', category: 'Alimentação'
  });

  useEffect(() => {
    setTimeout(() => {
      try {
        const saved = localStorage.getItem('studentOs_transactions');
        if (saved) {
          setTransactions(JSON.parse(saved));
        } else {
          // MODO DE FÁBRICA: Começa a zeros
          setTransactions([]);
        }
      } catch (error) {
        console.error("Erro ao ler transações:", error);
        // Em caso de corrupção de dados, reinicia a carteira
        setTransactions([]);
      } finally {
        // Aconteça o que acontecer, mostra a UI!
        setIsLoaded(true);
      }
    }, 0);
  }, []);
  
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('studentOs_transactions', JSON.stringify(transactions));
    }
  }, [transactions, isLoaded]);

  const { startDate, endDate, periodLabel } = useMemo(() => {
    let start, end, label = '';
    if (timeScale === 'week') {
      start = getStartOfWeek(referenceDate);
      end = getEndOfWeek(start);
      label = `${start.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}`;
    } else if (timeScale === 'month') {
      start = getStartOfMonth(referenceDate);
      end = getEndOfMonth(referenceDate);
      label = start.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
    } else {
      start = getStartOfYear(referenceDate);
      end = getEndOfYear(referenceDate);
      label = start.getFullYear().toString();
    }
    return { startDate: start, endDate: end, periodLabel: label };
  }, [timeScale, referenceDate]);

  const changePeriod = (direction: number) => {
    const newDate = new Date(referenceDate);
    if (timeScale === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    if (timeScale === 'month') newDate.setMonth(newDate.getMonth() + direction);
    if (timeScale === 'year') newDate.setFullYear(newDate.getFullYear() + direction);
    setReferenceDate(newDate);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, startDate, endDate]);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expenses;
    
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const globalBalance = totalIncome - totalExpenses;

    const now = new Date();
    const isCurrentMonth = now >= getStartOfMonth(referenceDate) && now <= getEndOfMonth(referenceDate);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = isCurrentMonth ? (lastDay - now.getDate() + 1) : 0;
    
    const todayStr = now.toISOString().split('T')[0];
    const expensesToday = transactions.filter(t => t.type === 'expense' && t.date === todayStr).reduce((acc, t) => acc + t.amount, 0);

    const dailyAllowance = (globalBalance > 0 && isCurrentMonth) ? (globalBalance / daysRemaining) : 0;
    const budgetUsedPercent = dailyAllowance > 0 ? (expensesToday / dailyAllowance) * 100 : (expensesToday > 0 ? 100 : 0);
    const safePercent = Math.min(Math.max(budgetUsedPercent, 0), 100);
    
    let barColor = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    if (safePercent > 75) barColor = 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
    if (safePercent >= 100) barColor = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';

    return { income, expenses, balance, globalBalance, dailyAllowance, daysRemaining, expensesToday, safePercent, barColor, isCurrentMonth };
  }, [filteredTransactions, transactions, referenceDate]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.title || !newTx.amount) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      title: newTx.title,
      amount: parseFloat(newTx.amount),
      type: newTx.type,
      category: newTx.category,
      date: new Date().toISOString().split('T')[0]
    };

    setTransactions([transaction, ...transactions]);
    setIsModalOpen(false);
    setNewTx({ title: '', amount: '', type: 'expense', category: 'Alimentação' });
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  if (!isLoaded) return <div className="min-h-screen bg-app-bg"></div>;

  return (
    <div className="w-full min-h-full bg-app-bg text-text-main p-4 md:p-8 w-full transition-colors duration-300">
      
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent drop-shadow-sm">
            Gestão Financeira
          </h1>
          <p className="text-text-muted font-medium mt-1">Visão global do fluxo de caixa e histórico de movimentos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
        >
          <Plus size={18} strokeWidth={3} /> Add Movimento
        </button>
      </header>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard title="Saldo Global" value={formatEur(stats.globalBalance)} icon={<Wallet size={20} className="text-blue-400" />} subtext="Na tua conta" />
        {stats.isCurrentMonth ? (
           <StatCard title="Orçamento Diário" value={formatEur(stats.dailyAllowance)} icon={<TrendingUp size={20} className="text-emerald-400" />} subtext={`Restam ${stats.daysRemaining} dias`} highlight />
        ) : (
           <StatCard title="Balanço do Período" value={formatEur(stats.balance)} icon={<TrendingUp size={20} className="text-emerald-400" />} subtext={periodLabel} highlight={stats.balance > 0} />
        )}
        <StatCard title="Receitas no Período" value={formatEur(stats.income)} icon={<ArrowUpCircle size={20} className="text-emerald-400" />} subtext={periodLabel} />
        <StatCard title="Despesas no Período" value={formatEur(stats.expenses)} icon={<ArrowDownCircle size={20} className="text-rose-400" />} subtext={periodLabel} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* COLUNA ESQUERDA */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          {/* GESTÃO INTELIGENTE */}
          <div className="bg-card-bg border border-emerald-500/30 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-[0_10px_30px_rgba(16,185,129,0.05)] shrink-0 group transition-colors duration-300">
             <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-emerald-500/5 to-blue-500/5 pointer-events-none opacity-50"></div>
             
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="bg-emerald-500/20 p-1.5 rounded-lg border border-emerald-500/30">
                        <Lightbulb size={16} className="text-emerald-400" />
                    </div>
                    <h3 className="text-[12px] sm:text-sm font-bold text-text-main uppercase tracking-widest">Gestão Inteligente</h3>
                </div>
                
                {stats.isCurrentMonth ? (
                    <>
                        <p className="text-text-muted text-xs sm:text-sm mb-4 sm:mb-5 leading-relaxed max-w-xl">
                          Limite diário disponível: <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">{formatEur(stats.dailyAllowance)}</span>. 
                          Consumido hoje: <span className="text-text-main font-bold">{formatEur(stats.expensesToday)}</span>. 
                          O saldo não utilizado transita automaticamente para os dias seguintes.
                        </p>
                        <div className="space-y-2 bg-app-bg/50 p-4 rounded-2xl border border-border-subtle">
                          <div className="flex justify-between items-end">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-text-muted">Consumo Diário</span>
                            <span className={`font-bold text-xs sm:text-sm ${stats.safePercent >= 100 ? 'text-rose-400' : 'text-text-main'}`}>
                                {Math.round(stats.safePercent)}%
                            </span>
                          </div>
                          <div className="h-2.5 sm:h-3 w-full bg-app-bg rounded-full overflow-hidden shadow-inner border border-border-subtle">
                            <div className={`h-full transition-all duration-1000 rounded-full ${stats.barColor}`} style={{ width: `${stats.safePercent}%` }} />
                          </div>
                        </div>
                    </>
                ) : (
                    <p className="text-text-muted text-xs sm:text-sm mb-2 py-4">A consultar o histórico de <strong className="text-emerald-400">{periodLabel}</strong>. Regresse ao mês atual para gerir o orçamento ativo.</p>
                )}
             </div>
             <DollarSign className="absolute -right-8 -bottom-8 text-emerald-500/5 w-40 h-40 sm:w-48 sm:h-48 rotate-12" />
          </div>

          {/* CAIXA DOS GRÁFICOS */}
          <div className="bg-card-bg border border-border-subtle rounded-3xl p-4 sm:p-6 shadow-lg flex-1 min-h-125 flex flex-col transition-colors duration-300">
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-6 gap-4">
                <h3 className="text-[12px] sm:text-[14px] font-bold flex items-center gap-2 text-text-main uppercase tracking-widest shrink-0">
                  <div className="bg-blue-500/20 p-1.5 rounded-lg border border-blue-500/30">
                      <PieChartIcon size={16} className="text-blue-400" /> 
                  </div>
                  Análise de Fluxo
                </h3>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full xl:w-auto bg-app-bg/50 p-1.5 rounded-2xl border border-border-subtle">
                    <div className="flex items-center bg-app-bg rounded-xl border border-border-subtle p-1 flex-1 sm:flex-none justify-between sm:justify-start">
                        <button onClick={() => changePeriod(-1)} className="p-1 sm:p-1.5 text-text-muted hover:text-text-main hover:bg-border-subtle/50 rounded-lg transition-colors"><ChevronLeft size={14} strokeWidth={3} /></button>
                        <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 w-24 sm:w-32 text-center uppercase tracking-widest truncate">{periodLabel}</span>
                        <button onClick={() => changePeriod(1)} className="p-1 sm:p-1.5 text-text-muted hover:text-text-main hover:bg-border-subtle/50 rounded-lg transition-colors"><ChevronRight size={14} strokeWidth={3} /></button>
                    </div>
                    
                    <div className="flex bg-app-bg p-1 rounded-xl border border-border-subtle shadow-inner flex-1 sm:flex-none justify-center">
                        <button onClick={() => setTimeScale('week')} className={`flex-1 px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${timeScale === 'week' ? 'bg-emerald-500 text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}>Semana</button>
                        <button onClick={() => setTimeScale('month')} className={`flex-1 px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${timeScale === 'month' ? 'bg-emerald-500 text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}>Mês</button>
                        <button onClick={() => setTimeScale('year')} className={`flex-1 px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${timeScale === 'year' ? 'bg-emerald-500 text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}>Ano</button>
                    </div>
                </div>
            </div>
            
            <FinanceCharts transactions={filteredTransactions} timeScale={timeScale} />
          </div>
        </div>

        {/* COLUNA DIREITA: LISTA DE MOVIMENTOS */}
        <div className="bg-card-bg border border-border-subtle rounded-3xl p-5 sm:p-6 flex flex-col h-125 lg:h-[calc(100vh-180px)] shadow-lg relative overflow-hidden transition-colors duration-300">
          <div className="flex items-center justify-between mb-6 shrink-0 z-10">
              <h3 className="text-[12px] sm:text-[14px] font-bold text-text-main uppercase tracking-widest">Movimentos ({periodLabel})</h3>
              <span className="bg-app-bg px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-bold text-text-muted border border-border-subtle">{filteredTransactions.length}</span>
          </div>
          
          <div className="space-y-2.5 overflow-y-auto flex-1 custom-scrollbar pr-2 z-10">
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                  <ShoppingBag size={28} className="text-text-muted/50 mb-3" />
                  <p className="text-text-muted text-xs font-medium">Sem movimentos registados.</p>
              </div>
            ) : (
              filteredTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-app-bg/60 border border-border-subtle group hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-center gap-3 w-2/3">
                    <div className={`p-2 rounded-xl border shrink-0 ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {t.type === 'income' ? <Wallet size={14} /> : <ShoppingBag size={14} />}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-xs sm:text-sm leading-tight text-text-main truncate">{t.title}</p>
                      <p className="text-[8px] sm:text-[9px] text-text-muted uppercase tracking-widest font-black mt-0.5">{t.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-black text-[12px] sm:text-[14px] tracking-tight ${t.type === 'income' ? 'text-emerald-400' : 'text-text-main'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatEur(t.amount)}
                    </span>
                    <button onClick={() => deleteTransaction(t.id)} className="text-text-muted bg-card-bg hover:bg-rose-500/20 hover:text-rose-400 border border-transparent hover:border-rose-500/30 p-1.5 rounded-lg opacity-0 lg:group-hover:opacity-100 transition-all outline-none">
                        <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-card-bg to-transparent pointer-events-none rounded-b-3xl"></div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-200 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form onSubmit={handleAddTransaction} className="bg-card-bg border border-border-subtle rounded-3xl p-6 w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-emerald-500 to-rose-500"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-text-main flex items-center gap-2">Novo Movimento</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-main bg-app-bg p-1.5 rounded-full border border-border-subtle hover:border-text-muted outline-none"><X size={16} strokeWidth={2.5}/></button>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2 p-1.5 bg-app-bg border border-border-subtle rounded-xl shadow-inner">
                <button type="button" onClick={() => setNewTx({...newTx, type: 'expense'})} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${newTx.type === 'expense' ? 'bg-rose-500 text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}>Despesa</button>
                <button type="button" onClick={() => setNewTx({...newTx, type: 'income'})} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${newTx.type === 'income' ? 'bg-emerald-500 text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}>Receita</button>
              </div>
              <div>
                <label className="text-[9px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block ml-1">Descrição</label>
                <input type="text" required placeholder="Ex: Renda, Almoço..." className="w-full bg-app-bg text-text-main px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 border border-border-subtle shadow-inner text-sm" value={newTx.title} onChange={e => setNewTx({...newTx, title: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[9px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block ml-1">Valor (€)</label>
                  <input type="number" step="0.01" min="0" required placeholder="0.00" className="w-full bg-app-bg text-text-main px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 border border-border-subtle shadow-inner font-bold text-sm" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block ml-1">Categoria</label>
                  <select className="w-full bg-app-bg text-text-main px-3 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 border border-border-subtle shadow-inner text-sm font-medium appearance-none" value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})}>
                    <option>Alimentação</option><option>Habitação</option><option>Transporte</option><option>Lazer</option><option>Educação</option><option>Fixo</option><option>Outro</option>
                  </select>
                </div>
              </div>
              <button type="submit" className={`w-full font-black uppercase tracking-wider py-3.5 rounded-xl mt-4 transition-all shadow-lg text-white outline-none ${newTx.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500' : 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500'}`}>
                Confirmar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}