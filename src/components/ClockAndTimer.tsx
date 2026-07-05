"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Brain, Coffee, Timer } from 'lucide-react';

const POMODORO_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

interface ClockProps {
  currentTime: Date;
}

export default function ClockAndTimer({ currentTime }: ClockProps) {
  const [mounted, setMounted] = useState(false);

  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);

  const [activeTab, setActiveTab] = useState<'stopwatch' | 'pomodoro'>('pomodoro');
  const [pomoState, setPomoState] = useState<'focus' | 'break'>('focus');
  const [pomoTime, setPomoTime] = useState(POMODORO_TIME);
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const pomoStateRef = useRef(pomoState);
  useEffect(() => {
    pomoStateRef.current = pomoState;
  }, [pomoState]);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchTime((prev) => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPomoRunning) {
      interval = setInterval(() => {
        setPomoTime((prevTime) => {
          if (prevTime > 1) {
            return prevTime - 1;
          }
          
          if (pomoStateRef.current === 'focus') {
            setSessionsCompleted((s) => s + 1);
            setPomoState('break');
            return BREAK_TIME;
          } else {
            setIsPomoRunning(false);
            setPomoState('focus');
            return POMODORO_TIME;
          }
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPomoRunning]);

  const secondsDegrees = mounted ? currentTime.getSeconds() * 6 : 0;
  const minutesDegrees = mounted ? currentTime.getMinutes() * 6 + currentTime.getSeconds() * 0.1 : 0;
  const hoursDegrees = mounted ? (currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5 : 0;

  const formatStopwatch = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const formatPomodoro = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-3 h-100 w-full">
      {/* RELÓGIO ANALÓGICO */}
      <div className="bg-card-bg p-3 rounded-xl shadow border border-border-subtle flex flex-col items-center justify-center relative overflow-hidden group transition-colors duration-300">
        <div className="absolute -top-5 -right-5 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none transition-all duration-1000 group-hover:bg-accent/10"></div>
        
        <h3 className="text-text-muted text-[10px] font-bold mb-2 uppercase tracking-widest relative z-10 transition-colors">
          Hora Atual
        </h3>

        <div className="relative w-32 h-32 rounded-full border-[3px] border-border-subtle bg-app-bg/50 shadow-[inset_0_4px_15px_rgba(0,0,0,0.4)] flex items-center justify-center mb-1 transition-colors">
          <span className="absolute top-1.5 text-[10px] font-black text-text-muted transition-colors">12</span>
          <span className="absolute right-2.5 text-[10px] font-black text-text-muted transition-colors">3</span>
          <span className="absolute bottom-1.5 text-[10px] font-black text-text-muted transition-colors">6</span>
          <span className="absolute left-2.5 text-[10px] font-black text-text-muted transition-colors">9</span>

          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${i * 30}deg)` }}>
              <div className={`mx-auto mt-1 ${i % 3 === 0 ? 'w-0 h-0' : 'w-0.5 h-1.5 bg-text-muted/50 rounded-full'}`}></div>
            </div>
          ))}

          <div className="absolute w-2.5 h-2.5 bg-slate-200 rounded-full z-30 shadow-md border border-slate-800"></div>
          <div className="absolute w-1 h-1 bg-red-500 rounded-full z-40"></div>

          <div className="absolute w-1 h-9 bg-slate-300 rounded-full origin-bottom bottom-1/2 transition-transform duration-200 z-10" style={{ transform: `rotate(${hoursDegrees}deg)` }} />
          {/* Ponteiro dos minutos usa a cor do tema atual */}
          <div className="absolute w-1 h-12 bg-accent rounded-full origin-bottom bottom-1/2 transition-transform duration-200 z-20 shadow-[0_0_8px_var(--color-accent)] opacity-80" style={{ transform: `rotate(${minutesDegrees}deg)` }} />
          <div className="absolute w-0.5 h-14 bg-red-500 rounded-full origin-bottom bottom-1/2 transition-transform duration-100 z-20" style={{ transform: `rotate(${secondsDegrees}deg)` }}>
            <div className="absolute w-0.5 h-2.5 bg-red-500 left-0 top-full rounded-b-full"></div>
          </div>
        </div>
      </div>

      {/* ESTAÇÃO DE ESTUDO */}
      <div className="bg-card-bg p-4 rounded-xl shadow border border-border-subtle flex flex-col items-center flex-1 relative overflow-hidden transition-colors duration-300">
        
        <div className="flex gap-1 bg-app-bg/50 p-1 rounded-lg mb-4 w-full z-10 border border-border-subtle/50 transition-colors">
          <button 
            onClick={() => setActiveTab('pomodoro')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'pomodoro' ? 'bg-border-subtle text-accent shadow' : 'text-text-muted hover:text-text-main'}`}
          >
            <Brain size={14} /> Pomodoro
          </button>
          <button 
            onClick={() => setActiveTab('stopwatch')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'stopwatch' ? 'bg-border-subtle text-blue-400 shadow' : 'text-text-muted hover:text-text-main'}`}
          >
            <Timer size={14} /> Contínuo
          </button>
        </div>

        {activeTab === 'pomodoro' && (
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-2 mb-1">
              {/* Cores de estado mantidas hardcoded para preservar significado psicológico */}
              <span className={`text-[10px] font-bold uppercase tracking-widest ${pomoState === 'focus' ? 'text-emerald-500' : 'text-amber-400'}`}>
                {pomoState === 'focus' ? 'Tempo de Foco' : 'Pausa Curta'}
              </span>
              {pomoState === 'break' && <Coffee size={12} className="text-amber-400" />}
            </div>

            <div className={`text-4xl font-black text-text-main mb-4 tracking-wider tabular-nums ${isPomoRunning ? (pomoState === 'focus' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]') : ''} transition-colors duration-500`}>
              {formatPomodoro(pomoTime)}
            </div>

            <div className="flex gap-4 mb-3 w-full justify-center">
              <button onClick={() => setIsPomoRunning(!isPomoRunning)} className={`p-2.5 rounded-full transition-all shadow-lg flex items-center justify-center ${isPomoRunning ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-emerald-500 hover:bg-emerald-400 text-white'}`}>
                {isPomoRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
              <button 
                onClick={() => { setIsPomoRunning(false); setPomoTime(pomoState === 'focus' ? POMODORO_TIME : BREAK_TIME); }}
                className="p-2.5 bg-border-subtle hover:bg-text-muted/20 rounded-full text-text-main transition-colors"
                title="Reiniciar Timer"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            <div className="text-xs text-text-muted font-medium flex items-center gap-1.5 transition-colors">
              Sessões de foco concluídas: <span className="text-emerald-400 font-bold">{sessionsCompleted}</span>
            </div>
          </div>
        )}

        {activeTab === 'stopwatch' && (
          <div className="flex flex-col items-center w-full pt-2">
            <h3 className="text-text-muted text-xs font-bold mb-2 uppercase tracking-widest z-10 transition-colors">Tempo Livre</h3>
            
            <div className={`text-3xl font-black text-text-main mb-6 tracking-wider z-10 tabular-nums ${isStopwatchRunning ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]' : ''} transition-colors duration-500`}>
              {formatStopwatch(stopwatchTime)}
            </div>
            
            <div className="flex gap-4 z-10">
              <button onClick={() => setIsStopwatchRunning(!isStopwatchRunning)} className={`p-3 rounded-full transition-all shadow-lg flex items-center justify-center ${isStopwatchRunning ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-blue-500 hover:bg-blue-400 text-white'}`}>
                {isStopwatchRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={() => { setIsStopwatchRunning(false); setStopwatchTime(0); }} className="p-3 bg-border-subtle hover:bg-text-muted/20 rounded-full text-text-main transition-colors">
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}