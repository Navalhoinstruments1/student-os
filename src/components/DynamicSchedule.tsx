"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Plus, MapPin, Calendar, Clock, X, Trash2, Edit2, Repeat, AlertTriangle, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

export type EventCategory = 'Aula' | 'Estudo' | 'Trabalho' | 'Pessoal' | 'Outro' | 'Teste/Exame' | 'Entr. Trabalho/ Apre.Oral' | 'Ginásio';

export interface ScheduleEvent {
  id: string; title: string; category: EventCategory; location: string;
  date?: string; dayOfWeek: number; isRecurring: boolean;
  startHour: number; startMin: number; endHour: number; endMin: number; color: string;
}

const defaultEvent: Omit<ScheduleEvent, 'id'> = {
  title: '', category: 'Estudo', location: '', date: new Date().toISOString().split('T')[0], 
  dayOfWeek: 1, isRecurring: false, startHour: 9, startMin: 0, endHour: 10, endMin: 30, color: 'bg-blue-600'
};

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

interface DynamicScheduleProps {
  events: ScheduleEvent[];
  setEvents: React.Dispatch<React.SetStateAction<ScheduleEvent[]>>;
}

export default function DynamicSchedule({ events, setEvents }: DynamicScheduleProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false); 
  
  const [conflictModal, setConflictModal] = useState<{ newEvt: Omit<ScheduleEvent, 'id'>; oldEvt: ScheduleEvent } | null>(null);
  
  const [formData, setFormData] = useState<Omit<ScheduleEvent, 'id'>>(defaultEvent);
  const [tempTime, setTempTime] = useState({ sh: '9', sm: '0', eh: '10', em: '30' });

  const [pickerConfig, setPickerConfig] = useState<{ type: 'start' | 'end', hour: string, minute: string } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());

  const eventsRef = useRef(events);
  const hasAutoSynced = useRef(false);
  
  useEffect(() => { eventsRef.current = events; }, [events]);

  const daysOfWeek = ['Domingo','Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600', 'bg-amber-600', 'bg-indigo-600', 'bg-slate-500'];

  const minEventHour = events.length > 0 ? Math.min(...events.map(e => e.startHour)) : 7;
  const maxEventHour = events.length > 0 ? Math.max(...events.map(e => e.endHour)) : 23;
  const minHour = Math.min(7, minEventHour);
  const maxHour = Math.max(23, maxEventHour);
  const hoursRange = Array.from({ length: maxHour - minHour + 2 }, (_, i) => minHour + i);

  const getWeekLabel = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const sunday = new Date(today); sunday.setDate(today.getDate() - currentDay);
    const saturday = new Date(sunday); saturday.setDate(sunday.getDate() + 6);
    const format = (d: Date) => d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
    return `${format(sunday)} - ${format(saturday)}`;
  };

  const getLocalDay = (dateStr?: string) => {
    if (!dateStr) return 1;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).getDay() + 1;
  };

  const startSync = () => {
    const saved = localStorage.getItem('studentOs_workouts');
    if (!saved) return;

    try {
      const workouts = JSON.parse(saved);
      const dayMap: Record<string, number> = { 'Domingo': 1, 'Segunda': 2, 'Terça': 3, 'Quarta': 4, 'Quinta': 5, 'Sexta': 6, 'Sábado': 7 };
      let currentEvents = [...eventsRef.current];
      let madeChanges = false;

      Object.keys(workouts).forEach(day => {
        const data = workouts[day];
        const dayNum = dayMap[day];

        const workoutData = data as { time: string, endTime?: string, exercises: { name: string }[] };

        if (workoutData.time && workoutData.exercises && workoutData.exercises.length > 0) {
          const [h, m] = workoutData.time.split(':').map(Number);
          
          let endH = h + 1;
          let endM = m + 30;
          if (endM >= 60) { endH += Math.floor(endM / 60); endM %= 60; }
          
          if (workoutData.endTime && workoutData.endTime.includes(':')) {
            const [eh, em] = workoutData.endTime.split(':').map(Number);
            endH = eh;
            endM = em;
          }

          const exNames = workoutData.exercises.map(ex => ex.name).filter(Boolean);
          const title = exNames.length > 0 ? `Treino: ${exNames[0]}` : 'Treino de Ginásio';

          const existingGym = currentEvents.find(e => e.category === 'Ginásio' && e.dayOfWeek === dayNum);
          if (existingGym) {
            if (existingGym.startHour !== h || existingGym.startMin !== m || existingGym.endHour !== endH || existingGym.endMin !== endM || existingGym.title !== title) {
              currentEvents = currentEvents.filter(e => e.id !== existingGym.id);
              madeChanges = true;
            } else { return; }
          }

          const newEvt: Omit<ScheduleEvent, 'id'> = {
            title, category: 'Ginásio', location: 'Ginásio', dayOfWeek: dayNum, isRecurring: true,
            startHour: h, startMin: m, endHour: endH, endMin: endM, color: 'bg-rose-500'
          };

          const newStart = newEvt.startHour * 60 + newEvt.startMin;
          const newEnd = newEvt.endHour * 60 + newEvt.endMin;
          let foundConflict = null;

          for (const evt of currentEvents) {
            const evtDay = evt.date ? getLocalDay(evt.date) : evt.dayOfWeek;
            const isSameDay = (evt.isRecurring && newEvt.dayOfWeek === evt.dayOfWeek) || (!evt.isRecurring && newEvt.dayOfWeek === evtDay);
            if (isSameDay) {
              const evtStart = evt.startHour * 60 + evt.startMin;
              const evtEnd = evt.endHour * 60 + evt.endMin;
              if (newStart < evtEnd && newEnd > evtStart) {
                foundConflict = evt; break;
              }
            }
          }

          if (foundConflict) {
            window.dispatchEvent(new CustomEvent('gymConflict', { detail: { newEvt, oldEvt: foundConflict } }));
          } else {
            currentEvents.push({ ...newEvt, id: `gym-${dayNum}-${Date.now()}` });
            madeChanges = true;
          }
        } else {
          const prevLength = currentEvents.length;
          currentEvents = currentEvents.filter(e => !(e.category === 'Ginásio' && e.dayOfWeek === dayNum));
          if (currentEvents.length !== prevLength) madeChanges = true;
        }
      });

      if (madeChanges) setEvents(currentEvents);
    } catch (e) { console.error("Erro ao sincronizar treinos", e); }
  };

  useEffect(() => {
    if (events.length > 0 && !hasAutoSynced.current) {
      setTimeout(() => { startSync(); }, 0);
      hasAutoSynced.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  useEffect(() => {
    const handleGymSync = () => { setTimeout(() => { startSync(); }, 100); };
    window.addEventListener('syncGymWorkouts', handleGymSync);
    return () => window.removeEventListener('syncGymWorkouts', handleGymSync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleResolve = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { newEvt, oldEvt } = customEvent.detail;
      setEvents(prev => {
        let updated = prev.filter(ev => ev.id !== oldEvt.id);
        updated = updated.filter(ev => !(ev.category === 'Ginásio' && ev.dayOfWeek === newEvt.dayOfWeek));
        return [...updated, { ...newEvt, id: `gym-${newEvt.dayOfWeek}-${Date.now()}` }];
      });
    };
    window.addEventListener('resolveGymConflict', handleResolve);
    return () => window.removeEventListener('resolveGymConflict', handleResolve);
  }, [setEvents]);

  const handleOpenNewForm = () => {
    setEditingId(null); setFormData(defaultEvent); setTempTime({ sh: '9', sm: '0', eh: '10', em: '30' }); setShowAdvanced(false); setIsFormOpen(true);
  };

  const handleEditClick = (evt: ScheduleEvent) => {
    setFormData(evt); setEditingId(evt.id); setTempTime({ sh: evt.startHour.toString(), sm: evt.startMin.toString(), eh: evt.endHour.toString(), em: evt.endMin.toString() }); setShowAdvanced(evt.isRecurring); setSelectedEvent(null); setIsFormOpen(true);
  };

  const handleConfirmPicker = () => {
    if (pickerConfig) {
      if (pickerConfig.type === 'start') { setTempTime(prev => ({ ...prev, sh: pickerConfig.hour, sm: pickerConfig.minute })); } 
      else { setTempTime(prev => ({ ...prev, eh: pickerConfig.hour, em: pickerConfig.minute })); }
      setPickerConfig(null);
    }
  };

  const checkTimeConflict = (newEvent: Omit<ScheduleEvent, 'id'>, currentId: string | null) => {
    const newStart = newEvent.startHour * 60 + newEvent.startMin; const newEnd = newEvent.endHour * 60 + newEvent.endMin;
    for (const evt of events) {
      if (evt.id === currentId) continue; 
      const evtDay = evt.date ? getLocalDay(evt.date) : evt.dayOfWeek;
      const newDay = newEvent.date ? getLocalDay(newEvent.date) : newEvent.dayOfWeek;
      const isSameDay = (newEvent.isRecurring && evt.isRecurring && newEvent.dayOfWeek === evt.dayOfWeek) || (!newEvent.isRecurring && !evt.isRecurring && newEvent.date === evt.date) || (newEvent.isRecurring && !evt.isRecurring && newEvent.dayOfWeek === evtDay) || (!newEvent.isRecurring && evt.isRecurring && newDay === evt.dayOfWeek);
      if (isSameDay) {
        const evtStart = evt.startHour * 60 + evt.startMin; const evtEnd = evt.endHour * 60 + evt.endMin;
        if (newStart < evtEnd && newEnd > evtStart) return evt; 
      }
    }
    return null; 
  };

  const executeSave = (finalEvent: Omit<ScheduleEvent, 'id'>, replaceId: string | null = null) => {
    let currentEvents = [...events];
    if (replaceId) currentEvents = currentEvents.filter(evt => evt.id !== replaceId);
    if (editingId) { setEvents(currentEvents.map(evt => evt.id === editingId ? { ...finalEvent, id: editingId } : evt)); } 
    else { setEvents([...currentEvents, { ...finalEvent, id: Date.now().toString() }]); }
    setIsFormOpen(false); setEditingId(null); setConflictModal(null);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const finalEvent: Omit<ScheduleEvent, 'id'> = { 
      ...formData, startHour: parseInt(tempTime.sh) || 0, startMin: parseInt(tempTime.sm) || 0, endHour: parseInt(tempTime.eh) || 0, endMin: parseInt(tempTime.em) || 0
    };
    if (!finalEvent.isRecurring && finalEvent.date) { finalEvent.dayOfWeek = getLocalDay(finalEvent.date); }
    const conflict = checkTimeConflict(finalEvent, editingId);
    if (conflict) { setIsFormOpen(false); setConflictModal({ newEvt: finalEvent, oldEvt: conflict }); } 
    else { executeSave(finalEvent); }
  };

  return (
    <div className="bg-card-bg p-4 rounded-xl shadow border border-border-subtle h-full flex flex-col relative overflow-hidden transition-colors duration-300">
      
      <div className="flex justify-between items-center mb-4 shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-text-main font-bold text-lg flex items-center gap-2">
            <Calendar className="text-accent" size={20} /> O Meu Horário
          </h2>
          <div className="hidden sm:flex items-center gap-1.5 bg-app-bg px-3 py-1 rounded-md border border-border-subtle">
            <CalendarDays size={14} className="text-text-muted" />
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">{getWeekLabel()}</span>
          </div>
        </div>
        <button onClick={handleOpenNewForm} className="bg-accent hover:opacity-90 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all shadow-lg">
          <Plus size={16} /> Novo Evento
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-border-subtle bg-app-bg/50 relative">
        <div className="min-w-175 flex">
          <div className="w-16 shrink-0 border-r border-border-subtle bg-card-bg/90 sticky left-0 z-20">
            <div className="h-10 border-b border-border-subtle"></div> 
            {hoursRange.map(hour => (
              <div key={hour} className="h-24 border-b border-border-subtle/50 relative">
                <span className="absolute -top-3 right-2 text-xs text-text-muted font-mono">{hour}:00</span>
              </div>
            ))}
          </div>

          {daysOfWeek.map((dayName, index) => {
            const dayNum = index + 1;
            const dayEvents = events.filter(e => e.dayOfWeek === dayNum);
            return (
              <div key={dayNum} className="flex-1 border-r border-border-subtle last:border-r-0 relative">
                <div className="h-10 border-b border-border-subtle flex items-center justify-center font-semibold text-sm text-text-main bg-card-bg/90 sticky top-0 z-10">{dayName}</div>
                <div className="relative" style={{ height: `${hoursRange.length * 6}rem` }}>
                  {hoursRange.map(hour => <div key={hour} className="h-24 border-b border-border-subtle/30"></div>)}
                  {dayEvents.map(evt => {
                    const topOffset = ((evt.startHour - minHour) * 6) + ((evt.startMin / 60) * 6);
                    const duration = (evt.endHour + evt.endMin / 60) - (evt.startHour + evt.startMin / 60);
                    return (
                      <div key={evt.id} onClick={() => setSelectedEvent(evt)} className={`absolute left-1.5 right-1.5 rounded-lg p-2 text-white text-xs shadow-lg overflow-hidden ${evt.color} hover:ring-2 hover:ring-white/80 transition-all cursor-pointer group z-10 opacity-90 hover:opacity-100 flex flex-col`} style={{ top: `${topOffset}rem`, height: `${duration * 6}rem` }}>
                        <div className="font-bold truncate text-sm leading-tight mb-1">{evt.title}</div>
                        {evt.location && (
                          <div className="flex items-center gap-1 text-[10px] opacity-90 mb-1 truncate"><MapPin size={10} className="shrink-0" /><span className="truncate">{evt.location}</span></div>
                        )}
                        <div className="flex items-center gap-1 mt-auto opacity-80 text-[10px]"><Clock size={10}/>{evt.startHour}:{evt.startMin.toString().padStart(2, '0')} - {evt.endHour}:{evt.endMin.toString().padStart(2, '0')}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {conflictModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-card-bg border border-amber-500/50 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-500/20 p-4 rounded-full mb-4"><AlertTriangle size={32} className="text-amber-500" /></div>
              <h3 className="text-xl font-bold text-text-main mb-2">Choque de Horário</h3>
              <p className="text-text-muted text-sm mb-6 leading-relaxed">Já existe o evento <span className="text-amber-400 font-bold">&quot;{conflictModal.oldEvt.title}&quot;</span> neste horário.</p>
              <div className="flex flex-col w-full gap-3">
                <button onClick={() => executeSave(conflictModal.newEvt, conflictModal.oldEvt.id)} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-900/20">Substituir Antigo</button>
                <button onClick={() => executeSave(conflictModal.newEvt)} className="bg-border-subtle hover:bg-text-muted/20 text-text-main font-medium py-3 rounded-xl transition-all">Manter Ambos</button>
                <button onClick={() => { setConflictModal(null); setIsFormOpen(true); }} className="text-text-muted hover:text-text-main text-sm pt-2">Voltar ao Formulário</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEvent} className="bg-card-bg border border-border-subtle rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto relative transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-text-main flex items-center gap-2">{editingId ? <Edit2 size={20} className="text-blue-400"/> : <Plus size={20} className="text-emerald-400"/>}{editingId ? 'Editar Evento' : 'Novo Evento'}</h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-text-muted hover:text-text-main bg-app-bg p-1.5 rounded-full"><X size={18} /></button>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-text-muted font-semibold mb-1 block uppercase tracking-wider">Atividade</label>
                  <input type="text" placeholder="Ex: Estudar..." required className="bg-app-bg text-text-main px-4 py-2.5 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-accent border border-border-subtle" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="w-1/3">
                  <label className="text-xs text-text-muted font-semibold mb-1 block uppercase tracking-wider">Tipo</label>
                  <select className="bg-app-bg text-text-main px-3 py-2.5 rounded-lg text-sm w-full outline-none border border-border-subtle focus:ring-2 focus:ring-accent" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as EventCategory})}>
                    <option value="Estudo">Estudo</option><option value="Aula">Aula</option><option value="Teste/Exame">Teste/Exame</option><option value="Entr. Trabalho/ Apre.Oral">Entr. Trabalho/ Apre.Oral</option><option value="Pessoal">Pessoal</option><option value="Ginásio">Ginásio</option>
                  </select>
                </div>
              </div>

              <div className="bg-app-bg p-4 rounded-xl border border-border-subtle">
                {!showAdvanced ? (
                  <div>
                    <label className="text-xs text-text-muted font-semibold mb-1 block uppercase">Quando?</label>
                    <button type="button" onClick={() => { setPickerMonth(formData.date ? new Date(formData.date) : new Date()); setShowDatePicker(true); }} className="w-full bg-app-bg text-left text-text-main px-4 py-2.5 rounded-lg text-sm outline-none border border-border-subtle hover:border-accent transition-colors shadow-inner flex justify-between items-center">
                      <span>{formData.date ? new Date(formData.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Selecionar data'}</span>
                      <Calendar size={16} className="text-accent" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-emerald-400 font-semibold mb-1 flex items-center gap-1 uppercase tracking-wider"><Repeat size={12}/> Fixo Semanal</label>
                    <select className="bg-app-bg text-text-main px-4 py-2.5 rounded-lg text-sm w-full outline-none border border-border-subtle focus:ring-2 focus:ring-accent" value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: Number(e.target.value), isRecurring: true})}>
                      {daysOfWeek.map((d, i) => <option key={i} value={i+1}>Todas as {d}s</option>)}
                    </select>
                  </div>
                )}
                <button type="button" onClick={() => { setShowAdvanced(!showAdvanced); setFormData({...formData, isRecurring: !showAdvanced}); }} className="text-xs text-accent mt-3 font-medium hover:underline">
                  {showAdvanced ? "← Voltar a evento único" : "⚙️ Tornar este evento fixo"}
                </button>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-text-muted font-semibold mb-1 flex uppercase items-center gap-1"><Clock size={12}/> Início</label>
                  <button type="button" onClick={() => setPickerConfig({ type: 'start', hour: tempTime.sh.padStart(2, '0'), minute: tempTime.sm.padStart(2, '0') })} className="w-full bg-app-bg text-text-main px-4 py-3 rounded-lg text-lg font-bold outline-none border border-border-subtle hover:border-accent transition-colors shadow-inner flex items-center justify-center gap-1">
                    {tempTime.sh.padStart(2, '0')} <span className="text-text-muted pb-1">:</span> {tempTime.sm.padStart(2, '0')}
                  </button>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-text-muted font-semibold mb-1 flex uppercase items-center gap-1"><Clock size={12}/> Fim</label>
                  <button type="button" onClick={() => setPickerConfig({ type: 'end', hour: tempTime.eh.padStart(2, '0'), minute: tempTime.em.padStart(2, '0') })} className="w-full bg-app-bg text-text-main px-4 py-3 rounded-lg text-lg font-bold outline-none border border-border-subtle hover:border-accent transition-colors shadow-inner flex items-center justify-center gap-1">
                    {tempTime.eh.padStart(2, '0')} <span className="text-text-muted pb-1">:</span> {tempTime.em.padStart(2, '0')}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 items-end pt-2">
                <div className="flex-1">
                  <label className="text-xs text-text-muted font-semibold mb-1 flex uppercase items-center gap-1"><MapPin size={12}/> Local</label>
                  <input type="text" placeholder="Opcional" className="bg-app-bg text-text-main px-4 py-2.5 rounded-lg text-sm w-full outline-none border border-border-subtle focus:ring-2 focus:ring-accent" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
                <div className="flex gap-1.5 bg-app-bg p-2.5 rounded-lg border border-border-subtle">
                  {colors.map(c => (
                    <button type="button" key={c} onClick={() => setFormData({...formData, color: c})} className={`w-6 h-6 rounded-full ${c} border border-text-muted/30 transition-all ${formData.color === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100 shadow-inner'}`} />
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-accent hover:opacity-90 text-white font-bold py-3.5 rounded-xl mt-6 transition-all shadow-lg">
                {editingId ? 'Guardar Alterações' : 'Adicionar Evento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-card-bg border border-border-subtle rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className={`${selectedEvent.color} p-5 flex justify-between items-start text-white`}>
              <div>
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{selectedEvent.category}</span>
                <h3 className="font-bold text-xl mt-1 leading-tight">{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="bg-black/20 rounded-full p-1.5 hover:bg-black/40"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 text-text-main">
                <Clock className="text-accent shrink-0" size={18} />
                <span className="text-sm font-medium">{selectedEvent.startHour}:{selectedEvent.startMin.toString().padStart(2, '0')} — {selectedEvent.endHour}:{selectedEvent.endMin.toString().padStart(2, '0')}</span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-start gap-3 text-text-main">
                  <MapPin className="text-rose-400 shrink-0" size={18} />
                  <span className="text-sm">{selectedEvent.location}</span>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-border-subtle">
                <button onClick={() => handleEditClick(selectedEvent)} className="flex-1 bg-border-subtle hover:bg-text-muted/20 text-text-main py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"><Edit2 size={16}/> Editar</button>
                <button onClick={() => { setEvents(events.filter(e => e.id !== selectedEvent.id)); setSelectedEvent(null); }} className="flex-1 bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"><Trash2 size={16}/> Apagar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pickerConfig && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPickerConfig(null)}>
          <div className="bg-card-bg border border-border-subtle rounded-2xl w-full max-w-xs shadow-[0_0_40px_rgba(59,130,246,0.15)] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-app-bg/50 p-4 border-b border-border-subtle text-center">
              <h3 className="text-text-main font-bold text-lg">{pickerConfig.type === 'start' ? 'Hora de Início' : 'Hora de Fim'}</h3>
            </div>
            <div className="flex justify-center items-center gap-6 p-6 bg-app-bg/20">
              <div className="flex flex-col h-40 w-16 overflow-y-auto custom-scrollbar snap-y snap-mandatory border-y border-border-subtle/50 bg-app-bg rounded-lg shadow-inner">
                {HOURS.map(h => (
                  <button key={h} type="button" onClick={() => setPickerConfig({...pickerConfig, hour: h})} className={`h-12 shrink-0 snap-center text-lg font-black transition-all flex items-center justify-center ${pickerConfig.hour === h ? 'text-accent bg-accent/10 border-y border-accent/20 scale-110' : 'text-text-muted hover:text-text-main'}`}>{h}</button>
                ))}
              </div>
              <span className="text-3xl font-black text-text-muted pb-1">:</span>
              <div className="flex flex-col h-40 w-16 overflow-y-auto custom-scrollbar snap-y snap-mandatory border-y border-border-subtle/50 bg-app-bg rounded-lg shadow-inner">
                {MINUTES.map(m => (
                  <button key={m} type="button" onClick={() => setPickerConfig({...pickerConfig, minute: m})} className={`h-12 shrink-0 snap-center text-lg font-black transition-all flex items-center justify-center ${pickerConfig.minute === m ? 'text-accent bg-accent/10 border-y border-accent/20 scale-110' : 'text-text-muted hover:text-text-main'}`}>{m}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-app-bg/50 border-t border-border-subtle">
              <button onClick={() => setPickerConfig(null)} className="flex-1 bg-border-subtle hover:bg-text-muted/20 text-text-main py-2.5 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
              <button onClick={handleConfirmPicker} className="flex-1 bg-accent hover:opacity-90 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {showDatePicker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowDatePicker(false)}>
          <div className="bg-card-bg border border-border-subtle rounded-2xl w-full max-w-[280px] shadow-[0_0_40px_rgba(59,130,246,0.15)] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-app-bg/50">
              <button type="button" onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))} className="p-1.5 text-text-muted hover:text-text-main hover:bg-border-subtle rounded-md transition-colors"><ChevronLeft size={18} /></button>
              <span className="font-bold text-text-main capitalize">{pickerMonth.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}</span>
              <button type="button" onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))} className="p-1.5 text-text-muted hover:text-text-main hover:bg-border-subtle rounded-md transition-colors"><ChevronRight size={18} /></button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (<span key={i} className="text-[10px] font-bold text-text-muted">{d}</span>))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1).getDay() }).map((_, i) => (<div key={`empty-${i}`} />))}
                {Array.from({ length: new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                  const day = i + 1;
                  const currentDateStr = `${pickerMonth.getFullYear()}-${(pickerMonth.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const isSelected = formData.date === currentDateStr;
                  const isToday = new Date().toISOString().split('T')[0] === currentDateStr;
                  return (
                    <button key={day} type="button" onClick={() => { setFormData({ ...formData, date: currentDateStr, isRecurring: false }); setShowDatePicker(false); }} className={`h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition-all ${isSelected ? 'bg-accent text-white shadow-md scale-110' : isToday ? 'text-accent font-bold border border-accent/30' : 'text-text-main hover:bg-border-subtle'}`}>{day}</button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}