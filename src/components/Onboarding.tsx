"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Sparkles, School, User, ImagePlus, CheckCircle2, BookOpen } from 'lucide-react';

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
  const [formData, setFormData] = useState<OnboardingData>({
    name: '', university: '', course: '', age: '', weight: '', height: '', profileImage: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const type1 = useTypewriter(step === 1 ? "Olá! Eu sou o teu novo assistente pessoal." : '', 50);
  const type2 = useTypewriter(type1.isFinished && step === 1 ? "Como te chamas, onde estudas e qual é o teu curso?" : '', 40);

  const type3 = useTypewriter(step === 2 ? `Muito prazer, ${formData.name}.` : '', 50);
  const type4 = useTypewriter(type3.isFinished && step === 2 ? "Para calibrar as tuas rotinas, insere os teus dados:" : '', 40);

  const type5 = useTypewriter(step === 3 ? "Quase lá!" : '', 50);
  const type6 = useTypewriter(type5.isFinished && step === 3 ? "Para o sistema ser 100% teu, escolhe uma foto de perfil ou o teu logótipo." : '', 40);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && formData.name && formData.university && formData.course) setStep(2);
    else if (step === 2 && formData.age && formData.weight && formData.height) setStep(3);
    else if (step === 3) onComplete(formData);
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
    <div className="fixed inset-0 bg-app-bg flex flex-col items-center justify-center p-6 z-[200] font-sans text-text-main transition-colors duration-500">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none transition-colors"></div>

      <div className="w-full max-w-lg relative z-10">
        
        {step === 1 && (
          <form onSubmit={handleNextStep} className="flex flex-col gap-6">
            <div className="flex items-center justify-center w-16 h-16 bg-card-bg rounded-2xl border border-border-subtle mb-2 shadow-2xl animate-in zoom-in duration-500 transition-colors">
              <Sparkles className="text-emerald-400" size={32} />
            </div>
            <div className="space-y-4 min-h-[130px] text-left flex flex-col justify-center">
              <h1 className="text-3xl font-black tracking-tight text-text-main leading-tight transition-colors">{type1.displayedText}{!type1.isFinished && <span className="animate-pulse text-emerald-400">|</span>}</h1>
              <p className="text-text-muted text-lg leading-relaxed min-h-[64px] transition-colors">{type1.isFinished && type2.displayedText}{type1.isFinished && !type2.isFinished && <span className="animate-pulse text-emerald-400">|</span>}</p>
            </div>
            <div className={`space-y-3 transition-all duration-1000 ${type2.isFinished ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <div className="flex items-center bg-card-bg/80 border border-border-subtle px-4 py-3 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 shadow-inner transition-colors">
                 <User className="text-text-muted mr-3 shrink-0 transition-colors" size={20} /><input type="text" autoFocus placeholder="Nome..." className="w-full bg-transparent text-text-main outline-none placeholder:text-text-muted/50" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
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

        {step === 2 && (
          <form onSubmit={handleNextStep} className="flex flex-col gap-6">
            <div className="flex items-center justify-center w-16 h-16 bg-card-bg rounded-2xl border border-border-subtle mb-2 shadow-2xl animate-in zoom-in duration-500 transition-colors">
              <School className="text-blue-400" size={32} />
            </div>
            <div className="space-y-4 min-h-[130px] text-left flex flex-col justify-center">
              <h1 className="text-3xl font-black tracking-tight text-text-main leading-tight transition-colors">{type3.displayedText}{!type3.isFinished && <span className="animate-pulse text-blue-400">|</span>}</h1>
              <p className="text-text-muted text-lg leading-relaxed min-h-[64px] transition-colors">{type3.isFinished && type4.displayedText}{type3.isFinished && !type4.isFinished && <span className="animate-pulse text-blue-400">|</span>}</p>
            </div>
            <div className={`transition-all duration-1000 mt-2 ${type4.isFinished ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
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

        {step === 3 && (
          <form onSubmit={handleNextStep} className="flex flex-col gap-6">
            <div className="flex items-center justify-center w-16 h-16 bg-card-bg rounded-2xl border border-border-subtle mb-2 shadow-2xl animate-in zoom-in duration-500 transition-colors">
              <Sparkles className="text-purple-400" size={32} />
            </div>
            <div className="space-y-4 min-h-[130px] text-left flex flex-col justify-center">
              <h1 className="text-3xl font-black tracking-tight text-text-main leading-tight transition-colors">{type5.displayedText}{!type5.isFinished && <span className="animate-pulse text-purple-400">|</span>}</h1>
              <p className="text-text-muted text-lg leading-relaxed min-h-[64px] transition-colors">{type5.isFinished && type6.displayedText}{type5.isFinished && !type6.isFinished && <span className="animate-pulse text-purple-400">|</span>}</p>
            </div>
            <div className={`transition-all duration-1000 mt-2 ${type6.isFinished ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <div className="flex justify-center mb-6">
                 <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-full border-2 border-dashed border-border-subtle hover:border-purple-500 flex items-center justify-center cursor-pointer overflow-hidden relative group bg-card-bg/50 transition-colors">
                    {formData.profileImage ? (
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