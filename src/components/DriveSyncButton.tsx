"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Cloud, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { driveSync, AppState } from '@/services/driveSync';

export default function DriveSyncButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isSyncing, setIsSyncing] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. CARREGAR O SCRIPT DA GOOGLE
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  // 2. FUNÇÃO PARA RECOLHER TODOS OS DADOS LOCAIS
  const gatherLocalData = (): AppState => {
    return {
      tasks: JSON.parse(localStorage.getItem('studentOs_tasks') || '[]'),
      meals: JSON.parse(localStorage.getItem('studentOs_meals') || '{}'),
      workouts: JSON.parse(localStorage.getItem('studentOs_workouts') || '{}'),
      grades: JSON.parse(localStorage.getItem('studentOs_grades') || '[]'),
      monthlyGoals: JSON.parse(localStorage.getItem('studentOs_monthly_goals') || '[]'),
      workoutHistory: JSON.parse(localStorage.getItem('studentOs_workout_history') || '[]'),
      transactions: JSON.parse(localStorage.getItem('studentOs_transactions') || '[]'),
      preferences: {
        username: localStorage.getItem('studentOs_username'),
        university: localStorage.getItem('studentOs_university'),
        course: localStorage.getItem('studentOs_course'),
        age: localStorage.getItem('studentOs_age'),
        weight: localStorage.getItem('studentOs_weight'),
        height: localStorage.getItem('studentOs_height'),
        notifs: JSON.parse(localStorage.getItem('studentOs_notifs') || '{}')
      },
      lastUpdated: new Date().toISOString()
    };
  };

  // 3. FUNÇÃO PARA INJETAR DADOS DA NUVEM NO LOCALSTORAGE
  const applyRemoteData = (remoteData: AppState) => {
    if (remoteData.tasks) localStorage.setItem('studentOs_tasks', JSON.stringify(remoteData.tasks));
    if (remoteData.meals) localStorage.setItem('studentOs_meals', JSON.stringify(remoteData.meals));
    if (remoteData.workouts) localStorage.setItem('studentOs_workouts', JSON.stringify(remoteData.workouts));
    if (remoteData.grades) localStorage.setItem('studentOs_grades', JSON.stringify(remoteData.grades));
    if (remoteData.monthlyGoals) localStorage.setItem('studentOs_monthly_goals', JSON.stringify(remoteData.monthlyGoals));
    if (remoteData.workoutHistory) localStorage.setItem('studentOs_workout_history', JSON.stringify(remoteData.workoutHistory));
    if (remoteData.transactions) localStorage.setItem('studentOs_transactions', JSON.stringify(remoteData.transactions));
    
    if (remoteData.preferences) {
      if (remoteData.preferences.username) localStorage.setItem('studentOs_username', remoteData.preferences.username);
      if (remoteData.preferences.university) localStorage.setItem('studentOs_university', remoteData.preferences.university);
      if (remoteData.preferences.course) localStorage.setItem('studentOs_course', remoteData.preferences.course);
      if (remoteData.preferences.age) localStorage.setItem('studentOs_age', remoteData.preferences.age);
      if (remoteData.preferences.weight) localStorage.setItem('studentOs_weight', remoteData.preferences.weight);
      if (remoteData.preferences.height) localStorage.setItem('studentOs_height', remoteData.preferences.height);
      if (remoteData.preferences.notifs) localStorage.setItem('studentOs_notifs', JSON.stringify(remoteData.preferences.notifs));
    }

    // Disparar eventos para que os componentes atualizem o ecrã sem precisar de F5
    window.dispatchEvent(new Event('syncTasks'));
    window.dispatchEvent(new Event('syncGymWorkouts'));
    window.dispatchEvent(new Event('userProfileSync'));
  };

  // 4. O MOTOR INVISÍVEL (PILOTO AUTOMÁTICO)
  const startBackgroundSync = async () => {
    setIsSyncing(true);
    try {
      // Tentar puxar dados existentes
      const remoteData = await driveSync.fetchFromDrive();
      
      if (remoteData && remoteData.lastUpdated) {
        applyRemoteData(remoteData as AppState);
        console.log("Dados descarregados da nuvem com sucesso.");
      } else {
        const localData = gatherLocalData();
        await driveSync.syncToDrive(localData);
        console.log("Primeiro backup criado na nuvem.");
      }

      // Iniciar o loop de gravação a cada 2 minutos (120000 ms)
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = setInterval(async () => {
        setIsSyncing(true);
        try {
          const freshLocalData = gatherLocalData();
          await driveSync.syncToDrive(freshLocalData);
          console.log("Auto-save para a nuvem concluído.");
        } catch (err) {
          console.error("Erro no auto-save:", err);
        } finally {
          setIsSyncing(false);
        }
      }, 120000);

      setStatus('success');
    } catch (err) {
      console.error("Erro no motor de sincronização:", err);
      setStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

 // 5. AUTENTICAÇÃO COM A GOOGLE (Protegida)
  const handleConnect = () => {
    setStatus('loading');
    
    // Proteção: Verifica se o script da Google já teve tempo de carregar
    // @ts-expect-error - window.google é injetado pelo script
    if (typeof window === 'undefined' || !window.google?.accounts) {
      console.error("Script da Google ainda não carregou.");
      setStatus('error');
      alert("Os serviços da Google ainda estão a ligar. Aguarda 2 segundos e tenta de novo!");
      return;
    }

    try {
      // @ts-expect-error - window.google é injetado pelo script
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response: { access_token?: string; error?: string }) => {
          if (response.access_token) {
            driveSync.setToken(response.access_token);
            startBackgroundSync();
          } else {
            console.error("Erro na autenticação:", response.error);
            setStatus('error');
          }
        },
        error_callback: () => {
          setStatus('error');
        }
      });
      
      client.requestAccessToken();
    } catch (error) {
      console.error("Erro ao iniciar o cliente Google:", error);
      setStatus('error');
    }
  };

  return (
    <div className="bg-card-bg p-5 rounded-xl border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors duration-300">
      
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full flex items-center justify-center transition-colors duration-500 relative ${status === 'success' ? 'bg-emerald-500/20 text-emerald-500' : status === 'error' ? 'bg-rose-500/20 text-rose-500' : 'bg-accent/20 text-accent'}`}>
          {status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : 
           status === 'success' ? <CheckCircle2 size={24} /> : 
           status === 'error' ? <AlertCircle size={24} /> : 
           <Cloud size={24} />}
           
           {isSyncing && status === 'success' && (
             <div className="absolute -bottom-1 -right-1 bg-app-bg rounded-full p-0.5">
               <RefreshCw size={12} className="animate-spin text-emerald-500" />
             </div>
           )}
        </div>
        
        <div>
          <h3 className="text-text-main font-bold text-sm transition-colors flex items-center gap-2">
            Sincronização Cloud
            {isSyncing && status === 'success' && <span className="text-[9px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">A Sincronizar...</span>}
          </h3>
          <p className="text-text-muted text-xs transition-colors">
            {status === 'success' ? 'Piloto automático ativado (Drive).' : 
             status === 'error' ? 'Falha ao conectar. Tenta novamente.' : 
             'Guarda e puxa os teus dados automaticamente.'}
          </p>
        </div>
      </div>

      <button 
        onClick={handleConnect}
        disabled={status === 'loading' || status === 'success'}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all w-full sm:w-auto shrink-0 ${
          status === 'success' 
            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
            : 'bg-accent hover:opacity-90 text-white shadow-lg'
        }`}
      >
        {status === 'loading' ? 'A conectar...' : status === 'success' ? 'Ativado' : 'Ativar Piloto Automático'}
      </button>

    </div>
  );
}