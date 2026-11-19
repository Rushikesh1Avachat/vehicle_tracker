"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VehicleFormModal } from "@/components/VehicleFormModal";
import { AppointmentFormModal } from "@/components/AppointmentFormModal";
import { CompleteAppointmentModal } from "@/components/CompleteAppointmentModal";
import { CancelAppointmentModal } from "@/components/CancelAppointmentModal";
import { WeatherWidget, ServiceWeatherHub } from "@/components/WeatherWidget";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import { IVehicle, IAppointment } from "@/types";
import {
  Car,
  Calendar,
  AlertTriangle,
  IndianRupee,
  Wrench,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Building,
  Fuel,
  Info,
} from "lucide-react";

interface DashboardData {
  metrics: {
    totalVehicles: number;
    upcomingAppointments: number;
    overdueAppointments: number;
    totalExpenditure: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageCostPerCompletedService: number;
  };
  dateBoundary: {
    definition: string;
    startOfToday: string;
  };
  upcomingAppointments: IAppointment[];
  overdueAppointments: IAppointment[];
  recentCompleted: IAppointment[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointmentForComplete, setSelectedAppointmentForComplete] =
    useState<IAppointment | null>(null);
  const [selectedAppointmentForCancel, setSelectedAppointmentForCancel] =
    useState<IAppointment | null>(null);
  const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] =
    useState<IAppointment | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashRes, vehRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/vehicles"),
      ]);

      const dashJson = await dashRes.json();
      const vehJson = await vehRes.json();

      if (!dashRes.ok || !dashJson.success) {
        throw new Error(dashJson.error || "Failed to load dashboard data");
      }

      setData(dashJson.data);
      if (vehJson.success) {
        setVehicles(vehJson.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch data from database");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onAddVehicleClick={() => setIsVehicleModalOpen(true)}
        onBookServiceClick={() => {
          setSelectedAppointmentForEdit(null);
          setIsAppointmentModalOpen(true);
        }}
        onSeedSuccess={fetchData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Top Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Service &amp; Maintenance Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live car care analytics, scheduled maintenance tracking, and expenditure reports.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedAppointmentForEdit(null);
                setIsAppointmentModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Schedule Service
            </Button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Failed to connect to database records</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Try Again
            </Button>
          </div>
        )}

        {/* Overdue Warning Alert Banner if there are overdue appointments */}
        {data && data.metrics.overdueAppointments > 0 && (
          <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-rose-200 text-rose-800 shrink-0 mt-0.5">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-rose-900">
                    Attention Required: {data.metrics.overdueAppointments} Service Appointment
                    {data.metrics.overdueAppointments > 1 ? "s are" : " is"} Overdue
                  </h2>
                  <p className="text-xs text-rose-700 mt-0.5">
                    These services were scheduled for earlier calendar dates but have not yet been marked completed or cancelled.
                  </p>
                </div>
              </div>
              <Link href="/appointments?timeframe=overdue">
                <Button variant="destructive" size="sm" className="gap-1.5 text-xs whitespace-nowrap">
                  Review Overdue Appointments
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Top 4 KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Vehicles */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Vehicles
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Car className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {isLoading ? "--" : data?.metrics.totalVehicles ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>Registered in system</span>
                <Link href="/vehicles" className="text-blue-600 hover:underline font-medium">
                  View all &rarr;
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Upcoming Appointments */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Upcoming Services
              </CardTitle>
              <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                <Calendar className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-700">
                {isLoading ? "--" : data?.metrics.upcomingAppointments ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Scheduled for today &amp; future dates
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Overdue Appointments */}
          <Card className={`hover:shadow-md transition-shadow ${data && data.metrics.overdueAppointments > 0 ? "border-rose-300 bg-rose-50/30" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Overdue Services
              </CardTitle>
              <div className={`p-2 rounded-lg ${data && data.metrics.overdueAppointments > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                <Clock className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data && data.metrics.overdueAppointments > 0 ? "text-rose-600" : "text-slate-900"}`}>
                {isLoading ? "--" : data?.metrics.overdueAppointments ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Scheduled date before today (00:00)
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Total Actual Expenditure */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Expenditure
              </CardTitle>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <IndianRupee className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">
                {isLoading
                  ? "--"
                  : `₹${(data?.metrics.totalExpenditure || 0).toLocaleString("en-IN")}`}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                On {data?.metrics.completedAppointments || 0} completed service{data?.metrics.completedAppointments === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Live OpenWeather Service Hub */}
        <ServiceWeatherHub defaultLocations={["Pune", "Delhi", "Bengaluru", "Mumbai"]} />

        {/* Main Content Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 cols): Upcoming Appointments List */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Upcoming Service Appointments
                  </CardTitle>
                  <CardDescription>
                    Sorted chronologically by scheduled appointment date.
                  </CardDescription>
                </div>
                <Link href="/appointments?timeframe=upcoming">
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    View All
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="py-8 text-center text-sm text-slate-500">Loading appointments...</div>
                ) : !data?.upcomingAppointments || data.upcomingAppointments.length === 0 ? (
                  <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6">
                    <Wrench className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-700">No upcoming appointments scheduled</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      All your vehicles are currently up to date, or you can book an upcoming service routine.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedAppointmentForEdit(null);
                        setIsAppointmentModalOpen(true);
                      }}
                      className="mt-4 gap-1.5 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Book Next Service
                    </Button>
                  </div>
                ) : (
                  data.upcomingAppointments.map((appt) => {
                    const vehicle = appt.vehicle as IVehicle | undefined;
                    return (
                      <div
                        key={appt._id.toString()}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-xs transition-all"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300">
                              {vehicle?.registrationNumber || "VEHICLE"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {vehicle?.make} {vehicle?.model}
                            </span>
                            <Badge variant="scheduled">Scheduled</Badge>
                          </div>

                          <h4 className="font-semibold text-slate-900 text-sm">{appt.serviceType}</h4>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <Calendar className="h-3.5 w-3.5 text-blue-500" />
                              {formatDateTime(appt.scheduledDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building className="h-3.5 w-3.5 text-slate-400" />
                              {appt.serviceCentre}
                            </span>
                            <span className="flex items-center gap-1">
                              <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                              Est: ₹{appt.estimatedCost.toLocaleString()}
                            </span>
                          </div>
                          {appt.notes && (
                            <p className="text-xs text-slate-500 italic truncate max-w-md">
                              Note: {appt.notes}
                            </p>
                          )}
                          <WeatherWidget location={appt.serviceCentre} />
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => setSelectedAppointmentForComplete(appt)}
                            className="gap-1 text-xs"
                            title="Complete service and record actual cost & odometer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAppointmentForEdit(appt);
                              setIsAppointmentModalOpen(true);
                            }}
                            className="text-xs"
                          >
                            Reschedule
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAppointmentForCancel(appt)}
                            className="text-xs text-slate-500 hover:text-red-600"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Overdue appointments section (if any) */}
            {data && data.overdueAppointments && data.overdueAppointments.length > 0 && (
              <Card className="border-rose-200 bg-rose-50/20">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-rose-800">
                      <AlertTriangle className="h-5 w-5 text-rose-600" />
                      Overdue Appointments (Needs Attention)
                    </CardTitle>
                    <CardDescription className="text-rose-600/80">
                      Scheduled date has elapsed. Complete them or mark as cancelled.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.overdueAppointments.map((appt) => {
                    const vehicle = appt.vehicle as IVehicle | undefined;
                    return (
                      <div
                        key={appt._id.toString()}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-rose-200 bg-white"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                              {vehicle?.registrationNumber || "VEHICLE"}
                            </span>
                            <span className="text-xs text-slate-600">
                              {vehicle?.make} {vehicle?.model}
                            </span>
                            <Badge variant="overdue">Overdue</Badge>
                          </div>
                          <p className="font-semibold text-slate-900 text-sm">{appt.serviceType}</p>
                          <p className="text-xs text-rose-600 font-medium">
                            Was scheduled on: {formatDateTime(appt.scheduledDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => setSelectedAppointmentForComplete(appt)}
                            className="text-xs gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Complete
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSelectedAppointmentForCancel(appt)}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column (1 col): Recent Vehicles & Business Logic Specs */}
          <div className="space-y-6">
            {/* Quick Registered Vehicles Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-600" />
                  Your Garage
                </CardTitle>
                <Link href="/vehicles" className="text-xs font-medium text-blue-600 hover:underline">
                  Manage ({vehicles.length})
                </Link>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {vehicles.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-500">No vehicles registered yet.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsVehicleModalOpen(true)}
                      className="mt-3 text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add First Car
                    </Button>
                  </div>
                ) : (
                  vehicles.slice(0, 4).map((veh) => (
                    <div
                      key={veh._id.toString()}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-slate-800">
                            {veh.registrationNumber}
                          </span>
                          {veh.nickname && (
                            <span className="text-[11px] text-slate-500 italic">
                              ({veh.nickname})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">
                          {veh.make} {veh.model} &bull; {veh.manufacturingYear}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-800 block">
                          {veh.currentOdometer.toLocaleString()} km
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                          <Fuel className="h-2.5 w-2.5" />
                          {veh.fuelType}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Date Boundaries & Business Rules Info Card */}
            <Card className="border-blue-100 bg-blue-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-900">
                  <Info className="h-4 w-4 text-blue-600" />
                  Date Boundaries &amp; Business Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
                <div>
                  <p className="font-semibold text-slate-800">Date Boundaries Defined:</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <strong>Upcoming:</strong> Status is <em>Scheduled</em> and appointment date is on or after <code>00:00:00</code> of today.
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <strong>Overdue:</strong> Status is <em>Scheduled</em> and appointment date is strictly before <code>00:00:00</code> of today.
                  </p>
                </div>

                <div className="pt-2 border-t border-blue-200/50">
                  <p className="font-semibold text-slate-800">Enforced Business Rules:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 mt-1">
                    <li>Registration numbers are strictly unique and normalized (spaces stripped, uppercased).</li>
                    <li>Service completion requires <code>actualCost &gt; 0</code>.</li>
                    <li>Service odometer cannot be negative or lower than vehicle&apos;s current recorded reading.</li>
                    <li>Upon completion, the car&apos;s current odometer reading automatically updates if higher.</li>
                    <li>Cancelled appointments cannot be completed.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Feature Modals */}
      <VehicleFormModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
      />

      <AppointmentFormModal
        isOpen={isAppointmentModalOpen}
        onClose={() => {
          setIsAppointmentModalOpen(false);
          setSelectedAppointmentForEdit(null);
        }}
        onSuccess={() => {
          fetchData();
        }}
        appointmentToEdit={selectedAppointmentForEdit}
        vehicles={vehicles}
      />

      <CompleteAppointmentModal
        isOpen={!!selectedAppointmentForComplete}
        onClose={() => setSelectedAppointmentForComplete(null)}
        onSuccess={() => {
          fetchData();
        }}
        appointment={selectedAppointmentForComplete}
      />

      <CancelAppointmentModal
        isOpen={!!selectedAppointmentForCancel}
        onClose={() => setSelectedAppointmentForCancel(null)}
        onSuccess={() => {
          fetchData();
        }}
        appointment={selectedAppointmentForCancel}
      />
    </div>
  );
}
