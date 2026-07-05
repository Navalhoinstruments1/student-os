"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
}

export default function TransactionModal({ isOpen, onClose, onSave }: TransactionModalProps) {
  const [newTx, setNewTx] = useState({
    title: '', amount: '', type: 'expense' as 'income' | 'expense', category: 'Alimentação'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
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

    onSave(transaction);
    setNewTx({ title: '', amount: '', type: 'expense', category: 'Alimentação' }); // Reset
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-200 flex items-center justify-center p-4 transition-all">
      <form onSubmit={handleSubmit} className="bg-card-bg border border-border-subtle rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-text-main flex items-center gap-2">Novo Movimento</h3>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-main bg-app-bg hover:bg-border-subtle/50 p-1.5 rounded-full transition-colors"><X size={18} /></button>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-app-bg border border-border-subtle/50 rounded-lg shadow-inner transition-colors">
            <button type="button" onClick={() => setNewTx({...newTx, type: 'expense'})} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${newTx.type === 'expense' ? 'bg-rose-500 text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}>Despesa</button>
            <button type="button" onClick={() => setNewTx({...newTx, type: 'income'})} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${newTx.type === 'income' ? 'bg-emerald-500 text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}>Receita</button>
          </div>

          <div>
            <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Descrição</label>
            <input type="text" required placeholder="Ex: Café, Renda, Bolsa..." className="w-full bg-app-bg text-text-main px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-accent border border-border-subtle shadow-inner transition-colors" value={newTx.title} onChange={e => setNewTx({...newTx, title: e.target.value})} />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Valor (€)</label>
              <input type="number" step="0.01" min="0" required placeholder="0.00" className="w-full bg-app-bg text-text-main px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-accent border border-border-subtle font-bold shadow-inner transition-colors" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Categoria</label>
              <select className="w-full bg-app-bg text-text-main px-3 py-3 rounded-xl outline-none focus:ring-2 focus:ring-accent border border-border-subtle text-sm shadow-inner transition-colors" value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})}>
                <option>Alimentação</option><option>Habitação</option><option>Transporte</option><option>Lazer</option><option>Educação</option><option>Fixo</option><option>Outro</option>
              </select>
            </div>
          </div>

          <button type="submit" className={`w-full font-bold py-3.5 rounded-xl mt-4 transition-all shadow-lg text-white ${newTx.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'}`}>
            Guardar {newTx.type === 'income' ? 'Receita' : 'Despesa'}
          </button>
        </div>
      </form>
    </div>
  );
}