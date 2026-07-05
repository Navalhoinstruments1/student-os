"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dumbbell, ChevronDown, ChevronRight, Plus, X, CheckCircle2, Circle, Clock, Target, Scale, CalendarDays } from 'lucide-react';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const MUSCLE_GROUPS = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abs', 'Cardio', 'Outro'];

export interface Exercise { 
  id: string; 
  name: string; 
  weight?: string;
  category?: string; 
  series?: string;
  reps?: string;
}

export interface WorkoutDay { 
  time: string; 
  endTime?: string; 
  exercises: Exercise[]; 
  completed?: boolean; 
  completedAt?: string; 
}

interface ConflictData {
  newEvt: { startHour: number; startMin: number; dayOfWeek: number };
  oldEvt: { id: string; title: string };
}

interface WorkoutHistoryLog {
  date: string; 
  dayOfWeek: string;
  categoryVolumes: Record<string, number>;
}

export default function WeeklyWorkouts() {
  const [workouts, setWorkouts] = useState<Record<string, WorkoutDay>>({});
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [pickerConfig, setPickerConfig] = useState<{ type: 'start' | 'end', day: string, hour: string, minute: string } | null>(null);
  const [categoryPicker, setCategoryPicker] = useState<{ day: string; exerciseId: string; current: string } | null>(null);
  const [conflictModal, setConflictModal] = useState<ConflictData | null>(null);

  const getWeekLabel = () => {
    const today = new Date();
    const currentDay = today.getDay(); 
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDay);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    const format = (d: Date) => d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
    return `${format(sunday)} - ${format(saturday)}`;
  };

  useEffect(() => {
    setTimeout(() => {
      const saved = localStorage.getItem('studentOs_workouts');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const migratedData: Record<string, WorkoutDay> = {};
          Object.keys(parsed).forEach(day => {
            const dayData = parsed[day];
            migratedData[day] = { 
                ...dayData, 
                endTime: dayData.endTime || '', 
                completed: dayData.completed || false,
                completedAt: dayData.completedAt || undefined,
                exercises: (dayData.exercises || []).map((ex: Exercise) => ({
                    ...ex,
                    category: ex.category || 'Outro',
                    series: ex.series || '',
                    reps: ex.reps || '',
                    weight: ex.weight || ''
                }))
            };
          });
          setWorkouts(migratedData);
        } catch (e) { console.error("Erro na migração", e); }
      }
      setIsLoaded(true);
      window.dispatchEvent(new Event('syncGymWorkouts'));
    }, 0);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('studentOs_workouts', JSON.stringify(workouts));
    }
  }, [workouts, isLoaded]);

  useEffect(() => {
    const handleConflict = (e: Event) => {
      const customEvent = e as CustomEvent;
      setConflictModal(customEvent.detail);
    };
    window.addEventListener('gymConflict', handleConflict);
    return () => window.removeEventListener('gymConflict', handleConflict);
  }, []);

  const { plannedDays, completedDays, progressPercent } = useMemo(() => {
    let planned = 0, completed = 0;
    DAYS.forEach(day => {
      if (workouts[day] && workouts[day].exercises.length > 0) {
        planned++;
        if (workouts[day].completed) completed++;
      }
    });
    return { plannedDays: planned, completedDays: completed, progressPercent: planned === 0 ? 0 : (completed / planned) * 100 };
  }, [workouts]);

  const handleTimeChange = (day: string, type: 'start' | 'end', timeStr: string) => {
    const current = workouts[day] || { time: '', endTime: '', exercises: [], completed: false };
    if (type === 'start') {
      setWorkouts({ ...workouts, [day]: { ...current, time: timeStr } });
    } else {
      setWorkouts({ ...workouts, [day]: { ...current, endTime: timeStr } });
    }
  };

  const handleAddExercise = (day: string) => {
    const current = workouts[day] || { time: '', endTime: '', exercises: [], completed: false };
    setWorkouts({ ...workouts, [day]: { ...current, exercises: [...current.exercises, { id: Date.now().toString(), name: '', weight: '', category: 'Peito', series: '', reps: '' }] } });
  };

  const handleUpdateExerciseField = (day: string, exerciseId: string, field: keyof Exercise, value: string) => {
    const current = workouts[day];
    if (!current) return;
    setWorkouts({ ...workouts, [day]: { ...current, exercises: current.exercises.map(ex => ex.id === exerciseId ? { ...ex, [field]: value } : ex) } });
  };

  const handleRemoveExercise = (day: string, exerciseId: string) => {
    const current = workouts[day];
    if (!current) return;
    const updated = current.exercises.filter(ex => ex.id !== exerciseId);
    setWorkouts({ ...workouts, [day]: { ...current, exercises: updated, completed: updated.length === 0 ? false : current.completed } });
  };

  const removeWorkoutVolumeFromHistory = (day: string, actionDate: string) => {
      try {
          const savedHistory = localStorage.getItem('studentOs_workout_history');
          if (!savedHistory) return;
          const history: WorkoutHistoryLog[] = JSON.parse(savedHistory);
          
          const filteredHistory = history.filter(log => !(log.date === actionDate && log.dayOfWeek === day));
          localStorage.setItem('studentOs_workout_history', JSON.stringify(filteredHistory));
          
      } catch (e) { console.error("Erro ao apagar histórico", e); }
  };

  const saveWorkoutVolumeToHistory = (day: string, exercises: Exercise[], actionDate: string) => {
      const volumes: Record<string, number> = {};
      exercises.forEach(ex => {
          const s = parseInt(ex.series || '0');
          const r = parseInt(ex.reps || '0');
          const w = parseFloat(ex.weight?.replace(',', '.') || '0'); 
          if (s > 0 && r > 0 && w > 0 && ex.category) {
              volumes[ex.category] = (volumes[ex.category] || 0) + (s * r * w);
          }
      });
      if (Object.keys(volumes).length === 0) return;
      try {
          const savedHistory = localStorage.getItem('studentOs_workout_history');
          const history: WorkoutHistoryLog[] = savedHistory ? JSON.parse(savedHistory) : [];
          const filteredHistory = history.filter(log => !(log.date === actionDate && log.dayOfWeek === day));
          
          const newLog: WorkoutHistoryLog = { date: actionDate, dayOfWeek: day, categoryVolumes: volumes };
          localStorage.setItem('studentOs_workout_history', JSON.stringify([...filteredHistory, newLog]));
          
      } catch (e) { console.error("Erro ao gravar histórico", e); }
  }

  const toggleCompleted = (day: string) => {
    const current = workouts[day];
    if (!current || current.exercises.length === 0) return; 
    
    const newCompletedStatus = !current.completed;
    const todayIso = new Date().toISOString().split('T')[0];
    
    if (newCompletedStatus) {
        saveWorkoutVolumeToHistory(day, current.exercises, todayIso);
        setWorkouts({ ...workouts, [day]: { ...current, completed: true, completedAt: todayIso } });
    } else {
        removeWorkoutVolumeFromHistory(day, current.completedAt || todayIso);
        setWorkouts({ ...workouts, [day]: { ...current, completed: false, completedAt: undefined } });
    }
  };

  const handleConfirmHourPicker = () => {
    if (pickerConfig) {
      handleTimeChange(pickerConfig.day, pickerConfig.type, `${pickerConfig.hour}:${pickerConfig.minute}`);
      setPickerConfig(null);
      setTimeout(() => {
        window.dispatchEvent(new Event('syncGymWorkouts'));
      }, 100);
    }
  };
  
  if (!isLoaded) return <div className="animate-pulse bg-card-bg rounded-xl h-64 border border-border-subtle"></div>;

  return (
    <div className="bg-card-bg p-5 rounded-xl shadow-lg border border-border-subtle flex flex-col h-full relative transition-colors duration-300">
      
      <div className="mb-4 shrink-0">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <Dumbbell size={18} className="text-accent transition-colors" />
                <h3 className="text-text-main font-bold text-sm uppercase tracking-wide transition-colors">Plano de Treinos</h3>
            </div>
            
            <div className="hidden sm:flex items-center gap-1.5 bg-app-bg/50 px-3 py-1 rounded-md border border-border-subtle/50 shadow-inner transition-colors">
                <CalendarDays size={14} className="text-text-muted transition-colors" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest transition-colors">{getWeekLabel()}</span>
            </div>
          </div>
          
          <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-1 rounded-md border border-accent/20 shadow-inner transition-colors">
            {completedDays} / {plannedDays}
          </span>
        </div>
        <div className="h-1.5 w-full bg-app-bg/80 rounded-full overflow-hidden border border-border-subtle/50 shadow-inner transition-colors">
          <div className="h-full bg-accent transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
      
      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
        {DAYS.map(day => {
          const dayData = workouts[day] || { time: '', endTime: '', exercises: [], completed: false };
          const isExpanded = expandedDay === day;
          const hasExercises = dayData.exercises.length > 0;
          
          return (
            <div key={day} className={`border rounded-lg overflow-hidden transition-all duration-300 ${dayData.completed ? 'bg-app-bg/20 border-emerald-500/30' : 'bg-app-bg/40 border-border-subtle/50'}`}>
              <div className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isExpanded ? 'bg-border-subtle/30' : 'hover:bg-border-subtle/20'}`} onClick={() => setExpandedDay(isExpanded ? null : day)}>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); toggleCompleted(day); }} disabled={!hasExercises} className={`shrink-0 transition-all ${!hasExercises ? 'text-text-muted/50 cursor-not-allowed' : dayData.completed ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-text-muted hover:text-text-main'}`}>
                    {dayData.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  {isExpanded ? <ChevronDown size={16} className="text-accent shrink-0 transition-colors" /> : <ChevronRight size={16} className="text-text-muted shrink-0 transition-colors" />}
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${dayData.completed ? 'text-text-muted line-through decoration-emerald-500/50' : 'text-text-main'}`}>{day}</span>
                    <span className="text-[10px] text-text-muted font-medium transition-colors">{hasExercises ? `${dayData.exercises.length} exercícios` : 'Descanso'}</span>
                  </div>
                </div>
                
                <div className={`flex items-center text-xs font-bold rounded-md border shadow-inner transition-colors ${dayData.completed ? 'bg-app-bg/50 text-emerald-400/70 border-emerald-500/20' : 'bg-card-bg text-accent border-border-subtle/50'}`}>
                  <button onClick={(e) => { e.stopPropagation(); const [h, m] = dayData.time ? dayData.time.split(':') : ['09', '30']; setPickerConfig({ type: 'start', day, hour: h, minute: m }); }} className="px-2 py-1.5 hover:bg-border-subtle/50 rounded-l-md flex items-center gap-1.5 transition-colors">
                    <Clock size={12} className={dayData.completed ? "text-emerald-500/50" : "text-accent/70"} />
                    {dayData.time || '--:--'}
                  </button>
                  <span className="text-text-muted">-</span>
                  <button onClick={(e) => { e.stopPropagation(); const [h, m] = dayData.endTime ? dayData.endTime.split(':') : (dayData.time ? dayData.time.split(':') : ['10', '30']); setPickerConfig({ type: 'end', day, hour: h, minute: m }); }} className="px-2 py-1.5 hover:bg-border-subtle/50 rounded-r-md transition-colors">
                    {dayData.endTime || '--:--'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-3 bg-app-bg/80 border-t border-border-subtle/50 flex flex-col gap-2 animate-in slide-in-from-top-2 fade-in duration-200 transition-colors">
                  {!hasExercises ? (
                    <p className="text-[10px] text-text-muted italic text-center py-2 transition-colors">Sem exercícios planeados.</p>
                  ) : (
                    <div className="space-y-3 mb-2">
                      {dayData.exercises.map((ex, index) => (
                        <div key={ex.id} className="flex flex-col md:flex-row md:items-center gap-2 group border-b border-border-subtle/50 pb-3 md:pb-0 md:border-0 relative transition-colors">
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-[10px] text-text-muted font-bold w-4 shrink-0 transition-colors">{index + 1}.</span>
                                
                                <button 
                                  onClick={() => setCategoryPicker({ day, exerciseId: ex.id, current: ex.category || 'Peito' })}
                                  disabled={dayData.completed}
                                  className={`shrink-0 w-16 md:w-20 text-[9px] font-black uppercase rounded p-2 text-center border transition-all shadow-inner ${dayData.completed ? 'bg-app-bg/50 text-text-muted border-border-subtle/50' : 'bg-card-bg text-accent border-border-subtle hover:border-accent focus:ring-1 focus:ring-accent'}`}>
                                    {ex.category || 'Peito'}
                                </button>
                                
                                <input type="text" placeholder="Supino..." className={`flex-1 bg-card-bg text-xs outline-none p-2 rounded border transition-colors ${dayData.completed ? 'text-text-muted border-border-subtle/50 line-through' : 'text-text-main border-border-subtle focus:border-accent/50'}`} value={ex.name} onChange={(e) => handleUpdateExerciseField(day, ex.id, 'name', e.target.value)} disabled={dayData.completed} />
                            </div>
                            
                            <div className="flex items-center gap-2 pl-6 md:pl-0 shrink-0">
                                <input type="number" placeholder="Set" className={`w-12 bg-card-bg text-xs outline-none p-2 rounded border transition-colors text-center ${dayData.completed ? 'text-text-muted border-border-subtle/50' : 'text-text-main border-border-subtle focus:border-accent/50'}`} value={ex.series || ''} onChange={(e) => handleUpdateExerciseField(day, ex.id, 'series', e.target.value)} disabled={dayData.completed} />
                                <span className="text-text-muted text-xs font-bold transition-colors">x</span>
                                
                                <input type="number" placeholder="Reps" className={`w-12 bg-card-bg text-xs outline-none p-2 rounded border transition-colors text-center ${dayData.completed ? 'text-text-muted border-border-subtle/50' : 'text-text-main border-border-subtle focus:border-accent/50'}`} value={ex.reps || ''} onChange={(e) => handleUpdateExerciseField(day, ex.id, 'reps', e.target.value)} disabled={dayData.completed} />
                                
                                <span className="text-text-muted text-[10px] font-medium pl-1 transition-colors">@</span>
                                
                                <div className="relative shrink-0 w-20 md:w-24">
                                    <input 
                                      type="text" 
                                      placeholder="00.0" 
                                      className={`w-full bg-card-bg text-xs font-bold outline-none pl-7 pr-2 py-2 rounded border shadow-inner transition-colors ${dayData.completed ? 'text-emerald-400/70 border-emerald-500/20 line-through decoration-emerald-500/50' : 'text-accent border-border-subtle focus:border-accent/50'}`} 
                                      value={ex.weight || ''} 
                                      onChange={(e) => handleUpdateExerciseField(day, ex.id, 'weight', e.target.value)} 
                                      disabled={dayData.completed} 
                                    />
                                    <Scale size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 transition-colors ${dayData.completed ? "text-emerald-500/50" : "text-accent/70"}`} />
                                    <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold transition-colors ${dayData.completed ? 'text-emerald-500/50' : 'text-text-muted'}`}>kg</span>
                                </div>
                                
                                <button onClick={() => handleRemoveExercise(day, ex.id)} disabled={dayData.completed} className="text-text-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-1 disabled:hidden shrink-0 ml-4"><X size={14} /></button>
                            </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!dayData.completed && (
                    <button onClick={() => handleAddExercise(day)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all text-xs font-bold border border-accent/20"><Plus size={14} /> Adicionar Exercício</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {categoryPicker && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setCategoryPicker(null)}>
              <div className="bg-card-bg border border-border-subtle rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                  <div className="bg-app-bg/50 p-4 border-b border-border-subtle text-center relative transition-colors">
                      <Target size={20} className="text-accent absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                      <h3 className="text-text-main font-bold text-lg transition-colors">Grupo Muscular</h3>
                      <button onClick={() => setCategoryPicker(null)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"><X size={18} /></button>
                  </div>
                  <div className="p-5 bg-app-bg/20 grid grid-cols-3 gap-3 transition-colors">
                      {MUSCLE_GROUPS.map(group => (
                          <button 
                            key={group} 
                            onClick={() => {
                                handleUpdateExerciseField(categoryPicker.day, categoryPicker.exerciseId, 'category', group);
                                setCategoryPicker(null);
                            }}
                            className={`p-3 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center border ${categoryPicker.current === group ? 'bg-accent text-white border-accent shadow-lg scale-105' : 'bg-card-bg text-accent border-border-subtle hover:border-accent hover:bg-border-subtle/30 hover:scale-105'}`}
                          >
                              {group}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {pickerConfig && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPickerConfig(null)}>
          <div className="bg-card-bg border border-border-subtle rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors" onClick={e => e.stopPropagation()}>
            <div className="bg-app-bg/50 p-4 border-b border-border-subtle text-center transition-colors">
              <h3 className="text-text-main font-bold text-lg transition-colors">{pickerConfig.type === 'start' ? 'Hora de Início' : 'Hora de Fim'}</h3>
              <p className="text-xs text-accent font-bold uppercase tracking-widest transition-colors">{pickerConfig.day}</p>
            </div>
            <div className="flex justify-center items-center gap-6 p-6 bg-app-bg/20 transition-colors">
              <div className="flex flex-col h-40 w-16 overflow-y-auto custom-scrollbar snap-y snap-mandatory border-y border-border-subtle/50 bg-card-bg rounded-lg shadow-inner transition-colors">
                {HOURS.map(h => (
                  <button key={h} type="button" onClick={() => setPickerConfig({...pickerConfig, hour: h})} className={`h-12 shrink-0 snap-center text-lg font-black transition-all flex items-center justify-center ${pickerConfig.hour === h ? 'text-accent bg-accent/10 border-y border-accent/20 scale-110' : 'text-text-muted hover:text-text-main'}`}>{h}</button>
                ))}
              </div>
              <span className="text-3xl font-black text-text-muted pb-1 transition-colors">:</span>
              <div className="flex flex-col h-40 w-16 overflow-y-auto custom-scrollbar snap-y snap-mandatory border-y border-border-subtle/50 bg-card-bg rounded-lg shadow-inner transition-colors">
                {MINUTES.map(m => (
                  <button key={m} type="button" onClick={() => setPickerConfig({...pickerConfig, minute: m})} className={`h-12 shrink-0 snap-center text-lg font-black transition-all flex items-center justify-center ${pickerConfig.minute === m ? 'text-accent bg-accent/10 border-y border-accent/20 scale-110' : 'text-text-muted hover:text-text-main'}`}>{m}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-app-bg/50 border-t border-border-subtle transition-colors">
              <button onClick={() => setPickerConfig(null)} className="flex-1 bg-card-bg hover:bg-border-subtle text-text-main py-2.5 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
              <button onClick={handleConfirmHourPicker} className="flex-1 bg-accent hover:opacity-90 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all">Confirmar</button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL DE CONFLITO: Mantém o alerta em Vermelho/Rose intencionalmente por semântica de erro */}
      {conflictModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card-bg border border-rose-500/50 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.2)] animate-in zoom-in duration-300 relative transition-colors">
             <button onClick={() => setConflictModal(null)} className="absolute right-4 top-4 text-text-muted hover:text-text-main transition-colors"><X size={18} /></button>
            <div className="flex flex-col items-center text-center">
              <div className="bg-rose-500/20 p-4 rounded-full mb-4 border border-rose-500/30">
                <Dumbbell size={32} className="text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2 transition-colors">Conflito de Horário</h3>
              <p className="text-text-muted text-sm mb-6 leading-relaxed transition-colors">
                Querias agendar um treino para as <span className="text-text-main font-bold">{conflictModal.newEvt.startHour}:{conflictModal.newEvt.startMin.toString().padStart(2, '0')}</span>, mas já tens <span className="text-rose-400 font-bold">&quot;{conflictModal.oldEvt.title}&quot;</span> marcado.
              </p>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('resolveGymConflict', { detail: conflictModal }));
                    setConflictModal(null);
                  }} 
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-900/20 active:scale-95">
                  Substituir Evento
                </button>
                <button 
                  onClick={() => {
                    const reverseDayMap: Record<number, string> = { 
                      1: 'Domingo', 2: 'Segunda', 3: 'Terça', 4: 'Quarta', 5: 'Quinta', 6: 'Sexta', 7: 'Sábado' 
                    };
                    const dayString = reverseDayMap[conflictModal.newEvt.dayOfWeek];
                    
                    if (dayString && workouts[dayString]) {
                      setWorkouts(prev => ({
                        ...prev,
                        [dayString]: {
                          ...prev[dayString],
                          time: '',
                          endTime: ''
                        }
                      }));
                    }
                    setConflictModal(null);
                  }} 
                  className="bg-app-bg hover:bg-border-subtle text-text-main font-medium py-3 rounded-xl transition-all active:scale-95">
                  Cancelar Treino
                </button>
              </div>
            </div>
          </div>
        </div>
      )} 
    </div>
  );
}