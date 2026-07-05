"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { 
      id: "dark", 
      name: "Noite de Estudo", 
      desc: "O original. Foco noturno.",
      bg: "bg-[#020617]",
      card: "bg-[#0f172a]",
      accent: "bg-[#10b981]"
    },
    { 
      id: "light", 
      name: "Dia de Foco", 
      desc: "Luminoso e vibrante.",
      bg: "bg-[#f8fafc]",
      card: "bg-[#ffffff]",
      accent: "bg-[#0ea5e9]"
    },
    { 
      id: "dracula", 
      name: "Sessão Noturna", 
      desc: "Estilo coding com tons roxos.",
      bg: "bg-[#18181b]",
      card: "bg-[#27272a]",
      accent: "bg-[#a855f7]"
    },
  ] as const;

  return (
    <div className="bg-card-bg border border-border-subtle p-6 rounded-2xl w-full">
      <h2 className="text-xl font-bold text-text-main mb-2">Aparência da App</h2>
      <p className="text-text-muted mb-6">Personaliza as cores do teu painel de estudante.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`flex flex-col text-left rounded-xl transition-all overflow-hidden border-2 ${
              theme === t.id
                ? "border-accent ring-4 ring-accent/20"
                : "border-border-subtle hover:border-text-muted"
            }`}
          >
            {/* Pré-visualização do Tema (usando h-100 para manter a consistência de alturas no teu layout) */}
            <div className={`w-full h-100 ${t.bg} p-4 flex flex-col gap-2 relative`}>
              <div className={`w-3/4 h-8 ${t.card} rounded-lg border border-white/10 shadow-sm`} />
              <div className={`w-full h-16 ${t.card} rounded-lg border border-white/10 shadow-sm flex items-center p-2`}>
                <div className={`w-8 h-8 rounded-full ${t.accent}`} />
                <div className="ml-2 w-1/2 h-2 rounded bg-white/20" />
              </div>
            </div>
            
            {/* Informação do Tema */}
            <div className="p-4 bg-card-bg">
              <h3 className="font-semibold text-text-main">{t.name}</h3>
              <p className="text-sm text-text-muted mt-1">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}