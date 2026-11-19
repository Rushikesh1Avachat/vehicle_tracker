"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { VehicleFormModal } from "@/components/VehicleFormModal";
import { AppointmentFormModal } from "@/components/AppointmentFormModal";
import { WeatherWidget } from "@/components/WeatherWidget";
import { IVehicle } from "@/types";
import {
  Car,
  Plus,
  Search,
  Gauge,
  Calendar,
  Fuel,
  Edit2,
  Trash2,
  Wrench,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<IVehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Appointment modal from vehicle card
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [targetVehicleId, setTargetVehicleId] = useState<string | undefined>(undefined);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = searchQuery.trim()
        ? `/api/vehicles?search=${encodeURIComponent(searchQuery.trim())}`
        : "/api/vehicles";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load vehicles");
      }
      setVehicles(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load vehicles");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleToDelete._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || "Failed to delete vehicle");
        return;
      }
      setVehicleToDelete(null);
      fetchVehicles();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onAddVehicleClick={() => {
          setVehicleToEdit(null);
          setIsVehicleModalOpen(true);
        }}
        onBookServiceClick={() => {
          setTargetVehicleId(undefined);
          setIsAppointmentModalOpen(true);
        }}
        onSeedSuccess={fetchVehicles}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2.5">
              <Car className="h-7 w-7 text-blue-600" />
              Vehicle Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Register, update, and manage your cars, fuel profiles, and recorded odometer readings.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setVehicleToEdit(null);
              setIsVehicleModalOpen(true);
            }}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Register Vehicle
          </Button>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reg number, make, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="text-xs text-slate-500 w-full sm:w-auto text-left sm:text-right">
            Showing <strong className="text-slate-800">{vehicles.length}</strong> vehicle
            {vehicles.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Vehicles Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading vehicle registry...</div>
        ) : vehicles.length === 0 ? (
          <Card className="text-center py-16 border-dashed">
            <CardContent className="space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Car className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">
                {searchQuery ? "No matching vehicles found" : "No vehicles registered yet"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? "Try adjusting your search query or clear the filter."
                  : "Add your first car to start tracking services, maintenance milestones, and costs."}
              </p>
              {!searchQuery && (
                <Button
                  size="sm"
                  onClick={() => {
                    setVehicleToEdit(null);
                    setIsVehicleModalOpen(true);
                  }}
                  className="gap-1.5 mt-2"
                >
                  <Plus className="h-4 w-4" />
                  Register Vehicle
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehicles.map((v) => {
              const stats = v.stats || {
                totalAppointments: 0,
                completedAppointments: 0,
                scheduledAppointments: 0,
              };

              return (
                <Card key={v._id} className="hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-start justify-between">
                      <div>
                        {/* Number Plate Preview */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono font-bold tracking-wider text-xs shadow-xs">
                          <span className="text-[10px] text-amber-400 font-sans font-bold">IND</span>
                          <span>{v.registrationNumber}</span>
                        </div>
                        {v.nickname && (
                          <p className="text-xs font-medium text-blue-600 mt-1 italic">
                            &quot;{v.nickname}&quot;
                          </p>
                        )}
                      </div>

                      <Badge variant="outline" className="font-sans text-[11px] flex items-center gap-1">
                        <Fuel className="h-3 w-3 text-slate-500" />
                        {v.fuelType}
                      </Badge>
                    </CardHeader>

                    <CardContent className="pt-4 space-y-3.5">
                      {/* Car Name & Model */}
                      <div>
                        <Link href={`/vehicles/${v._id}`} className="group">
                          <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                            {v.make} {v.model}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>Year {v.manufacturingYear}</span>
                        </p>
                      </div>

                      {/* Current Odometer */}
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                        <span className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Gauge className="h-4 w-4 text-blue-600" />
                          Recorded Odometer
                        </span>
                        <span className="font-bold text-sm text-slate-900 font-mono">
                          {v.currentOdometer.toLocaleString()} km
                        </span>
                      </div>

                      {/* Service Stats Pill */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-md bg-emerald-50/60 border border-emerald-100 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-slate-600">Completed:</span>
                          <strong className="text-emerald-700">{stats.completedAppointments}</strong>
                        </div>
                        <div className="p-2 rounded-md bg-sky-50/60 border border-sky-100 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-sky-600" />
                          <span className="text-slate-600">Pending:</span>
                          <strong className="text-sky-700">{stats.scheduledAppointments}</strong>
                        </div>
                      </div>

                      {/* Live Area Weather & Transit Condition */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-slate-400">Area Weather:</span>
                        <WeatherWidget
                          location={
                            v.registrationNumber.startsWith("DL")
                              ? "Delhi"
                              : v.registrationNumber.startsWith("KA")
                              ? "Bengaluru"
                              : "Pune"
                          }
                          compact={true}
                        />
                      </div>
                    </CardContent>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1 flex-1"
                      onClick={() => {
                        setTargetVehicleId(v._id.toString());
                        setIsAppointmentModalOpen(true);
                      }}
                    >
                      <Wrench className="h-3.5 w-3.5 text-blue-600" />
                      Book Service
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setVehicleToEdit(v);
                          setIsVehicleModalOpen(true);
                        }}
                        title="Edit vehicle specifications"
                        className="h-8 w-8 text-slate-600 hover:text-slate-900"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setVehicleToDelete(v)}
                        title="Delete vehicle"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Vehicle Form Modal (Create / Edit) */}
      <VehicleFormModal
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setVehicleToEdit(null);
        }}
        onSuccess={() => {
          fetchVehicles();
        }}
        vehicleToEdit={vehicleToEdit}
      />

      {/* Appointment Form Modal (Book service for vehicle) */}
      <AppointmentFormModal
        isOpen={isAppointmentModalOpen}
        onClose={() => {
          setIsAppointmentModalOpen(false);
          setTargetVehicleId(undefined);
        }}
        onSuccess={() => {
          fetchVehicles();
        }}
        vehicles={vehicles}
        initialVehicleId={targetVehicleId}
      />

      {/* Confirm Delete Dialog (Destructive Action Confirmation) */}
      <ConfirmDialog
        isOpen={!!vehicleToDelete}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Vehicle"
        message={`Are you sure you want to delete ${vehicleToDelete?.registrationNumber} (${vehicleToDelete?.make} ${vehicleToDelete?.model})? This destructive action will permanently remove the vehicle and its associated service records.`}
        confirmText="Yes, Delete Vehicle"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
