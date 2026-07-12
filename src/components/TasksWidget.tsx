"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, ChevronLeft, ChevronRight, Star, Target } from 'lucide-react';

export interface Task {
  id: string;
  text: string;
  date: string; 
  completed: boolean;
  isRecurring?: boolean;
}

interface TasksWidgetProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function TasksWidget({ tasks, setTasks }: TasksWidgetProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [newTaskText, setNewTaskText] = useState('');

  const changeDate = (daysToAdd: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + daysToAdd);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const displayDate = new Date(selectedDate);
  const isToday = selectedDate === todayStr;
  const dateLabel = isToday ? "Hoje" : displayDate.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' });

  useEffect(() => {
    const recurringTasks = tasks.filter(t => t.isRecurring);
    const uniqueRecurringTexts = [...new Set(recurringTasks.map(t => t.text))];
    const missingTasks: Task[] = [];

    uniqueRecurringTexts.forEach(text => {
      const existsOnSelectedDate = tasks.some(t => t.date === selectedDate && t.text === text);
      if (!existsOnSelectedDate) {
        missingTasks.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          text: text,
          date: selectedDate,
          completed: false,
          isRecurring: true
        });
      }
    });

    if (missingTasks.length > 0) {
      setTasks(prev => [...prev, ...missingTasks]);
    }
  }, [selectedDate, tasks, setTasks]);

  const dailyTasks = tasks.filter(t => t.date === selectedDate);
  const completedDaily = dailyTasks.filter(t => t.completed).length;
  const totalDaily = dailyTasks.length;
  const pendingDaily = totalDaily - completedDaily;
  const dailyPercentage = totalDaily === 0 ? 0 : Math.round((completedDaily / totalDaily) * 100);

  useEffect(() => {
    localStorage.setItem('studentOs_tasks', JSON.stringify(tasks));
    window.dispatchEvent(new Event('syncTasks'));
  }, [tasks]);

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      date: selectedDate,
      completed: false,
      isRecurring: false
    };
    setTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const toggleRecurring = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = !task.isRecurring;
    setTasks(tasks.map(t => t.text === task.text ? { ...t, isRecurring: newStatus } : t));
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    if (taskToDelete.isRecurring) {
       setTasks(prev => prev.filter(t => t.id !== id).map(t => t.text === taskToDelete.text ? { ...t, isRecurring: false } : t));
    } else {
       setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="bg-card-bg p-5 rounded-xl shadow border border-border-subtle h-full flex flex-col lg:flex-row gap-6 transition-colors duration-300">
      
      <div className="flex-1 flex flex-col min-h-[300px]">
        
        <div className="flex justify-between items-center mb-5 bg-app-bg/40 p-2 rounded-lg border border-border-subtle transition-colors">
          <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-border-subtle rounded text-text-muted hover:text-text-main transition-colors"><ChevronLeft size={18}/></button>
          <div className="font-bold text-text-main flex flex-col items-center transition-colors">
            <span className="text-sm uppercase tracking-widest text-accent transition-colors">{dateLabel}</span>
          </div>
          <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-border-subtle rounded text-text-muted hover:text-text-main transition-colors"><ChevronRight size={18}/></button>
        </div>

        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
          <input 
            type="text" placeholder="Adicionar tarefa diária..." 
            className="flex-1 bg-app-bg/50 text-text-main placeholder:text-text-muted/60 px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent border border-border-subtle transition-colors"
            value={newTaskText} onChange={e => setNewTaskText(e.target.value)}
          />
          <button type="submit" className="bg-accent hover:opacity-90 text-white p-2 rounded-lg transition-all shadow-lg">
            <Plus size={18} />
          </button>
        </form>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
          {dailyTasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted gap-2 opacity-60 pt-8 transition-colors">
              <CheckCircle2 size={32} />
              <p className="text-sm">Dia livre. Nenhuma tarefa agendada.</p>
            </div>
          ) : (
            dailyTasks.map(task => (
              <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${task.completed ? 'bg-app-bg/30 border-border-subtle/50 opacity-60' : 'bg-card-bg border-border-subtle hover:border-text-muted/50'}`}>
                
                <div className="flex items-center gap-3 cursor-pointer flex-1 truncate pr-2" onClick={() => toggleTask(task.id)}>
                  {task.completed ? <CheckCircle2 className="text-accent shrink-0 transition-colors" size={18} /> : <Circle className="text-text-muted shrink-0 transition-colors" size={18} />}
                  <span className={`text-sm truncate transition-colors ${task.completed ? 'line-through text-text-muted' : 'text-text-main'}`}>{task.text}</span>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => toggleRecurring(task.id)} 
                    className={`p-1.5 rounded transition-all ${task.isRecurring ? 'text-amber-400 bg-amber-400/10' : 'text-text-muted hover:text-amber-400 hover:bg-border-subtle'}`}
                    title="Marcar como hábito diário"
                  >
                    <Star size={16} fill={task.isRecurring ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={() => deleteTask(task.id)} 
                    className="text-text-muted hover:text-rose-400 hover:bg-border-subtle p-1.5 rounded transition-all"
                    title="Apagar tarefa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      <div className="lg:w-64 shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-border-subtle pt-6 lg:pt-0 lg:pl-6 transition-colors">
        
        <div className="bg-app-bg/40 rounded-xl p-6 border border-border-subtle/50 flex-1 flex flex-col items-center justify-center relative shadow-inner transition-colors">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest absolute top-4 left-4 flex items-center gap-1 transition-colors">
            <Target size={12} className="text-accent transition-colors" />
            Progresso Diário
          </h3>
          
          <div className="relative w-40 h-40 flex items-center justify-center mt-2">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" className="stroke-border-subtle transition-colors" strokeWidth="12" fill="none" />
              <circle cx="80" cy="80" r="70" className="stroke-accent transition-all duration-1000 ease-out drop-shadow-[0_0_8px_var(--color-accent)] opacity-80" 
                strokeWidth="12" fill="none" strokeDasharray={2 * Math.PI * 70} 
                strokeDashoffset={2 * Math.PI * 70 - (dailyPercentage / 100) * 2 * Math.PI * 70} 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-text-main transition-colors">{dailyPercentage}%</span>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 w-full px-2">
            <div className="flex flex-col items-center bg-accent/5 px-4 py-2 rounded-lg border border-accent/10 transition-colors">
              <span className="text-xl font-bold text-accent leading-none transition-colors">{completedDaily}</span>
              <span className="text-[10px] uppercase tracking-widest text-text-muted mt-1 transition-colors">Feitas</span>
            </div>
            <div className="flex flex-col items-center bg-card-bg/50 px-4 py-2 rounded-lg border border-border-subtle transition-colors">
              <span className="text-xl font-bold text-amber-400 leading-none">{pendingDaily}</span>
              <span className="text-[10px] uppercase tracking-widest text-text-muted mt-1 transition-colors">Faltam</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}