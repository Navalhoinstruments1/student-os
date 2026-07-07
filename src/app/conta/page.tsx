"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Shield, Database, Trash2, LogOut, 
  AlertTriangle, CheckCircle2, ImagePlus, X, Dumbbell, CalendarClock, AlertOctagon,
  User, School, BookOpen, Cloud
} from 'lucide-react';

import ThemeSelector from '@/components/ThemeSelector';
import DriveSyncButton from '@/components/DriveSyncButton';

export default function AccountPage() {
  // O ESCUDO ANTI-CRASH
  const [isMounted, setIsMounted] = useState(false);

  // DADOS DO UTILIZADOR
  const [username, setUsername] = useState('Utilizador');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // O NOVO COCKPIT DE NOTIFICAÇÕES (4 Botões)
  const [notifAll, setNotifAll] = useState(true);
  const [notifGym, setNotifGym] = useState(true);
  const [notifNonFixed, setNotifNonFixed] = useState(true);
  const [notifImportant, setNotifImportant] = useState(true);
  
  // Modais
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // <-- ADICIONA ESTA LINHA

  // Estado Temporário para o Modal de Edição de Perfil
  const [tempData, setTempData] = useState({ name: '', university: '', course: '', age: '', weight: '', height: '' });
  
  const [actionStatus, setActionStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // LEITURA INICIAL BLINDADA
  useEffect(() => {
    try {
      setUsername(localStorage.getItem('studentOs_username') || 'Utilizador');
      setUniversity(localStorage.getItem('studentOs_university') || '');
      setCourse(localStorage.getItem('studentOs_course') || '');
      setAge(localStorage.getItem('studentOs_age') || '');
      setWeight(localStorage.getItem('studentOs_weight') || '');
      setHeight(localStorage.getItem('studentOs_height') || '');
      setProfileImage(localStorage.getItem('studentOs_profileImage'));

      const savedNotifs = localStorage.getItem('studentOs_notifs');
      if (savedNotifs) {
        const parsed = JSON.parse(savedNotifs);
        setNotifAll(parsed.all ?? true);
        setNotifGym(parsed.gym ?? true);
        setNotifNonFixed(parsed.nonFixed ?? true);
        setNotifImportant(parsed.important ?? true);
      }
    } catch (error) {
      console.error("Erro ao ler dados da conta:", error);
    } finally {
      // Indica ao Next.js que a página está pronta para exibir os componentes complexos
      setIsMounted(true);
    }
  }, []);

  // GUARDA NOTIFICAÇÕES (Corrigido para não apagar dados no arranque)
  useEffect(() => {
    if (!isMounted) return; // Se ainda não montou, não guarda nada!
    
    const notifs = { all: notifAll, gym: notifGym, nonFixed: notifNonFixed, important: notifImportant };
    localStorage.setItem('studentOs_notifs', JSON.stringify(notifs));
  }, [notifAll, notifGym, notifNonFixed, notifImportant, isMounted]);

  const handleToggleAll = () => {
    const newState = !notifAll;
    setNotifAll(newState);
    setNotifGym(newState);
    setNotifNonFixed(newState);
    setNotifImportant(newState);
  };

  const handleEditProfileClick = () => {
    setTempData({ name: username, university, course, age, weight, height });
    setShowProfileModal(true);
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempData.name && tempData.name.trim() !== '') {
      
      localStorage.setItem('studentOs_username', tempData.name.trim());
      localStorage.setItem('studentOs_university', tempData.university.trim());
      localStorage.setItem('studentOs_course', tempData.course.trim());
      localStorage.setItem('studentOs_age', tempData.age.trim());
      localStorage.setItem('studentOs_weight', tempData.weight.trim());
      localStorage.setItem('studentOs_height', tempData.height.trim());

      setUsername(tempData.name.trim());
      setUniversity(tempData.university.trim());
      setCourse(tempData.course.trim());
      setAge(tempData.age.trim());
      setWeight(tempData.weight.trim());
      setHeight(tempData.height.trim());

      showStatus('Perfil atualizado com sucesso!', 'success');
      window.dispatchEvent(new Event('userProfileSync'));
    }
    setShowProfileModal(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showStatus('Por favor, escolhe um ficheiro de imagem válido.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            setProfileImage(compressedBase64);
            try {
                localStorage.setItem('studentOs_profileImage', compressedBase64);
                showStatus('Foto atualizada com sucesso!', 'success');
                window.dispatchEvent(new Event('userProfileSync'));
            } catch (err) {
                console.error(err);
                showStatus('Erro: O browser não tem espaço para guardar a imagem.', 'error');
            }
        };
        img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  const handleExportData = () => {
    try {
      const backupData = {
        transactions: JSON.parse(localStorage.getItem('studentOs_transactions') || '[]'),
        workouts: JSON.parse(localStorage.getItem('studentOs_workouts') || '{}'),
        workout_history: JSON.parse(localStorage.getItem('studentOs_workout_history') || '[]'),
        schedule: JSON.parse(localStorage.getItem('studentOs_schedule') || '[]'),
        user_preferences: { 
            username: localStorage.getItem('studentOs_username'),
            university: localStorage.getItem('studentOs_university'),
            course: localStorage.getItem('studentOs_course'),
            notifs: JSON.parse(localStorage.getItem('studentOs_notifs') || '{}')
        },
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student_os_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showStatus('Backup descarregado com sucesso!', 'success');
    } catch (e) {
      console.error(e);
      showStatus('Erro ao exportar os dados.', 'error');
    }
  };

  const handleDeleteAllData = () => {
    // 1. Avisa o componente do Google Drive para destruir o ficheiro na nuvem
    window.dispatchEvent(new Event('deleteDriveFile'));
    
    // 2. Destrói tudo no telemóvel
    localStorage.clear(); 
    sessionStorage.clear();
    setShowDeleteModal(false);
    showStatus('Sistema e Nuvem apagados. A recarregar...', 'success');
    
    setTimeout(() => {
      window.location.href = '/'; 
    }, 1500);
  };

const handleLogoutClick = () => {
    // Apenas abre o modal bonito em vez do aviso do navegador
    setShowLogoutModal(true);
  };

  const executeLogout = () => {
    // Limpa APENAS o telemóvel. O Drive fica intacto!
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const showStatus = (message: string, type: 'success' | 'error') => {
    setActionStatus({ message, type });
    setTimeout(() => setActionStatus(null), 3000);
  };

  // 1. Enquanto não monta, não mostra NADA que possa causar conflitos
  

  return (
    <div className="min-h-screen bg-app-bg text-text-main p-4 md:p-8 animate-in fade-in duration-500 pb-24 w-full transition-colors duration-300">
      
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-sm mb-1">
            A Minha Conta
          </h1>
          <p className="text-text-muted font-medium mt-1">Definições de conta, preferências e gestão de dados locais.</p>
        </div>
      </header>

      {actionStatus && (
        <div className={`fixed top-6 right-6 p-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-right-8 ${actionStatus.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          {actionStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="font-bold text-sm">{actionStatus.message}</span>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg, image/jpg" className="hidden" />

      {/* CARTÃO DE PERFIL */}
      <div className="bg-card-bg border border-border-subtle rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shadow-lg transition-colors duration-300">
        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
          
          <div 
            onClick={triggerFileInput}
            className="relative w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-[0_0_30px_rgba(217,70,239,0.15)] shrink-0 uppercase cursor-pointer group overflow-hidden border-4 border-border-subtle hover:border-purple-500 transition-all bg-app-bg"
          >
            {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-linear-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center">
                    {username.charAt(0)}
                </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 backdrop-blur-xs">
                <ImagePlus size={20} className="text-white" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-white">Alterar</span>
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl font-bold text-text-main mb-2">{username}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              {university && university !== 'Nt' && <span className="text-xs text-text-muted font-bold uppercase tracking-widest bg-app-bg px-2 py-1 rounded border border-border-subtle">{university}</span>}
              {course && <span className="text-xs text-text-muted font-bold uppercase tracking-widest bg-app-bg px-2 py-1 rounded border border-border-subtle">{course}</span>}
            </div>
            <button 
                onClick={handleEditProfileClick}
                className="text-xs font-bold text-text-muted hover:text-accent transition-colors uppercase tracking-widest bg-app-bg px-4 py-2 rounded-lg border border-border-subtle hover:border-accent outline-none"
            >
                Editar Perfil
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <ThemeSelector />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
        
        {/* COLUNA ESQUERDA: PRIVACIDADE & NOTIFICAÇÕES */}
        <div className="flex flex-col">
          <h3 className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2"><Shield size={14} /> Permissões do Sistema</h3>
          <div className="bg-card-bg border border-border-subtle rounded-3xl overflow-hidden shadow-lg flex-1 flex flex-col transition-colors duration-300">
            
            <div className="p-5 flex items-center justify-between border-b border-border-subtle hover:bg-border-subtle/30 transition-colors bg-app-bg/50">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl border transition-colors ${notifAll ? 'bg-purple-500/20 border-purple-500/30' : 'bg-app-bg border-border-subtle'}`}>
                    <Bell size={18} className={notifAll ? 'text-purple-400' : 'text-text-muted'} />
                </div>
                <div>
                  <p className="font-bold text-text-main text-sm">Todas as Notificações</p>
                  <p className="text-[10px] sm:text-xs text-text-muted font-medium mt-0.5">Ativar/Desativar sistema de alertas</p>
                </div>
              </div>
              <button onClick={handleToggleAll} className={`w-12 h-6 rounded-full transition-colors relative shadow-inner shrink-0 ${notifAll ? 'bg-purple-500' : 'bg-app-bg border border-border-subtle'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${notifAll ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className={`flex flex-col transition-all duration-300 overflow-hidden ${notifAll ? 'opacity-100 max-h-[500px]' : 'opacity-50 pointer-events-none'}`}>
                <div className="p-4 pl-8 flex items-center justify-between border-b border-border-subtle hover:bg-border-subtle/30 transition-colors">
                    <div className="flex items-center gap-3"><Dumbbell size={16} className="text-text-muted" /><div><p className="font-bold text-text-main text-xs">Treinos de Ginásio</p><p className="text-[10px] text-text-muted">Alertas de plano diário</p></div></div>
                    <button onClick={() => { setNotifGym(!notifGym); if(!notifAll) setNotifAll(true); }} className={`w-10 h-5 rounded-full transition-colors relative shadow-inner shrink-0 ${notifGym ? 'bg-emerald-500' : 'bg-app-bg border border-border-subtle'}`}><div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${notifGym ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                </div>
                <div className="p-4 pl-8 flex items-center justify-between border-b border-border-subtle hover:bg-border-subtle/30 transition-colors">
                    <div className="flex items-center gap-3"><CalendarClock size={16} className="text-text-muted" /><div><p className="font-bold text-text-main text-xs">Eventos Não Fixos</p><p className="text-[10px] text-text-muted">Aulas extra e reuniões de grupo</p></div></div>
                    <button onClick={() => { setNotifNonFixed(!notifNonFixed); if(!notifAll) setNotifAll(true); }} className={`w-10 h-5 rounded-full transition-colors relative shadow-inner shrink-0 ${notifNonFixed ? 'bg-emerald-500' : 'bg-app-bg border border-border-subtle'}`}><div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${notifNonFixed ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                </div>
                <div className="p-4 pl-8 flex items-center justify-between border-b border-border-subtle hover:bg-border-subtle/30 transition-colors">
                    <div className="flex items-center gap-3"><AlertOctagon size={16} className={notifImportant ? 'text-rose-400' : 'text-text-muted'} /><div><p className={`font-bold text-xs ${notifImportant ? 'text-rose-400' : 'text-text-main'}`}>Eventos Importantes</p><p className="text-[10px] text-text-muted">Testes, Exames e Entregas Finais</p></div></div>
                    <button onClick={() => { setNotifImportant(!notifImportant); if(!notifAll) setNotifAll(true); }} className={`w-10 h-5 rounded-full transition-colors relative shadow-inner shrink-0 ${notifImportant ? 'bg-rose-500' : 'bg-app-bg border border-border-subtle'}`}><div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${notifImportant ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                </div>
            </div>

            <div className="p-5 flex items-center gap-4 hover:bg-border-subtle/30 transition-colors mt-auto">
              <div className="bg-app-bg p-2.5 rounded-xl border border-border-subtle"><Shield size={18} className="text-emerald-400" /></div>
              <div>
                <p className="font-bold text-text-main text-sm">Armazenamento Local</p>
                <p className="text-[10px] sm:text-xs text-text-muted font-medium mt-0.5 leading-relaxed pr-2">Todos os dados e fotos são guardados exclusivamente no teu dispositivo atual. Nenhuma informação é enviada para servidores externos.</p>
              </div>
            </div>

          </div>
        </div>

        {/* COLUNA DIREITA: GESTÃO DE DADOS & CLOUD */}
        <div className="flex flex-col gap-6 md:gap-8">
          
          <div className="flex flex-col">
            <h3 className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2"><Cloud size={14} /> Nuvem</h3>
            <DriveSyncButton />
          </div>

          <div className="flex flex-col">
            <h3 className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2"><Database size={14} /> Base de Dados</h3>
            <div className="bg-card-bg border border-border-subtle rounded-3xl overflow-hidden shadow-lg flex-1 flex flex-col justify-center transition-colors duration-300">
              <button onClick={handleExportData} className="w-full p-5 flex items-center gap-4 border-b border-border-subtle hover:bg-blue-500/10 transition-colors text-left group">
                <div className="bg-app-bg group-hover:bg-blue-500/20 p-2.5 rounded-xl border border-border-subtle group-hover:border-blue-500/30 transition-colors shrink-0"><Database size={18} className="text-blue-400" /></div>
                <div>
                  <p className="font-bold text-text-main text-sm group-hover:text-blue-400 transition-colors">Exportar Dados (Backup)</p>
                  <p className="text-[10px] sm:text-xs text-text-muted font-medium mt-0.5">Descarregar ficheiro .json com o estado atual do sistema.</p>
                </div>
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="w-full p-5 flex items-center gap-4 hover:bg-rose-500/10 transition-colors text-left group">
                <div className="bg-app-bg group-hover:bg-rose-500/20 p-2.5 rounded-xl border border-border-subtle group-hover:border-rose-500/30 transition-colors shrink-0"><Trash2 size={18} className="text-rose-500" /></div>
                <div>
                  <p className="font-bold text-rose-500 text-sm">Formatar Sistema</p>
                  <p className="text-[10px] sm:text-xs text-text-muted font-medium mt-0.5">Apagar todos os dados registados e restaurar valores de fábrica.</p>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="flex justify-center pb-8">
        <button 
          onClick={handleLogoutClick} 
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-rose-400 transition-colors bg-card-bg/50 hover:bg-rose-500/10 px-6 py-3 rounded-xl border border-border-subtle hover:border-rose-500/30"
        >
          <LogOut size={16} /> Encerrar Sessão
        </button>
      </div>

      {/* NOVO MODAL: EDITAR PERFIL COMPLETO */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowProfileModal(false)}>
          <div className="bg-card-bg border border-purple-500/30 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-[0_0_60px_rgba(168,85,247,0.15)] animate-in zoom-in-95 duration-200 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            
            <button onClick={() => setShowProfileModal(false)} className="absolute top-5 right-5 text-text-muted hover:text-text-main transition-colors bg-app-bg p-2 rounded-lg border border-border-subtle hover:border-text-muted outline-none">
              <X size={16} strokeWidth={3} />
            </button>

            <h3 className="font-black text-2xl text-text-main tracking-tight mb-6 mt-2">Editar Perfil</h3>
            
            <form onSubmit={saveProfile} className="flex flex-col gap-4">
              
              <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 mb-1 block">O teu Nome</label>
                    <div className="flex items-center bg-app-bg border border-border-subtle px-4 py-3 rounded-xl focus-within:border-accent transition-colors shadow-inner">
                        <User className="text-text-muted mr-3 shrink-0" size={18} />
                        <input type="text" required className="w-full bg-transparent text-text-main font-bold outline-none" value={tempData.name} onChange={e => setTempData({...tempData, name: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 mb-1 block">Universidade / Escola</label>
                    <div className="flex items-center bg-app-bg border border-border-subtle px-4 py-3 rounded-xl focus-within:border-accent transition-colors shadow-inner">
                        <School className="text-text-muted mr-3 shrink-0" size={18} />
                        <input type="text" className="w-full bg-transparent text-text-main font-bold outline-none" value={tempData.university} onChange={e => setTempData({...tempData, university: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 mb-1 block">Curso</label>
                    <div className="flex items-center bg-app-bg border border-border-subtle px-4 py-3 rounded-xl focus-within:border-accent transition-colors shadow-inner">
                        <BookOpen className="text-text-muted mr-3 shrink-0" size={18} />
                        <input type="text" className="w-full bg-transparent text-text-main font-bold outline-none" value={tempData.course} onChange={e => setTempData({...tempData, course: e.target.value})} />
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-2">
                 <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 block mb-1">Idade</label>
                    <input type="number" className="w-full bg-app-bg border border-border-subtle text-text-main font-bold px-4 py-3.5 rounded-xl text-center outline-none focus:border-accent transition-colors shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={tempData.age} onChange={e => setTempData({...tempData, age: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 block mb-1">Peso (kg)</label>
                    <input type="number" step="0.1" className="w-full bg-app-bg border border-border-subtle text-text-main font-bold px-4 py-3.5 rounded-xl text-center outline-none focus:border-accent transition-colors shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={tempData.weight} onChange={e => setTempData({...tempData, weight: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 block mb-1">Alt. (cm)</label>
                    <input type="number" className="w-full bg-app-bg border border-border-subtle text-text-main font-bold px-4 py-3.5 rounded-xl text-center outline-none focus:border-accent transition-colors shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={tempData.height} onChange={e => setTempData({...tempData, height: e.target.value})} />
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
                <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 order-2 sm:order-1 bg-border-subtle hover:bg-text-muted/20 text-text-main font-bold py-4 rounded-xl transition-all shadow-md active:scale-95">
                  Cancelar
                </button>
                <button type="submit" disabled={!tempData.name} className="flex-1 order-1 sm:order-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-purple-900/30 active:scale-95">
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET (FORMATAR SISTEMA) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-card-bg border border-rose-500/30 rounded-3xl p-6 md:p-10 w-full max-w-lg shadow-[0_0_60px_rgba(244,63,94,0.15)] animate-in zoom-in-95 duration-200 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-[60px] pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600"></div>
            <button onClick={() => setShowDeleteModal(false)} className="absolute top-5 right-5 text-text-muted hover:text-text-main transition-colors bg-app-bg p-2 rounded-lg border border-border-subtle hover:border-text-muted outline-none">
              <X size={16} strokeWidth={3} />
            </button>
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-6">
                 <div className="absolute -inset-2 bg-rose-500/20 rounded-full blur-[20px] pointer-events-none"></div>
                 <div className="relative bg-app-bg border border-rose-500/30 p-5 rounded-3xl shadow-inner">
                    <AlertTriangle size={36} className="text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                 </div>
              </div>
              <h3 className="font-black text-2xl sm:text-3xl text-text-main tracking-tight mb-2">Apagar Sistema Definitivamente?</h3>
              <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-sm">
                Esta ação vai eliminar todo o histórico de treinos, finanças e horários registados neste dispositivo. <strong className="text-rose-400 font-black">Não pode ser desfeita.</strong>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 order-2 sm:order-1 bg-border-subtle hover:bg-text-muted/20 text-text-main font-bold py-4 rounded-xl transition-all shadow-md active:scale-95 active:translate-y-0.5">Cancelar</button>
              <button onClick={handleDeleteAllData} className="flex-1 order-1 sm:order-2 bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-rose-900/30 hover:shadow-rose-900/40 hover:-translate-y-0.5 active:scale-95 active:translate-y-0">Sim, Apagar Tudo</button>
            </div>
          </div>
        </div>
      )}

      {/* NOVO MODAL: ENCERRAR SESSÃO */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowLogoutModal(false)}>
          <div className="bg-card-bg border border-purple-500/30 rounded-3xl p-6 md:p-10 w-full max-w-lg shadow-[0_0_60px_rgba(168,85,247,0.15)] animate-in zoom-in-95 duration-200 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-[60px] pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500"></div>
            
            <button onClick={() => setShowLogoutModal(false)} className="absolute top-5 right-5 text-text-muted hover:text-text-main transition-colors bg-app-bg p-2 rounded-lg border border-border-subtle hover:border-text-muted outline-none">
              <X size={16} strokeWidth={3} />
            </button>
            
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-6">
                 <div className="absolute -inset-2 bg-purple-500/20 rounded-full blur-[20px] pointer-events-none"></div>
                 <div className="relative bg-app-bg border border-purple-500/30 p-5 rounded-3xl shadow-inner">
                    <LogOut size={36} className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                 </div>
              </div>
              <h3 className="font-black text-2xl sm:text-3xl text-text-main tracking-tight mb-2">Encerrar Sessão?</h3>
              <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-sm">
                O teu telemóvel ficará limpo para outra pessoa usar, mas os teus dados continuam <strong className="text-purple-400 font-black">a salvo no teu Google Drive</strong>.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 order-2 sm:order-1 bg-border-subtle hover:bg-text-muted/20 text-text-main font-bold py-4 rounded-xl transition-all shadow-md active:scale-95 active:translate-y-0.5">
                Cancelar
              </button>
              <button onClick={executeLogout} className="flex-1 order-1 sm:order-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/40 hover:-translate-y-0.5 active:scale-95 active:translate-y-0">
                Sim, Encerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}