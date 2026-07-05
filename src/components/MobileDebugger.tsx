"use client";

import React, { useState, useEffect } from 'react';

export default function MobileDebugger() {
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setErrors(prev => [...prev, `${event.message} (${event.filename}:${event.lineno})`]);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      setErrors(prev => [...prev, `Promessa Rejeitada: ${event.reason}`]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-rose-600 text-white p-4 z-[99999] max-h-48 overflow-y-auto text-[10px] font-mono shadow-2xl border-b-2 border-white/50">
      <p className="font-black text-xs uppercase tracking-wider border-b border-white/20 pb-1 mb-1 flex items-center gap-2">
        🚨 Erro Detetado no Telemóvel:
      </p>
      {errors.map((err, i) => (
        <p key={i} className="bg-black/20 p-1 rounded mb-1">{err}</p>
      ))}
    </div>
  );
}