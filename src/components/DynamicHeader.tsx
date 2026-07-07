"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { School, BookOpen } from 'lucide-react';

interface DynamicHeaderProps {
  time: Date;
  weatherCode: number | null; 
  userName: string;
  university: string; 
  course: string;
  profileImage: string | null; 
}

export default function DynamicHeader({ time, weatherCode, userName, university, course, profileImage }: DynamicHeaderProps) {
  const [greetingText, setGreetingText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const typingIndex = useRef(0); 
  const prevUserName = useRef(userName);

  useEffect(() => {
    // Se o utilizador mudou de nome na página de definições, recomeçamos do zero
    if (prevUserName.current !== userName) {
       typingIndex.current = 0;
       prevUserName.current = userName;
       setTimeout(() => setIsFinished(false), 0);
    }

    if (typingTimer.current) clearInterval(typingTimer.current);

    const hour = new Date().getHours();
    const isNight = hour >= 19 || hour < 6;
    const isMorning = hour >= 6 && hour < 12;

    const cleanName = userName.trim();

    let fullString = "";
    if (isMorning) fullString = `Bom dia, ${cleanName}.`;
    else if (isNight) fullString = `Boa noite, ${cleanName}.`;
    else fullString = `Boa tarde, ${cleanName}.`;

    // Proteção de tamanho e estado
    if (typingIndex.current >= fullString.length) {
        typingIndex.current = fullString.length;
        
        setTimeout(() => {
            setGreetingText(fullString);
            setIsFinished(true);
        }, 0);
        
        return;
    }

    typingTimer.current = setInterval(() => {
      if (typingIndex.current < fullString.length) {
        // Avança na string baseada na memória
        const currentStr = fullString.substring(0, typingIndex.current + 1);
        setGreetingText(currentStr);
        typingIndex.current++;
      } else {
        if (typingTimer.current) clearInterval(typingTimer.current);
        setIsFinished(true);
      }
    }, 40);
    
    return () => { 
      if (typingTimer.current) clearInterval(typingTimer.current); 
    };
  }, [userName, weatherCode]); 

  const hour = time.getHours();
  const isNight = hour >= 18 || hour < 6;
  const isRainingOrSnowing = weatherCode !== null && weatherCode >= 51;

  let gifFilename = "dia-sol.gif"; 
  let altText = "Dia de sol agradável";
  if (isRainingOrSnowing) { gifFilename = "chuva.gif"; altText = "Dia chuvoso"; } 
  else if (isNight) { gifFilename = "lareira.gif"; altText = "Noite aconchegante"; }

  return (
    <header className="w-full h-48 sm:h-56 rounded-3xl overflow-hidden relative bg-slate-800 shadow-lg border border-slate-700 flex flex-col justify-end p-6 md:p-8">
      
      <Image src={`/assets/clima/${gifFilename}`} alt={altText} fill className="object-cover opacity-50 transition-opacity duration-700 z-0" priority />
      <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-900/60 to-transparent pointer-events-none z-10"></div>

      {/* A TUA FOTO DE PERFIL CENTRADA À DIREITA */}
      <div className="absolute top-1/2 -translate-y-1/2 right-6 sm:right-10 z-30">
        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl bg-slate-900 flex items-center justify-center">
          {profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl sm:text-4xl font-black text-white uppercase">{userName.charAt(0)}</span>
          )}
        </div>
      </div> 

      {/* TAGS (Universidade e Curso) NO CANTO INFERIOR DIREITO */}
      <div className="absolute bottom-4 sm:bottom-6 right-6 sm:right-10 z-20 flex flex-row flex-wrap justify-end items-center gap-2 max-w-[70%] animate-in fade-in duration-500">
        {university && university.toLowerCase() !== 'nt' && (
           <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm border border-slate-700 px-3 py-1.5 rounded-lg">
               <School size={12} className="text-emerald-400 shrink-0" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 pr-1 leading-tight">
                 {university}
               </span>
           </div>
        )}
        {course && (
           <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm border border-slate-700 px-3 py-1.5 rounded-lg">
               <BookOpen size={12} className="text-blue-400 shrink-0" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 pr-1 leading-tight">
                 {course}
               </span>
           </div>
        )}
      </div>

      {/* CONTEÚDO DE TEXTO PRINCIPAL (À ESQUERDA) */}
      <div className="relative z-20 flex flex-col gap-1 w-full max-w-5xl pr-28 sm:pr-48">
        <h1 
          className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight drop-shadow-lg leading-tight truncate max-w-[200px] sm:max-w-[400px] md:max-w-none"
          title={greetingText}
        >
          {greetingText}{!isFinished && <span className="animate-pulse text-emerald-400">|</span>}
        </h1>
      </div>
    </header>
  );
}