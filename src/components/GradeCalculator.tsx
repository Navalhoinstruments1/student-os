"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Plus, Trash2, GraduationCap, ChevronDown, ChevronRight, Target, AlertCircle } from 'lucide-react';

interface Assessment {
  id: string;
  name: string;
  grade: number;  
  weight: number; 
}

interface Subject {
  id: string;
  name: string;
  ects: number;
  category?: string; 
  targetGrade?: number; 
  assessments: Assessment[];
}

interface Semester {
  id: string;
  name: string;
  subjects: Subject[];
}

export default function GradeCalculator() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeSemesterId, setActiveSemesterId] = useState<string>('');
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [newSubName, setNewSubName] = useState('');
  const [newSubEcts, setNewSubEcts] = useState('5');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newSubTarget, setNewSubTarget] = useState(''); 

  const [newAssName, setNewAssName] = useState('');
  const [newAssGrade, setNewAssGrade] = useState('');
  const [newAssWeight, setNewAssWeight] = useState('');

  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      const saved = localStorage.getItem('userSemesters');
      if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const migratedSemesters = parsed.map((sem: Semester) => ({
                ...sem,
                subjects: sem.subjects.map((sub: Subject) => ({
                    ...sub,
                    category: sub.category || 'Geral',
                    targetGrade: sub.targetGrade || 9.5
                }))
            }));
            setSemesters(migratedSemesters);
            if (migratedSemesters.length > 0) setActiveSemesterId(migratedSemesters[0].id);
        } catch (e) {
            console.error("Erro a ler semestres", e);
        }
      } else {
        const initialSem = { id: 'sem-1', name: '1º Semestre', subjects: [] };
        setSemesters([initialSem]);
        setActiveSemesterId(initialSem.id);
      }
      setIsLoaded(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('userSemesters', JSON.stringify(semesters));
      window.dispatchEvent(new Event('syncGrades'));
    }
  }, [semesters, isLoaded]);

  const existingCategories = useMemo(() => {
      const cats = new Set<string>();
      semesters.forEach(sem => sem.subjects.forEach(sub => {
          if (sub.category && sub.category !== 'Geral') cats.add(sub.category);
      }));
      return Array.from(cats);
  }, [semesters]);

  const filteredCategories = existingCategories.filter(c => c.toLowerCase().includes(newSubCategory.toLowerCase()) && c !== newSubCategory);

  const getSubjectStats = (subject: Subject) => {
    const guaranteed = subject.assessments.reduce((acc, a) => acc + (a.grade * (a.weight / 100)), 0);
    const totalWeight = subject.assessments.reduce((acc, a) => acc + a.weight, 0);
    const projected = totalWeight > 0 ? (guaranteed / (totalWeight / 100)) : 0;
    const remainingWeight = 100 - totalWeight;
    
    const target = subject.targetGrade || 9.5;
    let requiredForPass = 0;
    
    if (remainingWeight > 0) {
      requiredForPass = Math.max(0, (target - guaranteed) / (remainingWeight / 100));
    }

    return { guaranteed, totalWeight, projected, remainingWeight, requiredForPass, target };
  };

  const getSemesterAverage = (semesterId: string) => {
    const sem = semesters.find(s => s.id === semesterId);
    if (!sem || sem.subjects.length === 0) return 0;

    let totalEcts = 0;
    let totalWeightedGrades = 0;

    sem.subjects.forEach(sub => {
      const stats = getSubjectStats(sub);
      if (stats.totalWeight > 0) {
        totalWeightedGrades += stats.projected * sub.ects;
        totalEcts += sub.ects;
      }
    });

    return totalEcts === 0 ? 0 : totalWeightedGrades / totalEcts;
  };

  const getGlobalAverage = () => {
    let totalEcts = 0;
    let totalWeightedGrades = 0;

    semesters.forEach(sem => {
      sem.subjects.forEach(sub => {
        const stats = getSubjectStats(sub);
        if (stats.totalWeight > 0) {
          totalWeightedGrades += stats.projected * sub.ects;
          totalEcts += sub.ects;
        }
      });
    });

    return totalEcts === 0 ? 0 : totalWeightedGrades / totalEcts;
  };

  const handleAddSemester = () => {
    const newSem: Semester = {
      id: `sem-${Date.now()}`,
      name: `${semesters.length + 1}º Semestre`,
      subjects: []
    };
    setSemesters([...semesters, newSem]);
    setActiveSemesterId(newSem.id);
  };

  const handleRemoveSemester = (semesterId: string) => {
    if (semesters.length === 1) {
      alert("Precisas de ter pelo menos um semestre no sistema!");
      return;
    }
    if(!confirm("Tens a certeza que queres apagar este semestre e TODAS as suas cadeiras?")) return;
    
    const updatedSemesters = semesters.filter(sem => sem.id !== semesterId);
    setSemesters(updatedSemesters);
    
    if (activeSemesterId === semesterId) {
      setActiveSemesterId(updatedSemesters[0].id);
    }
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const target = parseFloat(newSubTarget.replace(',', '.'));
    const finalTarget = (!isNaN(target) && target >= 9.5 && target <= 20) ? target : 9.5;
    const cat = newSubCategory.trim() || 'Geral';

    const updatedSemesters = semesters.map(sem => {
      if (sem.id === activeSemesterId) {
        return {
          ...sem,
          subjects: [...sem.subjects, {
            id: `sub-${Date.now()}`,
            name: newSubName,
            ects: parseFloat(newSubEcts) || 5,
            category: cat,
            targetGrade: finalTarget,
            assessments: []
          }]
        };
      }
      return sem;
    });

    setSemesters(updatedSemesters);
    setNewSubName('');
    setNewSubEcts('5');
    setNewSubCategory('');
    setNewSubTarget('');
    setShowCategorySuggestions(false);
  };

  const handleAddAssessment = (e: React.FormEvent, subjectId: string) => {
    e.preventDefault();
    if (!newAssName || !newAssGrade || !newAssWeight) return;

    const grade = parseFloat(newAssGrade.replace(',', '.'));
    const weight = parseFloat(newAssWeight.replace(',', '.'));

    if (isNaN(grade) || grade < 0 || grade > 20) {
      alert("A nota deve ser entre 0 e 20.");
      return;
    }

    const updatedSemesters = semesters.map(sem => ({
      ...sem,
      subjects: sem.subjects.map(sub => {
        if (sub.id === subjectId) {
          const currentTotalWeight = getSubjectStats(sub).totalWeight;
          if (currentTotalWeight + weight > 100) {
            alert(`Atenção: A soma dos pesos não pode ultrapassar 100%. Já tens ${currentTotalWeight}%.`);
            return sub;
          }
          return {
            ...sub,
            assessments: [...sub.assessments, {
              id: `ass-${Date.now()}`,
              name: newAssName,
              grade,
              weight
            }]
          };
        }
        return sub;
      })
    }));

    setSemesters(updatedSemesters);
    setNewAssName('');
    setNewAssGrade('');
    setNewAssWeight('');
  };

  const removeAssessment = (subjectId: string, assessmentId: string) => {
    setSemesters(semesters.map(sem => ({
      ...sem,
      subjects: sem.subjects.map(sub => {
        if (sub.id === subjectId) {
          return { ...sub, assessments: sub.assessments.filter(a => a.id !== assessmentId) };
        }
        return sub;
      })
    })));
  };

  const removeSubject = (subjectId: string) => {
    if(!confirm("Tens a certeza que queres apagar esta cadeira e todas as suas notas?")) return;
    setSemesters(semesters.map(sem => ({
      ...sem,
      subjects: sem.subjects.filter(sub => sub.id !== subjectId)
    })));
  };

  const activeSemester = semesters.find(s => s.id === activeSemesterId);
  const currentSemesterAvg = getSemesterAverage(activeSemesterId);
  const globalAvg = getGlobalAverage();

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentSemesterAvg / 20) * circumference;

  if (!isLoaded || !activeSemester) return <div className="animate-pulse bg-card-bg rounded-xl h-[600px] border border-border-subtle"></div>;

  return (
    <div className="bg-card-bg p-5 rounded-xl shadow-lg border border-border-subtle flex flex-col h-[600px] relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[50px] pointer-events-none"></div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-text-main font-bold text-sm flex items-center gap-2 uppercase tracking-wide">
          <Calculator size={18} className="text-accent transition-colors" />
          A Minha Média
        </h3>
        
        <div className="bg-app-bg/60 pl-3 pr-2 py-1.5 rounded-lg border border-border-subtle flex items-center gap-3 shadow-inner transition-colors">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Global Curso</span>
            <span className="text-accent font-black text-sm leading-none transition-colors">{globalAvg.toFixed(2)}</span>
          </div>
          <div className="bg-card-bg p-1.5 rounded-md border border-border-subtle/50 transition-colors">
            <GraduationCap size={16} className="text-text-muted" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto custom-scrollbar pb-2 relative z-10 shrink-0">
        {semesters.map(sem => (
          <button
            key={sem.id}
            onClick={() => { setActiveSemesterId(sem.id); setExpandedSubjectId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeSemesterId === sem.id ? 'bg-accent text-white shadow-lg' : 'bg-app-bg/50 text-text-muted hover:bg-border-subtle hover:text-text-main border border-border-subtle/50'}`}
          >
            {sem.name}
          </button>
        ))}
        <button onClick={handleAddSemester} className="px-3 py-2 rounded-lg bg-app-bg/50 text-text-muted hover:bg-border-subtle hover:text-accent border border-border-subtle/50 transition-colors shrink-0">
          <Plus size={16} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-6 mb-6 shrink-0 relative z-10 bg-app-bg/30 p-4 rounded-xl border border-border-subtle/30 transition-colors">
        <div className="relative flex items-center justify-center">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-border-subtle" />
            <circle 
              cx="48" cy="48" r={radius} 
              stroke="currentColor" strokeWidth="6" fill="transparent" 
              className="text-accent transition-all duration-1000 ease-out"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-text-main transition-colors">{currentSemesterAvg.toFixed(2)}</span>
            <span className="text-[9px] text-text-muted uppercase font-bold tracking-wider">/ 20</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-text-muted flex justify-between gap-4 transition-colors">Cadeiras: <strong className="text-text-main">{activeSemester.subjects.length}</strong></p>
          <p className="text-xs text-text-muted flex justify-between gap-4 transition-colors">ECTS do Semestre: <strong className="text-text-main">{activeSemester.subjects.reduce((acc, s) => acc + s.ects, 0)}</strong></p>
          
          <div className="flex items-center gap-2 mt-1">
            <div className="px-2 py-1 bg-app-bg/50 rounded text-[10px] text-accent font-medium border border-accent/20 uppercase tracking-wide transition-colors">
              {activeSemester.name}
            </div>
            <button 
              onClick={() => handleRemoveSemester(activeSemester.id)} 
              className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-md transition-all flex items-center justify-center"
              title="Apagar Semestre"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleAddSubject} className="flex flex-col gap-2 mb-4 relative z-20 shrink-0">
        <div className="flex gap-2">
            <input 
              type="text" placeholder="Nome da cadeira..." required
              className="flex-1 bg-app-bg/50 text-text-main text-xs px-3 py-2.5 rounded-lg border border-border-subtle outline-none focus:border-accent transition-colors"
              value={newSubName} onChange={e => setNewSubName(e.target.value)}
            />
            <div className="relative flex-1">
                <input 
                  type="text" placeholder="Categoria (ex: Gestão)..."
                  className="w-full bg-app-bg/50 text-text-main text-xs px-3 py-2.5 rounded-lg border border-border-subtle outline-none focus:border-accent transition-colors"
                  value={newSubCategory} 
                  onChange={e => { setNewSubCategory(e.target.value); setShowCategorySuggestions(true); }}
                  onFocus={() => setShowCategorySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)} 
                />
                {showCategorySuggestions && filteredCategories.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-card-bg border border-border-subtle rounded-lg shadow-xl z-50 overflow-hidden max-h-32 overflow-y-auto transition-colors">
                        {filteredCategories.map(cat => (
                            <button 
                                key={cat} type="button"
                                onClick={() => { setNewSubCategory(cat); setShowCategorySuggestions(false); }}
                                className="w-full text-left px-3 py-2 text-xs text-text-muted hover:bg-border-subtle hover:text-text-main transition-colors"
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
        <div className="flex gap-2">
            <div className="relative w-24">
                <input 
                  type="number" step="0.1" placeholder="Alvo" min="9.5" max="20"
                  className="w-full bg-app-bg/50 text-accent font-bold text-xs pl-3 pr-8 py-2.5 rounded-lg border border-border-subtle outline-none focus:border-accent transition-colors"
                  value={newSubTarget} onChange={e => setNewSubTarget(e.target.value)} title="Nota que queres atingir (Opcional)"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted font-bold">/20</span>
            </div>
            <input 
              type="number" step="0.5" placeholder="ECTS" min="1" required
              className="w-20 bg-app-bg/50 text-text-main text-xs px-3 py-2.5 rounded-lg border border-border-subtle outline-none focus:border-accent transition-colors text-center"
              value={newSubEcts} onChange={e => setNewSubEcts(e.target.value)} title="ECTS da cadeira"
            />
            <button type="submit" className="flex-1 bg-accent hover:opacity-90 text-white px-4 rounded-lg transition-colors shadow-lg flex items-center justify-center font-bold text-xs uppercase tracking-wide">
              Criar
            </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3 relative z-10 pb-4">
        {activeSemester.subjects.length === 0 ? (
          <p className="text-xs text-text-muted italic text-center mt-8 transition-colors">Ainda não tens cadeiras neste semestre.</p>
        ) : (
          activeSemester.subjects.map((sub) => {
            const stats = getSubjectStats(sub);
            const isExpanded = expandedSubjectId === sub.id;

            return (
              <div key={sub.id} className="bg-app-bg/40 rounded-xl border border-border-subtle/50 overflow-hidden transition-all duration-300">
                <div 
                  onClick={() => setExpandedSubjectId(isExpanded ? null : sub.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-border-subtle/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={18} className="text-accent" /> : <ChevronRight size={18} className="text-text-muted group-hover:text-accent transition-colors" />}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-main flex items-center gap-2 transition-colors">
                          {sub.name}
                          {sub.category && sub.category !== 'Geral' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-card-bg text-text-muted border border-border-subtle uppercase transition-colors">{sub.category}</span>}
                          {sub.targetGrade && sub.targetGrade > 9.5 && <span className="text-[9px] font-black text-accent flex items-center gap-0.5 transition-colors"><Target size={10}/> {sub.targetGrade}</span>}
                      </span>
                      <span className="text-[10px] text-text-muted font-medium mt-0.5 transition-colors">ECTS: {sub.ects} | Avaliado: {stats.totalWeight}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-text-muted uppercase tracking-wide transition-colors">Garantido</span>
                    <span className={`text-lg font-black leading-none transition-colors ${stats.guaranteed >= stats.target ? 'text-emerald-400' : stats.totalWeight === 100 ? 'text-rose-500' : 'text-amber-400'}`}>
                      {stats.guaranteed.toFixed(2)}v
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-app-bg/80 border-t border-border-subtle/50 flex flex-col gap-4 animate-in slide-in-from-top-2 fade-in duration-300 transition-colors">
                    {sub.assessments.length > 0 && (
                      <div className="space-y-2">
                        {sub.assessments.map(ass => (
                          <div key={ass.id} className="flex items-center justify-between bg-card-bg/80 p-2 rounded border border-border-subtle/50 group transition-colors">
                            <span className="text-xs text-text-main flex-1 transition-colors">{ass.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-text-muted w-8 text-right transition-colors">{ass.weight}%</span>
                              <span className="text-xs font-bold text-text-main w-8 text-right transition-colors">{ass.grade}v</span>
                              <button onClick={() => removeAssessment(sub.id, ass.id)} className="text-text-muted hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {stats.totalWeight < 100 && stats.totalWeight > 0 && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3 transition-colors">
                        <Target size={16} className="text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-text-main transition-colors">Faltam avaliar <strong className="text-blue-500">{stats.remainingWeight}%</strong> da cadeira.</p>
                          {stats.guaranteed >= stats.target ? (
                            <p className="text-[10px] text-emerald-500 mt-1 uppercase font-bold">🎉 Alvo ({stats.target}v) já atingido!</p>
                          ) : stats.requiredForPass > 20 ? (
                            <p className="text-[10px] text-rose-400 mt-1 uppercase font-bold flex items-center gap-1"><AlertCircle size={12}/> Matematicamente impossível chegar aos {stats.target}v (precisas de {stats.requiredForPass.toFixed(1)}).</p>
                          ) : (
                            <p className="text-[10px] text-text-muted mt-1 transition-colors">Precisas de tirar <strong className="text-amber-400 text-xs">{stats.requiredForPass.toFixed(1)}</strong> no restante para chegar ao alvo de {stats.target}v.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {stats.totalWeight < 100 ? (
                      <form onSubmit={(e) => handleAddAssessment(e, sub.id)} className="flex gap-2 mt-2">
                        <input 
                          type="text" placeholder="Ex: Frequência 1..." required
                          className="flex-1 bg-card-bg text-text-main text-xs px-3 py-2 rounded border border-border-subtle outline-none focus:border-accent transition-colors"
                          value={newAssName} onChange={e => setNewAssName(e.target.value)}
                        />
                        <div className="relative w-16">
                          <input 
                            type="number" step="0.1" placeholder="Nota" required min="0" max="20"
                            className="w-full bg-card-bg text-text-main text-xs pl-2 pr-4 py-2 rounded border border-border-subtle outline-none focus:border-accent transition-colors"
                            value={newAssGrade} onChange={e => setNewAssGrade(e.target.value)}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-muted pointer-events-none">v</span>
                        </div>
                        <div className="relative w-16">
                          <input 
                            type="number" step="0.1" placeholder="Peso" required min="1" max="100"
                            className="w-full bg-card-bg text-text-main text-xs pl-2 pr-4 py-2 rounded border border-border-subtle outline-none focus:border-accent transition-colors"
                            value={newAssWeight} onChange={e => setNewAssWeight(e.target.value)}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-muted pointer-events-none">%</span>
                        </div>
                        <button type="submit" className="bg-accent hover:opacity-90 text-white p-2 rounded transition-colors flex items-center justify-center">
                          <Plus size={14} />
                        </button>
                      </form>
                    ) : (
                      <div className="bg-card-bg/50 p-2 rounded text-center text-[10px] text-text-muted uppercase tracking-widest font-bold transition-colors">
                        100% Avaliado
                      </div>
                    )}

                    <div className="flex justify-end mt-2">
                       <button onClick={() => removeSubject(sub.id)} className="text-[10px] text-rose-500 hover:text-rose-400 flex items-center gap-1 transition-colors">
                          <Trash2 size={12} /> Apagar Cadeira
                       </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}