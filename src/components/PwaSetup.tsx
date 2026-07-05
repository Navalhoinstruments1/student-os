"use client";

import { useEffect } from 'react';

export default function PwaSetup() {
  useEffect(() => {
    // 1. Só regista se existir suporte no browser e estiver num ambiente seguro (ou localhost)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 2. Proteção contra o "Unhandled Rejection" (O que te estava a crashar o telemóvel)
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('PWA bloqueada temporariamente (normal em ligações IP locais):', error);
      });
    }
  }, []);

  return null;
}