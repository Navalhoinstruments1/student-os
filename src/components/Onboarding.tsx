"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Sparkles, School, User, ImagePlus, CheckCircle2, BookOpen, Lock, Key, Cloud } from 'lucide-react';
import { driveSync } from '@/services/driveSync';

// ==========================================
// 🔒 BASE DE DADOS LOCAL: 100 UTILIZADORES
// ==========================================
const SYSTEM_ACCOUNTS: Record<string, string> = {
  'USER_001': 'X7K2M9', 'USER_002': 'P4L8Q1', 'USER_003': 'W2N5B8', 'USER_004': 'F9J3R6', 'USER_005': 'C1T7Y4',
  'USER_006': 'H8M2K5', 'USER_007': 'L3Q9P2', 'USER_008': 'V6B4N7', 'USER_009': 'R1J8F5', 'USER_010': 'Y5T2C9',
  'USER_011': 'Z4X7W1', 'USER_012': 'M9K3H6', 'USER_013': 'Q2P8L4', 'USER_014': 'B7N1V9', 'USER_015': 'J5F6R2',
  'USER_016': 'T8Y3C1', 'USER_017': 'X2W9Z5', 'USER_018': 'K6H4M8', 'USER_019': 'P1L7Q3', 'USER_020': 'N9V2B5',
  'USER_021': 'F4R8J1', 'USER_022': 'C7Y5T9', 'USER_023': 'W3Z1X6', 'USER_024': 'H5M9K2', 'USER_025': 'Q8P4L7',
  'USER_026': 'B2N6V3', 'USER_027': 'J9F1R8', 'USER_028': 'T4C7Y2', 'USER_029': 'X5Z3W9', 'USER_030': 'K1M8H4',
  'USER_031': 'P7Q2L6', 'USER_032': 'N3B9V1', 'USER_033': 'R6J5F8', 'USER_034': 'C2T4Y7', 'USER_035': 'Z8W6X3',
  'USER_036': 'M4H1K9', 'USER_037': 'L9P5Q2', 'USER_038': 'V1N8B6', 'USER_039': 'F7R3J5', 'USER_040': 'Y2C9T4',
  'USER_041': 'X6W1Z8', 'USER_042': 'K9M4H3', 'USER_043': 'Q5L7P1', 'USER_044': 'B3V2N9', 'USER_045': 'J8R6F4',
  'USER_046': 'T1Y8C5', 'USER_047': 'Z5X3W2', 'USER_048': 'H2K9M6', 'USER_049': 'P8Q1L4', 'USER_050': 'N6B5V7',
  'USER_051': 'R4F2J9', 'USER_052': 'Y9T7C1', 'USER_053': 'W1Z6X5', 'USER_054': 'M7H3K8', 'USER_055': 'L2P9Q4',
  'USER_056': 'V8N1B3', 'USER_057': 'F3J5R7', 'USER_058': 'C9Y4T2', 'USER_059': 'X4Z8W1', 'USER_060': 'K5M2H9',
  'USER_061': 'Q1L6P8', 'USER_062': 'B9V4N2', 'USER_063': 'J6R1F5', 'USER_064': 'T3C8Y9', 'USER_065': 'Z2W5X7',
  'USER_066': 'H9K4M1', 'USER_067': 'P5Q8L3', 'USER_068': 'N1B7V6', 'USER_069': 'R8F9J2', 'USER_070': 'Y4T1C6',
  'USER_071': 'W7X2Z4', 'USER_072': 'M3H6K5', 'USER_073': 'L8P2Q9', 'USER_074': 'V4N5B1', 'USER_075': 'F1J7R8',
  'USER_076': 'C6Y9T3', 'USER_077': 'X9W4Z2', 'USER_078': 'K2M7H5', 'USER_079': 'Q7L1P4', 'USER_080': 'B5V8N9',
  'USER_081': 'J4F3R6', 'USER_082': 'T9Y5C1', 'USER_083': 'Z1X6W8', 'USER_084': 'H7K2M3', 'USER_085': 'P3Q9L5',
  'USER_086': 'N8B1V4', 'USER_087': 'R2J6F7', 'USER_088': 'Y5T3C9', 'USER_089': 'W6Z4X1', 'USER_090': 'M1H8K2',
  'USER_091': 'L4P5Q7', 'USER_092': 'V9N3B6', 'USER_093': 'F5R1J8', 'USER_094': 'C3Y7T4', 'USER_095': 'X8Z2W9',
  'USER_096': 'K4M9H1', 'USER_097': 'Q6L2P5', 'USER_098': 'B1V7N3', 'USER_099': 'J7F8R4', 'USER_100': 'T2C5Y8'
};

const useTypewriter = (text: string, speed: number = 40) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!text) { setDisplayedText(''); setIsFinished(false); return; }
    let currentText = '';
    let i = 0;
    setIsFinished(false);
    const timer = setInterval(() => {
      if (i < text.length) {
        currentText += text.charAt(i);
        setDisplayedText(currentText);
        i++;
      } else {
        clearInterval(timer);
        setIsFinished(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayedText, isFinished };
};

export interface OnboardingData {
  name: string;
  university: string;
  course: string;
  age: string;
  weight: string;
  height: string;
  profileImage: string | null;
}

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  
  // Login States
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Google Auth State
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const [formData, setFormData] = useState<OnboardingData>({
    name: '', university: '', course: '', age: '', weight: '', height: '', profileImage: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar script do Google no arranque
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // Textos para as animações
  const type1 = useTypewriter(step === 1 ? "Acesso Reservado" : '', 50);
  const type2 = useTypewriter(type1.isFinished && step === 1 ? "Por favor, insere o teu ID e a respetiva senha." : '', 40);

  const type3 = useTypewriter(step === 2 ? "Autenticação Obrigatória" : '', 50);
  const type4 = useTypewriter(type3.isFinished && step === 2 ? "A tua conta tem de ser vinculada ao teu Google Drive para garantirmos total privacidade dos dados." : '', 40);

  const type5 = useTypewriter(step === 3 ? "Acesso Concedido!" : '', 50);
  const type6 = useTypewriter(type5.isFinished && step === 3 ? "Como te chamas, onde estudas e qual é o teu curso?" : '', 40);

  const type7 = useTypewriter(step === 4 ? `Muito prazer, ${formData.name}.` : '', 50);
  const type8 = useTypewriter(type7.isFinished && step === 4 ? "Para calibrar as tuas rotinas, insere os teus dados:" : '', 40);

  const type9 = useTypewriter(step === 5 ? "Quase lá!" : '', 50);
  const type10 = useTypewriter(type9.isFinished && step === 5 ? "Escolhe uma foto de perfil ou o teu logótipo." : '', 40);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de Conta
    if (step === 1) {
      const formattedId = userId.trim().toUpperCase();
      const formattedPass = password.trim().toUpperCase();
      
      if (SYSTEM_ACCOUNTS[formattedId] === formattedPass) {
        setLoginError('');
        setStep(2); // Avança para obrigar o Login Google
      } else {
        setLoginError('Credenciais inválidas. Verifica o teu ID e senha.');
      }
    }
    // O Step 2 avança por si só com a função connectGoogle
    else if (step === 3 && formData.name && formData.university && formData.course) setStep(4);
    else if (step === 4 && formData.age && formData.weight && formData.height) setStep(5);
    else if (step === 5) onComplete(formData);
  };

  const connectGoogle = () => {
    setIsGoogleLoading(true);
    // @ts-expect-error - Google accounts API injetada globalmente pelo script
    if (typeof window === 'undefined' || !window.google?.accounts) {
      alert("Aguarde um momento, os serviços do Google estão a carregar.");
      setIsGoogleLoading(false);
      return;
    }

    try {
      // @ts-expect-error - Inicialização do cliente OAuth do Google
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        scope: 'https://www.googleapis.com/auth/drive.appdata',
        callback: (response: { access_token?: string; error?: string }) => {
          if (response.access_token) {
            driveSync.setToken(response.access_token);
            setIsGoogleLoading(false);
            setStep(3); // Sucesso! Vai preencher os dados
          } else {
            console.error("Erro na autenticação:", response.error);
            alert("A conexão com o Google falhou. Tenta novamente.");
            setIsGoogleLoading(false);
          }
        },
        error_callback: () => {
          alert("Cancelaste o login ou ocorreu um erro.");
          setIsGoogleLoading(false);
        }
      });
      client.requestAccessToken();
    } catch (error) {
      console.error(error);
      setIsGoogleLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 300;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            setFormData({ ...formData, profileImage: canvas.toDataURL('image/jpeg', 0.8) });
        };
        img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-app-bg flex flex-col items-center justify-center p-6 z-200 font-sans text-text-main transition-colors duration-500">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none transition-colors"></div>

      <div className="w-full max-w-lg relative z-10">
        
        {/* PASSO 1: CREDENCIAIS DO SISTEMA */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="flex flex-col gap-6">
            <div className="flex items-center justify-center w-16 h-16 bg-card-bg rounded-2xl border border-border-subtle mb-2 shadow-2xl animate-in zoom-in duration-500 transition-colors">
              <Lock className="text-emerald-400" size={32} />
            </div>
            <div className="space-y-4 min-h-32.5 text-left flex flex-col justify-center">
              <h1 className="text-3xl font-black tracking-tight text-text-main leading-tight transition-colors">{type1.displayedText}{!type1.isFinished && <span className="animate-pulse text-emerald-400">|</span>}</h1>
              <p className="text-text-muted text-lg leading-relaxed min-h-16 transition-colors">{type1.isFinished && type2.displayedText}{type1.isFinished && !type2.isFinished && <span className="animate-pulse text-emerald-400">|</span>}</p>
            </div>
            <div className={`space-y-3 transition-all duration-1000 ${type2.isFinished ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              
              <div className={`flex items-center bg-card-bg/80 border ${loginError ? 'border-rose-500' : 'border-border-subtle'} px-4 py-3 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 shadow-inner transition-colors`}>
                 <User className={`${loginError ? 'text-rose-500' : 'text-text-muted'} mr-3 shrink-0 transition-colors`} size={20} />
                 <input 
                   type="text" 
                   autoFocus 
                   placeholder="User ID (ex: USER_001)" 
                   className="w-full bg-transparent text-text-main outline-none placeholder:text-text-muted/50 uppercase tracking-widest font-bold" 
                   value={userId} 
                   onChange={e => { setUserId(e.target.value); setLoginError(''); }} 
                 />
              </div>

              <div className={`flex items-center bg-card-bg/80 border ${loginError ? 'border-rose-500' : 'border-border-subtle'} px-4 py-3 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 shadow-inner transition-colors`}>
                 <Key className={`${loginError ? 'text-rose-500' : 'text-text-muted'} mr-3 shrink-0 transition-colors`} size={20} />
                 <input 
                   type="password" 
                   placeholder="Senha" 
                   className="w-full bg-transparent text-text-main outline-none placeholder:text-text-muted/50 uppercase tracking-widest font-bold" 
                   value={password} 
                   onChange={e => { setPassword(e.target.value); setLoginError(''); }} 
                 />
              </div>

              {loginError && <p className="text-rose-500 text-xs font-bold pl-2 animate-in slide-in-from-top-1">{loginError}</p>}
              
              <button disabled={!userId || !password} className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-border-subtle disabled:text-text-muted text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all">
                Autenticar <ChevronRight size={20} />
              </button>
            </div>
          </form>
        )}

        {/* PASSO 2: OBRIGAR LIGAÇÃO GOOGLE DRIVE */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-center w-16 h-16 bg-card-bg rounded-2xl border border-border-subtle mb-2 shadow-2xl animate-in zoom-in duration-500 transition-colors">
              <Cloud className="text-blue-400" size={32} />
            </div>
            <div className="space-y-4 min-h-32.5 text-left flex flex-col justify-center">
              <h1 className="text-3xl font-black tracking-tight text-text-main leading-tight transition-colors">{type3.displayedText}{!type3.isFinished && <span className="animate-pulse text-blue-400">|</span>}</h1>
              <p className="text-text-muted text-lg leading-relaxed min-h-16 transition-colors">{type3.isFinished && type4.displayedText}{type3.isFinished && !type4.isFinished && <span className="animate-pulse text-blue-400">|</span>}</p>
            </div>
            <div className={`transition-all duration-1000 mt-2 ${type4.isFinished ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <button 
                onClick={connectGoogle} 
                disabled={isGoogleLoading}
                className="w-full bg-white hover:bg-slate-100 text-black font-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all"
              >
                {/* Ícone simples do Google */}
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {isGoogleLoading ? 'A Conectar...' : 'Ligar com Google Drive'}
              </button>
            </div>
          </div>
        )}

        {/* PASSO 3: NOME E CURSO */}
        {step === 3 && (
          <form onSubmit={handleNextStep} className="flex flex-col gap-6 animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-center w-16 h-16 bg-card-bg rounded-2xl border border-border-subtle mb-2 shadow-2xl animate-in zoom-in duration-500 transition-colors">
              <Sparkles className="text-emerald-400" size={32} />
            </div>
            <div className="space-y-4 min-h-32.5 text-left flex flex-col justify-center">
              <h1 className="text-3xl font-black tracking-tight text-text-main leading-tight transition-colors">{type5.displayedText}{!type5.isFinished && <span className="animate-pulse text-emerald-400">|</span>}</h1>
              <p className="text-text-muted text-lg leading-relaxed min-h-16 transition-colors">{type5.isFinished && type6.displayedText}{type5.isFinished && !type6.isFinished && <span className="animate-pulse text-emerald-400">|</span>}</p>
            </div>
            <div className={`space-y-3 transition-all duration-1000 ${type6.isFinished ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <div className="flex items-center bg-card-bg/80 border border-border-subtle px-4 py-3 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 shadow-inner transition-colors">
                 <User className="text-text-muted mr-3 shrink-0 transition-colors" size={20} />
                 <input 
                   type="text" 
                   autoFocus 
                   placeholder="Nome..." 
                   maxLength={15} 
                   className="w-full bg-transparent text-text-main outline-none placeholder:text-text-muted/50" 
                   value={formData.name} 
                   onChange={e => setFormData({...formData, name: e.target.value})} 
                 />
              </div>
              <div className="flex items-center bg-card-bg/80 border border-border-subtle px-4 py-3 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 shadow-inner transition-colors">
                 <School className="text-text-muted mr-3 shrink-0 transition-colors" size={20} /><input type="text" placeholder="Universidade ou 'Nt'..." className="w-full bg-transparent text-text-main outline-none placeholder:text-text-muted/50" value={formData.university} onChange={e => setFormData({...formData, university: e.target.value})} />
              </div>
              <div className="flex items-center bg-card-bg/80 border border-border-subtle px-4 py-3 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 shadow-inner transition-colors">
                 <BookOpen className="text-text-muted mr-3 shrink-0 transition-colors" size={20} /><input type="text" placeholder="Curso..." className="w-full bg-transparent text-text-main outline-none placeholder:text-text-muted/50" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} />
              </div>
              <button disabled={!formData.name || !formData.university || !formData.course} className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-border-subtle disabled:text-text-muted text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all">Continuar <ChevronRight size={20} /></button>
            </div>
          </form>
        )}

        {/* PASSO 4: IDADE E PESO */}
        {step === 4 && (
          <form onSubmit={handleNextStep} className="flex flex-col gap-6 animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-center w-16 h-16 bg-card-bg rounded-2xl border border-border-subtle mb-2 shadow-2xl animate-in zoom-in duration-500 transition-colors">
              <School className="text-blue-400" size={32} />
            </div>
            <div className="space-y-4 min-h-32.5 text-left flex flex-col justify-center">
              <h1 className="text-3xl font-black tracking-tight text-text-main leading-tight transition-colors">{type7.displayedText}{!type7.isFinished && <span className="animate-pulse text-blue-400">|</span>}</h1>
              <p className="text-text-muted text-lg leading-relaxed min-h-16 transition-colors">{type7.isFinished && type8.displayedText}{type7.isFinished && !type8.isFinished && <span className="animate-pulse text-blue-400">|</span>}</p>
            </div>
            <div className={`transition-all duration-1000 mt-2 ${type8.isFinished ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <div className="grid grid-cols-3 gap-3 mb-4">
                 <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 block mb-1 transition-colors">Idade</label>
                    <input type="number" autoFocus placeholder="Anos" className="w-full bg-card-bg/80 border border-border-subtle text-text-main placeholder:text-text-muted/50 px-4 py-4 rounded-xl text-center outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 block mb-1 transition-colors">Peso</label>
                    <input type="number" step="0.1" placeholder="kg" className="w-full bg-card-bg/80 border border-border-subtle text-text-main placeholder:text-text-muted/50 px-4 py-4 rounded-xl text-center outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 block mb-1 transition-colors">Altura</label>
                    <input type="number" placeholder="cm" className="w-full bg-card-bg/80 border border-border-subtle text-text-main placeholder:text-text-muted/50 px-4 py-4 rounded-xl text-center outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
                 </div>
              </div>
              <button disabled={!formData.age || !formData.weight || !formData.height} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-border-subtle disabled:text-text-muted text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all">Continuar <ChevronRight size={20} /></button>
            </div>
          </form>
        )}

        {/* PASSO 5: FOTO */}
        {step === 5 && (
          <form onSubmit={handleNextStep} className="flex flex-col gap-6 animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-center w-16 h-16 bg-card-bg rounded-2xl border border-border-subtle mb-2 shadow-2xl animate-in zoom-in duration-500 transition-colors">
              <Sparkles className="text-purple-400" size={32} />
            </div>
            <div className="space-y-4 min-h-32.5 text-left flex flex-col justify-center">
              <h1 className="text-3xl font-black tracking-tight text-text-main leading-tight transition-colors">{type9.displayedText}{!type9.isFinished && <span className="animate-pulse text-purple-400">|</span>}</h1>
              <p className="text-text-muted text-lg leading-relaxed min-h-16 transition-colors">{type9.isFinished && type10.displayedText}{type9.isFinished && !type10.isFinished && <span className="animate-pulse text-purple-400">|</span>}</p>
            </div>
            <div className={`transition-all duration-1000 mt-2 ${type10.isFinished ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <div className="flex justify-center mb-6">
                 <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-full border-2 border-dashed border-border-subtle hover:border-purple-500 flex items-center justify-center cursor-pointer overflow-hidden relative group bg-card-bg/50 transition-colors">
                    {formData.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={formData.profileImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center text-text-muted group-hover:text-purple-400 transition-colors">
                            <ImagePlus size={32} />
                            <span className="text-[10px] font-bold mt-2 uppercase">Escolher</span>
                        </div>
                    )}
                 </div>
              </div>
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all">Iniciar Sistema <CheckCircle2 size={20} /></button>
              {!formData.profileImage && (
                  <button type="button" onClick={handleNextStep} className="w-full mt-3 text-text-muted hover:text-text-main text-xs font-bold uppercase tracking-widest transition-colors">Saltar este passo</button>
              )}
            </div>
          </form>
        )}

      </div>
    </div>
  );
}