"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Wrench, LayoutDashboard, Plus, Sparkles, AlertCircle, Sun } from "lucide-react";
import { Button } from "./ui/Button";
import { WeatherWidget } from "./WeatherWidget";

interface NavbarProps {
  onAddVehicleClick?: () => void;
  onBookServiceClick?: () => void;
  onSeedSuccess?: () => void;
}

export function Navbar({ onAddVehicleClick, onBookServiceClick, onSeedSuccess }: NavbarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Vehicles", href: "/vehicles", icon: Car },
    { label: "Service Appointments", href: "/appointments", icon: Wrench },
    { label: "Weather Forecast", href: "/weather?location=Pune", icon: Sun },
  ];

  const handleSeed = async () => {
    if (!confirm("This will replace current demo data with a set of vehicles and upcoming/overdue services. Continue?")) {
      return;
    }
    try {
      setIsSeeding(true);
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeedNotice("Sample data seeded! Refreshing...");
        setTimeout(() => {
          setSeedNotice(null);
          if (onSeedSuccess) {
            onSeedSuccess();
          } else {
            window.location.reload();
          }
        }, 800);
      } else {
        alert(data.error || "Failed to seed demo data");
      }
    } catch (e: any) {
      alert("Error seeding: " + e.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform group-hover:scale-105">
                <Car className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                  AutoCare <span className="text-xs font-semibold px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700">Tracker</span>
                </span>
                <span className="text-[11px] text-slate-500">Service & Maintenance</span>
              </div>
            </Link>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
              {navLinks.map((link) => {
                const Icon = link.icon;
                // Strip query string before comparing — usePathname() never includes it
                const linkPath = link.href.split("?")[0];
                const isActive = mounted && pathname === linkPath;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-slate-100 text-blue-600 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center">
              <Link href="/weather?location=Pune" title="Click to view full Pune service weather report">
                <WeatherWidget location="Pune" compact={true} />
              </Link>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              isLoading={isSeeding}
              className="text-slate-600 border-dashed hover:border-slate-400 text-xs hidden sm:inline-flex"
              title="Populate test data with cars, upcoming & overdue services"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Seed Demo Data
            </Button>

            {onAddVehicleClick && (
              <Button size="sm" variant="outline" onClick={onAddVehicleClick} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Vehicle</span>
                <span className="sm:hidden">Vehicle</span>
              </Button>
            )}

            {onBookServiceClick && (
              <Button size="sm" onClick={onBookServiceClick} className="gap-1.5 text-xs">
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Book Service</span>
                <span className="sm:hidden">Book</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-slate-50/80 px-2 py-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const linkPath = link.href.split("?")[0];
            const isActive = mounted && pathname === linkPath;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  isActive ? "bg-white text-blue-600 shadow-xs font-semibold" : "text-slate-600"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Floating toast notification */}
      {seedNotice && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm animate-in slide-in-from-bottom-2">
          <AlertCircle className="h-4 w-4 text-emerald-400" />
          <span>{seedNotice}</span>
        </div>
      )}
    </>
  );
}

