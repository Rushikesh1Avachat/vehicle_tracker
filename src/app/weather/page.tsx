"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WeatherData } from "@/components/WeatherWidget";
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
  Search,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  Car,
} from "lucide-react";

function WeatherSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialLocation = searchParams.get("location") || "Pune";

  const [queryInput, setQueryInput] = useState(initialLocation);
  const [activeLocation, setActiveLocation] = useState(initialLocation);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fetchWeather = async (loc: string) => {
    setIsLoading(true);
    setErrorNotice(null);
    try {
      const res = await fetch(`/api/weather?location=${encodeURIComponent(loc)}`);
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
    const locParam = searchParams.get("location") || "Pune";
    setActiveLocation(locParam);
    setQueryInput(locParam);
    fetchWeather(locParam);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryInput.trim()) {
      const trimmed = queryInput.trim();
      router.push(`/weather?location=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleQuickCityClick = (city: string) => {
    router.push(`/weather?location=${encodeURIComponent(city)}`);
  };

  const getWeatherIcon = (category: string) => {
    switch (category) {
      case "clear":
        return <Sun className="h-12 w-12 text-amber-500" />;
      case "rain":
        return <CloudRain className="h-12 w-12 text-sky-600" />;
      case "thunderstorm":
        return <Zap className="h-12 w-12 text-purple-600" />;
      case "fog":
        return <CloudFog className="h-12 w-12 text-slate-400" />;
      case "snow":
        return <Snowflake className="h-12 w-12 text-cyan-500" />;
      default:
        return <Cloud className="h-12 w-12 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2.5">
              <Sun className="h-8 w-8 text-amber-500" />
              Service Centre Weather Forecaster
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live meteorological telemetry &amp; road safety recommendations for workshop visits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/appointments">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                View Appointments
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar Form */}
        <Card className="border-sky-200 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter location or city (e.g. Pune, Delhi, Mumbai, Bengaluru, Apex Honda Care)..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
                />
              </div>
              <Button type="submit" size="md" className="bg-sky-600 hover:bg-sky-700 text-white gap-2 px-6">
                <Search className="h-4 w-4" />
                Search Location
              </Button>
            </form>

            {/* Quick City Navigation Pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                Popular Automotive Hubs:
              </span>
              {["Pune", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai"].map((city) => {
                const isActive = activeLocation.toLowerCase() === city.toLowerCase();
                return (
                  <button
                    key={city}
                    onClick={() => handleQuickCityClick(city)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live Weather Forecast Display */}
        {isLoading ? (
          <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
            <RefreshCw className="mx-auto h-8 w-8 text-sky-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-800">
              Fetching real-time atmospheric data for &quot;{activeLocation}&quot;...
            </p>
            <p className="text-xs text-slate-500">Connecting to OpenWeather / Open-Meteo telemetry</p>
          </div>
        ) : errorNotice && !weatherData ? (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 text-center space-y-3">
            <AlertCircle className="mx-auto h-10 w-10 text-amber-600" />
            <h3 className="text-base font-bold text-amber-900">Weather Data Unavailable</h3>
            <p className="text-xs text-amber-800 max-w-md mx-auto">{errorNotice}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchWeather(activeLocation)}
              className="mt-2"
            >
              Retry Forecast
            </Button>
          </div>
        ) : weatherData ? (
          <div className="space-y-6">
            {/* Primary Hero Weather Card */}
            <div className="rounded-2xl bg-gradient-to-br from-white via-sky-50/50 to-blue-50/70 border border-sky-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left: Location & Condition */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{weatherData.location}, {weatherData.country}</span>
                  </div>

                  <div className="flex items-baseline gap-3 pt-1">
                    <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono">
                      {weatherData.temperature}°C
                    </span>
                    <span className="text-sm font-medium text-slate-500">
                      Feels like {weatherData.feelsLike ?? weatherData.temperature}°C
                    </span>
                  </div>

                  <p className="text-lg font-bold text-sky-800">
                    {weatherData.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    Queried for: <span className="font-mono text-slate-700">&ldquo;{weatherData.queryLocation || activeLocation}&rdquo;</span>
                  </p>
                </div>

                {/* Right: Weather Icon & Quick refresh */}
                <div className="flex flex-col items-center md:items-end gap-3">
                  <div className="p-4 rounded-3xl bg-white shadow-sm border border-sky-100">
                    {getWeatherIcon(weatherData.category)}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchWeather(activeLocation)}
                    className="text-xs gap-1.5 border-slate-300"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh Forecast
                  </Button>
                </div>
              </div>

              {/* Driving Advisory Banner */}
              <div className="mt-6 rounded-xl bg-white border border-sky-200/90 p-4 shadow-2xs flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-100 text-sky-800 shrink-0 mt-0.5">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Car Owner Transit &amp; Service Handover Advisory
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {weatherData.drivingAdvisory}
                  </p>
                </div>
              </div>

              {/* Sub-Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
                <div className="rounded-xl bg-white/90 border border-slate-200 p-3.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Relative Humidity
                  </span>
                  <span className="text-xl font-bold text-slate-800 mt-1 block">
                    {weatherData.humidity}%
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {weatherData.humidity > 65 ? "High moisture" : "Optimal humidity"}
                  </span>
                </div>

                <div className="rounded-xl bg-white/90 border border-slate-200 p-3.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Wind Velocity
                  </span>
                  <span className="text-xl font-bold text-slate-800 mt-1 block">
                    {weatherData.windSpeed} km/h
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {weatherData.windSpeed > 20 ? "Breezy conditions" : "Gentle breeze"}
                  </span>
                </div>

                <div className="rounded-xl bg-white/90 border border-slate-200 p-3.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Precipitation
                  </span>
                  <span className="text-xl font-bold text-slate-800 mt-1 block">
                    {weatherData.precipitation ?? 0} mm
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {(weatherData.precipitation ?? 0) > 0 ? "Active rainfall" : "Dry roads"}
                  </span>
                </div>

                <div className="rounded-xl bg-white/90 border border-slate-200 p-3.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    API Provider
                  </span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block truncate" title={weatherData.source}>
                    {weatherData.source}
                  </span>
                  <span className="text-[10px] text-slate-500">Live Telemetry</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-blue-50 text-blue-600">
                  <Car className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Need to schedule a service in {weatherData.location}?
                  </h4>
                  <p className="text-xs text-slate-500">
                    Plan your workshop visit with current weather insights.
                  </p>
                </div>
              </div>

              <Link href="/appointments">
                <Button size="sm" className="gap-1.5 text-xs whitespace-nowrap">
                  Book Service in {weatherData.location}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default function WeatherPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading weather forecaster...</div>}>
      <WeatherSearchContent />
    </Suspense>
  );
}
