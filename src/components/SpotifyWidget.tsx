"use client";

import React from 'react';
import { Music } from 'lucide-react';

export default function SpotifyWidget() {
  const spotifyId = "0vvXsWCC9xrXsKd4FyS8kM";

  return (
    <div className="bg-card-bg p-4 rounded-xl shadow border border-border-subtle h-100 flex flex-col transition-colors duration-300">
      
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <Music size={16} className="text-accent transition-colors" />
        <h3 className="text-text-muted text-xs font-semibold uppercase tracking-wider transition-colors">Banda Sonora</h3>
      </div>

      <div className="flex-1 w-full rounded-lg overflow-hidden">
        <iframe 
          // AQUI ESTÁ O TRUQUE: O minHeight força o Spotify a carregar a versão GRANDE
          style={{ borderRadius: '12px', minHeight: '360px' }}
          src={`https://open.spotify.com/embed/playlist/${spotifyId}?utm_source=generator&theme=0`} 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
          loading="lazy"
        ></iframe>
      </div>
      
    </div>
  );
}