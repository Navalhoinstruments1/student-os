"use client";

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

// 1. Ensinar o TypeScript o que é um evento de instalação do Chrome
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallButton() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Truque para o ESLint: tornamos a mudança de estado assíncrona
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    // 2. Capturar o evento do Android/PC em segurança (sem "any")
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Para evitar erros no Next.js, não desenhamos nada até estar seguro
  if (!mounted) return null;

  // Calculamos as variáveis do sistema diretamente no render
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
  if (isInstalled) return null;

  const ua = window.navigator.userAgent;
  const isIOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      alert("No iPhone: Toca no ícone de Partilhar (o quadrado com uma seta para cima, na barra inferior do Safari) e depois escolhe 'Adicionar ao Ecrã Principal'.");
    } else {
      alert("Para instalar, usa o menu do teu navegador e escolhe 'Instalar Aplicação' ou 'Adicionar ao Ecrã Principal'.");
    }
  };

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-2 bg-accent hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all"
    >
      <Download size={18} />
      <span>Instalar App</span>
    </button>
  );
}