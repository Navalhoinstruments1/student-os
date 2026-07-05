"use client"; 

import React, { useState, useEffect } from 'react';
import ClockAndTimer from '@/components/ClockAndTimer';
import WeatherWidget from '@/components/WeatherWidget';
import DynamicHeader from '@/components/DynamicHeader'; 
import SpotifyWidget from '@/components/SpotifyWidget';
import DynamicSchedule, { ScheduleEvent } from '@/components/DynamicSchedule';
import TasksWidget, { Task } from '@/components/TasksWidget';
import Onboarding, { OnboardingData } from '@/components/Onboarding'; 
import GradeCalculator from '@/components/GradeCalculator'; 
import MonthlyGoals from '@/components/MonthlyGoals';
import WeeklyMeals from '@/components/WeeklyMeals';
import WeeklyWorkouts from '@/components/WeeklyWorkouts';
import { Bell, Quote, Sparkles, Plus, Target, ListTodo, GraduationCap, Dumbbell, Coffee, CalendarRange, CloudSun } from 'lucide-react';

type NavItem = { id: string; label: string; icon: React.ReactNode };

const baseNavItems: NavItem[] = [
  { id: 'metas', label: 'Metas', icon: <Target size={14} /> },
  { id: 'tarefas', label: 'Tarefas', icon: <ListTodo size={14} /> },
  { id: 'notas', label: 'Notas', icon: <GraduationCap size={14} /> },
  { id: 'gym', label: 'Gym', icon: <Dumbbell size={14} /> },
  { id: 'rotina', label: 'Refeições', icon: <Coffee size={14} /> },
  { id: 'horario', label: 'Horário', icon: <CalendarRange size={14} /> },
  { id: 'som', label: 'Clima & Som', icon: <CloudSun size={14} /> },
];

const ELITE_QUOTES = [
  "Um dia de cada vez. Foco no processo.",
  "O suor de hoje é o sucesso de amanhã.",
  "A consistência bate o talento.",
  "Estuda como se não houvesse amanhã."
];

export default function Dashboard() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(false); 
  
  const [userName, setUserName] = useState<string | null>(null);
  const [userUniversity, setUserUniversity] = useState('');
  const [userCourse, setUserCourse] = useState('');
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [customQuotes, setCustomQuotes] = useState<string[]>([]);
  
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navClicks, setNavClicks] = useState<Record<string, number>>({});

  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [newQuoteText, setNewQuoteText] = useState('');
  
  const [todayStr, setTodayStr] = useState('');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [currentWeatherCode, setCurrentWeatherCode] = useState<number | null>(null);

  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadUserData = () => {
    const storedName = localStorage.getItem('studentOs_username');
    if (storedName) {
        setUserName(storedName);
        setUserUniversity(localStorage.getItem('studentOs_university') || '');
        setUserCourse(localStorage.getItem('studentOs_course') || '');
        setUserProfileImage(localStorage.getItem('studentOs_profileImage'));
        return true;
    }
    return false;
  };

  // 1. PRIMEIRO USE EFFECT (Protegido contra novos dispositivos)
  useEffect(() => {
    setTimeout(() => {
      try {
        const today = new Date().toISOString().split('T')[0];
        setTodayStr(today);
        setCurrentTime(new Date());

        setScheduleEvents([{ id: '1', title: 'Álgebra Linear', category: 'Aula', location: 'Anfiteatro 2', dayOfWeek: 1, isRecurring: true, startHour: 9, startMin: 30, endHour: 11, endMin: 0, color: 'bg-blue-600' }]);
        setTasks([{ id: '101', text: 'Ler capítulo 4 de Sistemas', date: today, completed: false, isRecurring: false }]);

        const storedNavClicks = localStorage.getItem('smartNavClicks');
        if (storedNavClicks) {
          try { setNavClicks(JSON.parse(storedNavClicks)); } catch (e) { console.error(e); }
        }

        const storedCustomQuotes = localStorage.getItem('studentOs_customQuotes');
        if (storedCustomQuotes) {
          try { setCustomQuotes(JSON.parse(storedCustomQuotes)); } catch (e) { console.error(e); }
        }

        const userExists = loadUserData();

        if (userExists) {
          const hasSeen = sessionStorage.getItem('studentOs_hasSeenSplash');
          if (!hasSeen) {
              setShowSplash(true);
              sessionStorage.setItem('studentOs_hasSeenSplash', 'true');
              setTimeout(() => setShowSplash(false), 1800);
          } else {
              setShowSplash(false);
          }
        }
      } catch (error) {
        console.error("Erro na leitura inicial do sistema:", error);
      } finally {
        // Esta é a linha mágica. Aconteça o que acontecer, a app arranca!
        setIsLoaded(true);
      }
    }, 0);

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const quoteTimer = setInterval(() => setQuoteIndex(prev => prev + 1), 10000);

    return () => { clearInterval(timer); clearInterval(quoteTimer); };
  }, []);

  // 2. SEGUNDO USE EFFECT (Mantém-se igual)
  useEffect(() => {
    const handleSync = () => loadUserData();
    window.addEventListener('userProfileSync', handleSync);
    return () => window.removeEventListener('userProfileSync', handleSync);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY && currentScrollY > 60) setShowNav(false);
    else setShowNav(true);
    setLastScrollY(currentScrollY);
  };

  const handleNavClick = (id: string) => {
    const newClicks = { ...navClicks, [id]: (navClicks[id] || 0) + 1 };
    setNavClicks(newClicks);
    localStorage.setItem('smartNavClicks', JSON.stringify(newClicks));
  };

  const sortedNavItems = [...baseNavItems].sort((a, b) => (navClicks[b.id] || 0) - (navClicks[a.id] || 0));

  const handleOnboardingComplete = (data: OnboardingData) => {
    localStorage.setItem('studentOs_username', data.name);
    localStorage.setItem('studentOs_university', data.university); 
    localStorage.setItem('studentOs_course', data.course); 
    localStorage.setItem('studentOs_age', data.age);
    localStorage.setItem('studentOs_weight', data.weight);
    localStorage.setItem('studentOs_height', data.height);
    if (data.profileImage) localStorage.setItem('studentOs_profileImage', data.profileImage);
    
    setUserName(data.name);
    setUserUniversity(data.university);
    setUserCourse(data.course);
    setUserProfileImage(data.profileImage);
  };

  const saveNewQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteText.trim()) return;
    const updatedQuotes = [...customQuotes, newQuoteText];
    setCustomQuotes(updatedQuotes);
    localStorage.setItem('studentOs_customQuotes', JSON.stringify(updatedQuotes));
    setNewQuoteText('');
    setIsAddingQuote(false);
  };

  const getMotivationQuote = () => {
    const pool = customQuotes.length > 0 ? customQuotes : ELITE_QUOTES;
    return pool[quoteIndex % pool.length]; 
  };

  if (!isLoaded || !currentTime) {
      return <div className="h-screen bg-app-bg flex items-center justify-center transition-colors duration-300"></div>;
  }

  if (showSplash && userName) {
      return (
        <div className="fixed inset-0 z-300 bg-app-bg flex flex-col items-center justify-center animate-out fade-out duration-1000 delay-500 fill-mode-forwards transition-colors duration-300">
             <div className="flex items-center justify-center w-24 h-24 bg-card-bg rounded-3xl border border-border-subtle shadow-[0_0_50px_var(--color-accent)] mb-6 animate-pulse opacity-50">
                <Sparkles className="text-accent" size={40} />
             </div>
             <h1 className="text-2xl font-black text-text-main tracking-widest uppercase">Student OS</h1>
             <p className="text-xs text-accent font-bold uppercase tracking-widest mt-2 animate-pulse">A iniciar sistema...</p>
        </div>
      );
  }

  if (!userName) return <Onboarding onComplete={handleOnboardingComplete} />;

  const todayTasks = tasks.filter(t => t.date === todayStr);
  const progressPercent = todayTasks.length === 0 ? 0 : Math.round((todayTasks.filter(t => t.completed).length / todayTasks.length) * 100);
  const upcomingAlerts = scheduleEvents.filter(e => e.category === 'Teste/Exame' || e.category === 'Entr. Trabalho/ Apre.Oral');

  return (
    <div onScroll={handleScroll} className="w-full min-h-full bg-app-bg text-text-main p-4 flex flex-col gap-4 font-sans overflow-y-auto custom-scrollbar relative scroll-smooth transition-colors duration-300">
      <div className="w-full shrink-0 flex flex-col gap-2">
         <DynamicHeader time={currentTime} weatherCode={currentWeatherCode} userName={userName} university={userUniversity} course={userCourse} profileImage={userProfileImage} />
      </div>

      <nav className={`md:hidden sticky top-0 z-40 bg-app-bg/95 backdrop-blur-md border-b border-border-subtle py-4 -mx-4 px-4 flex items-center gap-3 overflow-x-auto custom-scrollbar shadow-lg shrink-0 min-h-17.5 transition-transform duration-300 ease-in-out ${showNav ? 'translate-y-0' : '-translate-y-full'}`}>
        {sortedNavItems.map(item => (
          <a key={item.id} href={`#${item.id}`} onClick={() => handleNavClick(item.id)} className="shrink-0 bg-card-bg hover:bg-border-subtle text-text-main px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest border border-border-subtle transition-colors flex items-center gap-1.5">
            <span className="text-accent">{item.icon}</span>{item.label}
          </a>
        ))}
      </nav>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-4 shrink-0 mt-2">
        <aside id="metas" className="col-span-1 flex flex-col gap-4 scroll-mt-20">
          {/* Cartão Citação atualizado para usar accent */}
          <div className="bg-linear-to-br from-accent/20 to-card-bg p-5 rounded-xl shadow border border-accent/20 shrink-0 relative overflow-hidden group transition-colors duration-300">
            <Quote className="absolute -top-2 -left-2 text-accent/10 rotate-180" size={64} />
            <div className="flex justify-between items-start mb-2 relative z-10">
              <h3 className="text-accent font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide"><Sparkles size={14} /> Mensagem</h3>
              <button onClick={() => setIsAddingQuote(!isAddingQuote)} className="text-text-muted hover:text-accent transition-colors"><Plus size={16} /></button>
            </div>
            {isAddingQuote ? (
              <form onSubmit={saveNewQuote} className="relative z-10 animate-in fade-in slide-in-from-top-2">
                <input type="text" autoFocus placeholder="Nova frase..." className="w-full bg-app-bg/50 text-text-main text-xs px-3 py-2 rounded border border-border-subtle outline-none focus:border-accent" value={newQuoteText} onChange={e => setNewQuoteText(e.target.value)} />
              </form>
            ) : (
              <p className="text-text-main font-medium text-sm italic relative z-10 leading-relaxed transition-all duration-500">&quot;{getMotivationQuote()}&quot;</p>
            )}
          </div>
          
          <div className="bg-card-bg p-4 rounded-xl shadow shrink-0 border border-border-subtle flex flex-col transition-colors duration-300">
            <MonthlyGoals />
            <div className="bg-app-bg/50 p-3 rounded-lg flex items-center justify-between mb-2 border border-border-subtle">
              <span className="text-xs text-text-muted font-medium uppercase">Por cumprir</span>
              <span className={`text-xl font-black ${todayTasks.filter(t=>!t.completed).length > 0 ? 'text-blue-400' : 'text-accent'}`}>{todayTasks.filter(t=>!t.completed).length}</span>
            </div>
            <div className="w-full bg-app-bg rounded-full h-2.5 mt-2"><div className="bg-accent h-2.5 rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }}></div></div>
            <p className="text-[10px] text-right mt-1 text-text-muted">{progressPercent}% Concluído</p>
          </div>
          
          <div className="bg-card-bg p-4 rounded-xl shadow shrink-0 border border-border-subtle flex-1 max-h-62.5 flex flex-col transition-colors duration-300">
            <h3 className="text-text-main font-bold text-sm flex items-center gap-2 mb-3 uppercase tracking-wide shrink-0"><Bell size={16} className="text-rose-400" /> Alertas Importantes</h3>
            {upcomingAlerts.length === 0 ? <p className="text-xs text-text-muted italic">Nenhum alerta pendente.</p> : (
              <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 flex-1">
                {upcomingAlerts.map(alert => (
                  <div key={alert.id} className="bg-app-bg/60 p-2.5 rounded-lg border border-border-subtle">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-text-main truncate pr-2">{alert.title}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${alert.category === 'Teste/Exame' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>{alert.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="col-span-1 lg:col-span-2 flex flex-col gap-4">
          <div id="tarefas" className="flex-1 min-h-87.5 scroll-mt-20"><TasksWidget tasks={tasks} setTasks={setTasks} /></div>
          <div id="notas" className="scroll-mt-20"><GradeCalculator /></div>
        </section>

        <aside id="som" className="col-span-1 flex flex-col gap-4 scroll-mt-20">
          <ClockAndTimer currentTime={currentTime} />
          <div className="h-32 shrink-0"><WeatherWidget onWeatherCodeChange={setCurrentWeatherCode} /></div>
          <SpotifyWidget />
       </aside>
      </main>

      <section className="w-full mt-4 shrink-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div id="rotina" className="scroll-mt-20"><WeeklyMeals /></div><div id="gym" className="scroll-mt-20"><WeeklyWorkouts /></div></div>
      </section>

      <section id="horario" className="w-full min-h-150 mt-2 shrink-0 pb-8 scroll-mt-20"><DynamicSchedule events={scheduleEvents} setEvents={setScheduleEvents} /></section>
    </div>
  );
}