import React from 'react';

export interface ProgressBarProps {
  label: string;
  percent: number;
  color: string;
  amount: string;
}

export default function ProgressBar({ label, percent, color, amount }: ProgressBarProps) {
  const safePercent = Math.min(Math.max(percent, 0), 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs md:text-sm">
        {/* Substituí o slate-400 pela nossa variável de texto secundário */}
        <span className="text-text-muted font-medium transition-colors">{label}</span>
        <span className="font-bold text-text-main transition-colors">{amount}</span>
      </div>
      {/* O fundo da barra passa a usar a variável das bordas (border-subtle) para garantir contraste suave em qualquer tema */}
      <div className="h-2.5 bg-border-subtle rounded-full overflow-hidden transition-colors">
        <div className={`h-full ${color} transition-all duration-1000 rounded-full`} style={{ width: `${safePercent}%` }} />
      </div>
    </div>
  );
}