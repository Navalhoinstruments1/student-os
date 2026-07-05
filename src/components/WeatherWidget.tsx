"use client";

import React, { useState, useEffect } from 'react';
import { Search, Sun, Cloud, CloudRain, Snowflake, Wind, MapPin, Loader2 } from 'lucide-react';

interface WeatherProps {
  onWeatherCodeChange: (code: number) => void;
}

export default function WeatherWidget({ onWeatherCodeChange }: WeatherProps) {
  const [weather, setWeather] = useState<{ temp: number; code: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputCity, setInputCity] = useState('');

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1`);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        alert("Cidade não encontrada.");
        setLoading(false);
        return;
      }
      
      const { latitude, longitude, name } = geoData.results[0];
      
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      const weatherData = await weatherRes.json();
      
      const code = weatherData.current_weather.weathercode;
      
      setWeather({
        temp: Math.round(weatherData.current_weather.temperature),
        code: code,
        name: name
      });

      // A ligação crítica ao page.tsx mantém-se intocável!
      onWeatherCodeChange(code);
      
      localStorage.setItem('userCity', name);
    } catch (error) {
      console.error("Erro ao procurar o tempo:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const savedCity = localStorage.getItem('userCity') || 'Abrantes';
    setTimeout(() => {
      fetchWeather(savedCity);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCity.trim()) {
      fetchWeather(inputCity);
      setInputCity('');
    }
  };

  // Ícones com animações e sombras mantidas intactas para realismo
  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun size={38} className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-[spin_10s_linear_infinite]" />;
    if (code >= 1 && code <= 3) return <Cloud size={38} className="text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.4)] animate-pulse" />;
    if (code >= 51 && code <= 67) return <CloudRain size={38} className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)] animate-bounce" />;
    if (code >= 71 && code <= 77) return <Snowflake size={38} className="text-indigo-200 drop-shadow-[0_0_15px_rgba(199,210,254,0.5)] animate-[spin_8s_linear_infinite]" />;
    return <Wind size={38} className="text-teal-400 drop-shadow-md" />;
  };

  // Fundo dinâmico adaptado para funcionar perfeitamente com os temas Light/Dark/Dracula
  const getBackgroundGlow = (code: number | undefined) => {
    if (code === undefined) return 'from-card-bg to-card-bg';
    if (code === 0) return 'from-amber-500/20 to-card-bg'; // Sol
    if (code >= 1 && code <= 3) return 'from-border-subtle to-card-bg'; // Nuvens
    if (code >= 51 && code <= 67) return 'from-blue-500/20 to-card-bg'; // Chuva
    if (code >= 71 && code <= 77) return 'from-indigo-500/20 to-card-bg'; // Neve
    return 'from-teal-500/20 to-card-bg'; // Vento/Outro
  };

  const bgGlow = getBackgroundGlow(weather?.code);

  return (
    <div className={`relative overflow-hidden bg-linear-to-br ${bgGlow} p-4 rounded-xl shadow-lg border border-border-subtle flex flex-col justify-between h-full transition-colors duration-1000 group`}>
      
      {/* Brilho decorativo no canto superior direito */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* BARRA DE PESQUISA (Mais discreta e elegante) */}
      <form onSubmit={handleSearch} className="relative z-10 flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Mudar cidade..." 
            value={inputCity}
            onChange={(e) => setInputCity(e.target.value)}
            className="w-full bg-app-bg/60 text-text-main pl-8 pr-3 py-1.5 rounded-lg text-xs font-medium border border-border-subtle/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-text-muted/70 transition-all"
          />
        </div>
      </form>

      {/* DADOS DO TEMPO */}
      <div className="flex-1 flex items-center justify-between px-1 relative z-10 mt-1">
        {loading || !weather ? (
          <div className="flex items-center justify-center w-full gap-2 text-text-muted text-xs font-medium transition-colors">
            <Loader2 size={16} className="animate-spin text-accent" />
            <span>A ler os céus...</span>
          </div>
        ) : (
          <>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-text-muted text-[10px] font-bold mb-0.5 tracking-widest uppercase transition-colors">
                <MapPin size={12} className="text-accent transition-colors" />
                <span className="truncate max-w-25">{weather.name}</span>
              </div>
              <div className="flex items-start">
                <span className="text-4xl font-black text-text-main tracking-tighter drop-shadow-md leading-none transition-colors">
                  {weather.temp}
                </span>
                <span className="text-lg font-bold text-text-muted ml-0.5 mt-0.5 transition-colors">°</span>
              </div>
            </div>
            
            {/* Caixa do ícone adaptada aos novos fundos e bordas */}
            <div className="flex items-center justify-center bg-app-bg/40 border border-border-subtle/50 w-16 h-16 rounded-2xl shadow-inner group-hover:scale-105 transition-transform duration-500">
              {getWeatherIcon(weather.code)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}