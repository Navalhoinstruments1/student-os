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

    // Limpa espaços acidentais, corta o nome pelos espaços, e apanha apenas a 1ª palavra (posição 0)
    const cleanName = userName.trim().split(' ')[0];

    let fullString = "";
    if (isMorning) fullString = `BOM DIA ${cleanName}`;
    else if (isNight) fullString = `BOA NOITE ${cleanName}`;
    else fullString = `BOA TARDE, ${cleanName}`;

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
    <header className="w-full h-100 rounded-3xl overflow-hidden relative bg-slate-800 shadow-lg border border-slate-700 flex flex-col justify-between py-6 md:py-8 px-4 sm:px-8">
      
      {/* BACKGROUNDS */}
      <Image src={`/assets/clima/${gifFilename}`} alt={altText} fill className="object-cover opacity-50 transition-opacity duration-700 z-0" priority />
      <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-900/60 to-transparent pointer-events-none z-10"></div>

      {/* TOPO: EMBLEMA DA UNIVERSIDADE */}
      <div className="relative z-20 w-full flex justify-center">
        {university && university.toLowerCase() !== 'nt' && (
           <div className="flex items-center gap-1.5 bg-slate-900/50 backdrop-blur-md border border-slate-500/30 px-3 py-1.5 rounded-full shadow-sm">
               <School size={14} className="text-emerald-400 shrink-0" />
               <span className="text-[9px] sm:text-[10px] text-center font-bold uppercase tracking-widest text-slate-200">
                 {university}
               </span>
           </div>
        )}
      </div>

      {/* MEIO: FOTO DE PERFIL + CURSO (BADGE SOBREPOSTA) */}
      <div className="relative z-20 flex flex-col items-center justify-center">
        <div className="relative">
          {/* Avatar Container */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl bg-slate-900 flex items-center justify-center">
            {profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl sm:text-4xl font-black text-white uppercase">{userName.charAt(0)}</span>
            )}
          </div>

          {/* Badge do Curso acoplada à base da imagem */}
          {course && (
             <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800/80 backdrop-blur-md border border-slate-500/40 px-3 py-1 rounded-full shadow-md">
                 <span className="text-[8px] sm:text-[9px] block text-center font-bold uppercase tracking-wider text-slate-300">
                   {course}
                 </span>
             </div>
          )}
        </div>
      </div>
      
      {/* FUNDO: SAUDAÇÃO PRINCIPAL */}
      <div className="relative z-20 w-full flex justify-center mt-2">
        <h1 
          className="font-black text-white uppercase tracking-tight drop-shadow-2xl whitespace-nowrap text-center"
          style={{ fontSize: 'clamp(1.4rem, 4.5vw, 2.6rem)' }} 
        >
          {greetingText}{!isFinished && <span className="animate-pulse text-emerald-400">|</span>}
        </h1>
      </div>
      
    </header>
  );
}