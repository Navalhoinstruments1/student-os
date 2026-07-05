import React from 'react';

export interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtext: string;
  highlight?: boolean;
}

export default function StatCard({ title, value, icon, subtext, highlight = false }: StatCardProps) {
  return (
    <div className={`p-5 md:p-6 rounded-3xl border relative overflow-hidden group transition-all duration-300 ${highlight ? 'border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]' : 'border-border-subtle bg-card-bg hover:border-text-muted/50 hover:bg-card-bg/80'}`}>
      
      {!highlight && <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>}

      <div className="flex justify-between items-start mb-3 md:mb-4 relative z-10">
          <div className={`p-2.5 rounded-xl border transition-colors ${highlight ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-app-bg/80 border-border-subtle/50 shadow-inner'}`}>
              {icon}
          </div>
      </div>
      <h4 className="text-text-muted text-[11px] font-bold uppercase tracking-widest relative z-10 transition-colors">{title}</h4>
      <p className="text-2xl md:text-3xl font-black mt-1.5 tracking-tight text-text-main relative z-10 drop-shadow-sm transition-colors">{value}</p>
      <p className="text-[10px] md:text-xs text-text-muted mt-2 font-medium relative z-10 truncate transition-colors">{subtext}</p>
    </div>
  );
}