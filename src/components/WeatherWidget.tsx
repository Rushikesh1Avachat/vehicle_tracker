"use client";

import React, { useEffect, useState } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  Zap,
  CloudFog,
  Snowflake,
  Wind,
  RefreshCw,
  AlertCircle,
  Thermometer,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export interface WeatherData {
  location: string;
  queryLocation?: string;
  country: string;
  temperature: number;
  feelsLike?: number;
  humidity: number;
  precipitation?: number;
  windSpeed: number;
  description: string;
  category: "clear" | "cloudy" | "rain" | "thunderstorm" | "snow" | "fog";
  drivingAdvisory: string;
  source: string;
  updatedAt?: string;
  isFallback?: boolean;
  isOfflineFallback?: boolean;
}

interface WeatherWidgetProps {
  location: string;
  compact?: boolean;
  showAdvisoryOnly?: boolean;
}

export function WeatherWidget({
  location,
  compact = false,
  showAdvisoryOnly = false,
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fetchWeather = async () => {
    if (!location || !location.trim()) return;
    setIsLoading(true);
    setErrorNotice(null);

    try {
      const res = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
      const json = await res.json();

      if (json.data) {
        setWeather(json.data);
      } else if (!json.success) {
        setErrorNotice(json.error || "Weather information unavailable");
      }
    } catch {
      setErrorNotice("Could not load weather information");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Weather Category Icon helper
  const getWeatherIcon = (category: string, className = "h-4 w-4") => {
    switch (category) {
      case "clear":
        return <Sun className={`${className} text-amber-500 shrink-0`} />;
      case "rain":
        return <CloudRain className={`${className} text-sky-500 shrink-0`} />;
      case "thunderstorm":
        return <Zap className={`${className} text-purple-500 shrink-0`} />;
      case "fog":
        return <CloudFog className={`${className} text-slate-400 shrink-0`} />;
      case "snow":
        return <Snowflake className={`${className} text-cyan-500 shrink-0`} />;
      default:
        return <Cloud className={`${className} text-slate-500 shrink-0`} />;
    }
  };

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50/60 text-xs text-sky-700 border border-sky-100 animate-pulse mt-1">
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-600" />
        <span>Loading live weather for {location}...</span>
      </div>
    );
  }

  // Graceful failure fallback
  if (errorNotice && !weather) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-xs text-slate-600 border border-slate-200 mt-1">
        <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <span className="truncate max-w-[220px]">Weather temporarily offline for &quot;{location}&quot;</span>
        <button
          onClick={fetchWeather}
          className="text-blue-600 font-semibold hover:underline cursor-pointer ml-1 text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!weather) return null;

  // Advisory Only variant
  if (showAdvisoryOnly) {
    return (
      <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-sky-50/70 p-2 rounded-md border border-sky-200/60">
        <span className="font-semibold text-sky-800 shrink-0">🚗 Road Tip:</span>
        <span>{weather.drivingAdvisory}</span>
      </div>
    );
  }

  // Compact variant (used inside inline badges)
  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 border border-sky-200 text-xs text-slate-700 shadow-2xs"
        title={`Weather at ${weather.location}: ${weather.temperature}°C, ${weather.description}. ${weather.drivingAdvisory}`}
      >
        {getWeatherIcon(weather.category, "h-3.5 w-3.5")}
        <span className="font-bold text-slate-900">{weather.temperature}°C</span>
        <span className="text-slate-600 hidden sm:inline">&bull; {weather.description}</span>
        <span className="text-[10px] text-sky-700 font-mono hidden md:inline">({weather.location})</span>
      </div>
    );
  }

  // Full detailed card variant with driving advisory and API source
  return (
    <div className="rounded-xl bg-gradient-to-br from-sky-50/90 to-blue-50/60 border border-sky-200 p-3.5 shadow-2xs space-y-2 mt-2">
      <div className="flex items-center justify-between gap-2 border-b border-sky-200/50 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white shadow-2xs border border-sky-100">
            {getWeatherIcon(weather.category, "h-5 w-5")}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm">{weather.temperature}°C</span>
              <span className="text-xs font-medium text-slate-700">&bull; {weather.description}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Workshop Location: <strong className="text-slate-800">{weather.location}</strong> ({weather.country})
            </p>
          </div>
        </div>

        {/* Telemetry pill */}
        <div className="text-right text-[11px] text-slate-500 space-y-0.5">
          <div className="flex items-center justify-end gap-2 text-[10px]">
            <span className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              <Wind className="h-3 w-3 text-slate-400" />
              {weather.windSpeed} km/h
            </span>
            <span className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              <Thermometer className="h-3 w-3 text-slate-400" />
              {weather.humidity}% hum
            </span>
          </div>
          <span className="text-[9px] text-sky-600/80 font-mono block">
            {weather.source}
          </span>
        </div>
      </div>

      {/* Driving Safety & Road Handover Advisory */}
      <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-sky-100/80 text-xs text-slate-700">
        <span className="text-base leading-none">🚗</span>
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-900">Driving Advisory: </span>
          <span>{weather.drivingAdvisory}</span>
        </div>
      </div>
    </div>
  );
}

// Standalone Service Weather Hub for the Dashboard
export function ServiceWeatherHub({ defaultLocations = ["Pune", "Delhi", "Bengaluru", "Mumbai"] }: { defaultLocations?: string[] }) {
  const [selectedCity, setSelectedCity] = useState(defaultLocations[0] || "Pune");
  const [customCity, setCustomCity] = useState("");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fetchCityWeather = async (city: string) => {
    setIsLoading(true);
    setErrorNotice(null);
    try {
      const res = await fetch(`/api/weather?location=${encodeURIComponent(city)}`);
      const json = await res.json();
      if (json.data) {
        setWeatherData(json.data);
      } else {
        setErrorNotice(json.error || "Unable to retrieve weather data.");
      }
    } catch {
      setErrorNotice("Network error reaching weather service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCityWeather(selectedCity);
  }, [selectedCity]);

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCity.trim()) {
      setSelectedCity(customCity.trim());
      setCustomCity("");
    }
  };

  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-white via-sky-50/30 to-blue-50/40 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500 text-white shadow-xs">
            <Sun className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              Live Service Centre Weather
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                OpenWeather Integration
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time atmospheric conditions and vehicle transit safety advisories.
            </p>
          </div>
        </div>

        {/* City selector pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {defaultLocations.map((loc) => {
            const isActive = selectedCity.toLowerCase() === loc.toLowerCase();
            return (
              <button
                key={loc}
                onClick={() => setSelectedCity(loc)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom City Search Input */}
      <form onSubmit={handleCustomSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Check weather for any workshop city (e.g. Pune, Delhi, Mumbai, Bengaluru)..."
          value={customCity}
          onChange={(e) => setCustomCity(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer transition-colors"
        >
          Check Location
        </button>
        <button
          type="button"
          onClick={() => fetchCityWeather(selectedCity)}
          disabled={isLoading}
          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs rounded-lg cursor-pointer"
          title="Refresh current forecast"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </form>

      {/* Main Weather Metric Box */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-sky-600" />
          <span>Fetching live meteorological telemetry for {selectedCity}...</span>
        </div>
      ) : errorNotice && !weatherData ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button
            onClick={() => fetchCityWeather(selectedCity)}
            className="text-xs font-semibold text-amber-900 underline ml-2"
          >
            Retry
          </button>
        </div>
      ) : weatherData ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Primary Stat: Temperature */}
            <div className="sm:col-span-2 rounded-xl bg-white border border-sky-100 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {weatherData.location}, {weatherData.country}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {weatherData.temperature}°C
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    Feels like {weatherData.feelsLike ?? weatherData.temperature}°C
                  </span>
                </div>
                <p className="text-xs font-semibold text-sky-700 mt-0.5">
                  {weatherData.description}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100">
                {weatherData.category === "clear" ? (
                  <Sun className="h-8 w-8 text-amber-500" />
                ) : weatherData.category === "rain" ? (
                  <CloudRain className="h-8 w-8 text-sky-600" />
                ) : weatherData.category === "thunderstorm" ? (
                  <Zap className="h-8 w-8 text-purple-600" />
                ) : (
                  <Cloud className="h-8 w-8 text-slate-500" />
                )}
              </div>
            </div>

            {/* Sub-Stat: Humidity */}
            <div className="rounded-xl bg-white border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5 text-blue-500" />
                Relative Humidity
              </span>
              <span className="text-2xl font-bold text-slate-800 mt-2">
                {weatherData.humidity}%
              </span>
              <span className="text-[10px] text-slate-400">
                {weatherData.humidity > 70 ? "High moisture / rain risk" : "Dry atmosphere"}
              </span>
            </div>

            {/* Sub-Stat: Wind Speed */}
            <div className="rounded-xl bg-white border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Wind className="h-3.5 w-3.5 text-sky-500" />
                Wind Speed
              </span>
              <span className="text-2xl font-bold text-slate-800 mt-2">
                {weatherData.windSpeed} <span className="text-xs font-normal">km/h</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {weatherData.windSpeed > 25 ? "Gusty conditions" : "Calm highway breeze"}
              </span>
            </div>
          </div>

          {/* Car Owner Advisory Box */}
          <div className="rounded-xl bg-white border border-sky-200 p-3.5 flex items-start gap-3 shadow-2xs">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700 shrink-0 mt-0.5">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-slate-900">
                Vehicle Care &amp; Transit Recommendation:
              </p>
              <p className="text-slate-600 leading-relaxed">
                {weatherData.drivingAdvisory}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Telemetry Source: <strong>{weatherData.source}</strong>
            </span>
            <span>Last checked: {weatherData.updatedAt || "Real-time"}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
