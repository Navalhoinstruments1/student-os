"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GraduationCap, Target, BookOpen, Award } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

interface Assessment {
  id: string;
  grade: number;
  weight: number;
}

interface Subject {
  id: string;
  name: string;
  ects: number;
  category?: string;
  assessments: Assessment[];
}

interface Semester {
  id: string;
  name: string;
  subjects: Subject[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

export default function UniEvolution() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = () => {
    const saved = localStorage.getItem('userSemesters');
    if (saved) {
      try {
        setSemesters(JSON.parse(saved));
      } catch (e) {
        console.error("Erro a ler dados da evolução", e);
      }
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('syncGrades', loadData);
    return () => window.removeEventListener('syncGrades', loadData);
  }, []);

  const getSubjectProjectedGrade = (subject: Subject) => {
    const guaranteed = subject.assessments.reduce((acc, a) => acc + (a.grade * (a.weight / 100)), 0);
    const totalWeight = subject.assessments.reduce((acc, a) => acc + a.weight, 0);
    return totalWeight > 0 ? (guaranteed / (totalWeight / 100)) : 0;
  };

  const getSemesterAverage = (sem: Semester) => {
    let totalEcts = 0;
    let totalWeightedGrades = 0;
    sem.subjects.forEach(sub => {
      const projected = getSubjectProjectedGrade(sub);
      const totalWeight = sub.assessments.reduce((acc, a) => acc + a.weight, 0);
      if (totalWeight > 0) {
        totalWeightedGrades += projected * sub.ects;
        totalEcts += sub.ects;
      }
    });
    return totalEcts === 0 ? 0 : Number((totalWeightedGrades / totalEcts).toFixed(2));
  };

  const lineChartData = useMemo(() => {
    return semesters.map(sem => ({
      name: sem.name.replace('º Semestre', 'º Sem'),
      Média: getSemesterAverage(sem),
      Cadeiras: sem.subjects.length
    })).filter(data => data.Média > 0);
  }, [semesters]);

  const radarChartData = useMemo(() => {
    const categoryStats: Record<string, { totalGrade: number; totalEcts: number }> = {};
    
    semesters.forEach(sem => {
      sem.subjects.forEach(sub => {
        const cat = sub.category && sub.category !== 'Geral' ? sub.category : 'Outros';
        const projected = getSubjectProjectedGrade(sub);
        const totalWeight = sub.assessments.reduce((acc, a) => acc + a.weight, 0);
        
        if (totalWeight > 0) {
          if (!categoryStats[cat]) categoryStats[cat] = { totalGrade: 0, totalEcts: 0 };
          categoryStats[cat].totalGrade += projected * sub.ects;
          categoryStats[cat].totalEcts += sub.ects;
        }
      });
    });

    return Object.entries(categoryStats).map(([subject, stats]) => ({
      subject,
      Nota: Number((stats.totalGrade / stats.totalEcts).toFixed(2)),
      fullMark: 20
    })).sort((a, b) => b.Nota - a.Nota); 
  }, [semesters]);

  const globalStats = useMemo(() => {
    let totalEcts = 0;
    let totalWeightedGrades = 0;
    let cadeirasConcluidas = 0;

    semesters.forEach(sem => {
      sem.subjects.forEach(sub => {
        const projected = getSubjectProjectedGrade(sub);
        const totalWeight = sub.assessments.reduce((acc, a) => acc + a.weight, 0);
        
        if (totalWeight > 0) {
          totalWeightedGrades += projected * sub.ects;
          totalEcts += sub.ects;
          if (projected >= 9.5) cadeirasConcluidas++;
        }
      });
    });

    return {
      average: totalEcts === 0 ? 0 : Number((totalWeightedGrades / totalEcts).toFixed(2)),
      ects: totalEcts,
      cadeiras: cadeirasConcluidas
    };
  }, [semesters]);

  const CustomLineTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-app-bg border border-border-subtle p-3 rounded-lg shadow-xl">
          <p className="text-text-main text-xs font-bold mb-1">{label}</p>
          <p className="text-accent text-sm font-black flex items-center gap-1">
            <Target size={14} /> {payload[0].value}v
          </p>
        </div>
      );
    }
    return null;
  };

  if (!isLoaded) return <div className="h-100 min-h-100 w-full bg-card-bg rounded-2xl border border-border-subtle animate-pulse"></div>;

  return (
    <div className="bg-card-bg border border-border-subtle rounded-2xl p-6 flex flex-col gap-6 w-full transition-colors duration-300">
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg transition-colors">
            <GraduationCap className="text-accent transition-colors" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-text-main uppercase tracking-wide">Evolução Académica</h2>
            <p className="text-xs text-text-muted font-medium">O teu percurso rumo ao Mestrado</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-app-bg/50 border border-border-subtle/30 rounded-xl p-4 flex flex-col transition-colors">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Média por Semestre</h3>
          {lineChartData.length > 0 ? (
            <div className="h-100 min-h-100 w-full relative">
              <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 20]} dx={-10} />
                  <RechartsTooltip content={<CustomLineTooltip />} cursor={{ stroke: 'var(--color-text-muted)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Line 
                    type="monotone" 
                    dataKey="Média" 
                    stroke="var(--color-accent)" 
                    strokeWidth={3} 
                    dot={{ fill: 'var(--color-card-bg)', stroke: 'var(--color-accent)', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6, fill: 'var(--color-accent)', stroke: 'var(--color-card-bg)' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-text-muted italic">
              Adiciona notas avaliadas para veres a evolução.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-app-bg/50 border border-border-subtle/30 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-colors">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Média Global</span>
              <span className="text-xl font-black text-accent leading-none transition-colors">{globalStats.average.toFixed(2)}</span>
            </div>
            <div className="bg-app-bg/50 border border-border-subtle/30 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-colors">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">ECTS Feitos</span>
              <span className="text-xl font-black text-text-main leading-none">{globalStats.ects}</span>
            </div>
          </div>

          <div className="bg-app-bg/50 border border-border-subtle/30 rounded-xl p-4 flex-1 flex flex-col min-h-62.5 transition-colors">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Award size={14} className="text-accent transition-colors" /> Domínio por Área
            </h3>
            {radarChartData.length > 2 ? (
              <div className="flex-1 w-full min-h-55 relative">
                <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarChartData}>
                    <PolarGrid stroke="var(--color-border-subtle)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 20]} tick={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--color-app-bg)', borderColor: 'var(--color-border-subtle)', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: 'var(--color-accent)', fontWeight: 'bold' }}
                    />
                    <Radar name="Média" dataKey="Nota" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-text-muted italic text-center px-4">
                Avalia cadeiras em pelo menos 3 categorias diferentes para gerares o teu perfil.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}