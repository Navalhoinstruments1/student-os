"use client";

import React, { useState, useEffect } from 'react';
import { Target, Plus, Minus, Trash2, CheckCircle2 } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
}

export default function MonthlyGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');

  useEffect(() => {
    // Leitura imediata e segura
    const saved = localStorage.getItem('studentOs_monthlyGoals');
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGoals(JSON.parse(saved));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGoals([{ id: '1', title: 'Ler Livros', current: 1, target: 4 }]);
    }
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem('studentOs_monthlyGoals', JSON.stringify(goals));
  }, [goals, isLoaded]);

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTarget) return;
    const targetNum = parseInt(newTarget);
    if (targetNum <= 0) return;

    setGoals([...goals, { id: Date.now().toString(), title: newTitle, current: 0, target: targetNum }]);
    setNewTitle('');
    setNewTarget('');
  };

  const updateGoal = (id: string, amount: number) => {
    setGoals(goals.map(g => {
      if (g.id === id) {
        const newCurrent = Math.max(0, Math.min(g.current + amount, g.target));
        return { ...g, current: newCurrent };
      }
      return g;
    }));
  };

  const deleteGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));

  if (!isLoaded) return <div className="animate-pulse bg-card-bg rounded-xl h-100"></div>;

  return (
    <div className="bg-card-bg p-5 rounded-xl shadow-lg border border-border-subtle flex flex-col h-full max-h-[400px] transition-colors duration-300">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <Target size={18} className="text-accent transition-colors" />
        <h3 className="text-text-main font-bold text-sm uppercase tracking-wide transition-colors">Objetivos do Mês</h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 mb-4">
        {goals.length === 0 ? (
          <p className="text-xs text-text-muted italic text-center mt-4 transition-colors">Nenhum objetivo definido.</p>
        ) : (
          goals.map(goal => {
            const percent = (goal.current / goal.target) * 100;
            const isComplete = goal.current === goal.target;

            return (
              <div key={goal.id} className="bg-app-bg/50 p-3 rounded-lg border border-border-subtle/50 group transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-bold transition-colors ${isComplete ? 'text-emerald-400' : 'text-text-main'}`}>
                    {goal.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-text-muted transition-colors">{goal.current} / {goal.target}</span>
                    <button onClick={() => deleteGoal(goal.id)} className="text-text-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="h-2 w-full bg-border-subtle rounded-full overflow-hidden mb-2 transition-colors">
                  <div className={`h-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-accent'}`} style={{ width: `${percent}%` }} />
                </div>

                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest transition-colors">
                    {percent.toFixed(0)}% Concluído
                  </span>
                  {!isComplete ? (
                    <div className="flex gap-1">
                      <button onClick={() => updateGoal(goal.id, -1)} className="p-1 bg-border-subtle hover:bg-text-muted/20 rounded text-text-muted transition-colors"><Minus size={12} /></button>
                      <button onClick={() => updateGoal(goal.id, 1)} className="p-1 bg-accent/20 hover:bg-accent text-accent hover:text-white rounded transition-colors"><Plus size={12} /></button>
                    </div>
                  ) : (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={addGoal} className="flex gap-2 shrink-0 pt-2 border-t border-border-subtle transition-colors">
        <input 
          type="text" placeholder="Novo objetivo..." required
          className="flex-1 bg-app-bg/50 text-text-main text-xs px-3 py-2 rounded-lg border border-border-subtle outline-none focus:border-accent transition-colors"
          value={newTitle} onChange={e => setNewTitle(e.target.value)}
        />
        <input 
          type="number" placeholder="Alvo" min="1" required
          className="w-16 bg-app-bg/50 text-text-main text-xs px-2 py-2 rounded-lg border border-border-subtle outline-none focus:border-accent text-center transition-colors"
          value={newTarget} onChange={e => setNewTarget(e.target.value)}
        />
        <button type="submit" className="bg-accent hover:opacity-90 text-white px-3 rounded-lg transition-all flex items-center justify-center shadow-md">
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}