"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AppointmentFormModal } from "@/components/AppointmentFormModal";
import { CompleteAppointmentModal } from "@/components/CompleteAppointmentModal";
import { CancelAppointmentModal } from "@/components/CancelAppointmentModal";
import { VehicleFormModal } from "@/components/VehicleFormModal";
import { WeatherWidget } from "@/components/WeatherWidget";
import { formatDate, formatDateTime, isDateOverdue } from "@/lib/dateUtils";
import { IAppointment, IVehicle } from "@/types";
import {
  Wrench,
  Calendar,
  IndianRupee,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Filter,
  Car,
  FileText,
  Gauge,
} from "lucide-react";

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const initialTimeframe = searchParams.get("timeframe") || "all";

  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [activeTab, setActiveTab] = useState<string>(initialTimeframe);
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<IAppointment | null>(null);
  const [appointmentToComplete, setAppointmentToComplete] = useState<IAppointment | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<IAppointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<IAppointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [apptsRes, vehRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/vehicles"),
      ]);

      const apptsJson = await apptsRes.json();
      const vehJson = await vehRes.json();

      if (!apptsRes.ok || !apptsJson.success) {
        throw new Error(apptsJson.error || "Failed to load appointments");
      }

      setAppointments(apptsJson.data);
      if (vehJson.success) {
        setVehicles(vehJson.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentToDelete._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || "Failed to delete appointment");
        return;
      }
      setAppointmentToDelete(null);
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter appointments according to activeTab and selectedVehicleFilter
  const filteredAppointments = appointments.filter((appt) => {
    // 1. Vehicle filter
    if (selectedVehicleFilter !== "all") {
      const vId =
        typeof appt.vehicle === "object" && appt.vehicle !== null
          ? (appt.vehicle as any)._id?.toString()
          : appt.vehicle?.toString();
      if (vId !== selectedVehicleFilter) return false;
    }

    // 2. Tab filter
    if (activeTab === "all") return true;
    if (activeTab === "completed") return appt.status === "Completed";
    if (activeTab === "cancelled") return appt.status === "Cancelled";
    if (activeTab === "upcoming") {
      return appt.status === "Scheduled" && !isDateOverdue(appt.scheduledDate);
    }
    if (activeTab === "overdue") {
      return appt.status === "Scheduled" && isDateOverdue(appt.scheduledDate);
    }
    if (activeTab === "scheduled") {
      return appt.status === "Scheduled";
    }
    return true;
  });

  const tabCounts = {
    all: appointments.length,
    upcoming: appointments.filter((a) => a.status === "Scheduled" && !isDateOverdue(a.scheduledDate)).length,
    overdue: appointments.filter((a) => a.status === "Scheduled" && isDateOverdue(a.scheduledDate)).length,
    completed: appointments.filter((a) => a.status === "Completed").length,
    cancelled: appointments.filter((a) => a.status === "Cancelled").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onAddVehicleClick={() => setIsVehicleModalOpen(true)}
        onBookServiceClick={() => {
          setAppointmentToEdit(null);
          setIsAppointmentModalOpen(true);
        }}
        onSeedSuccess={fetchData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2.5">
              <Wrench className="h-7 w-7 text-blue-600" />
              Service Appointments
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Create, review, complete, and track service history for your cars.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setAppointmentToEdit(null);
              setIsAppointmentModalOpen(true);
            }}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Book Service Appointment
          </Button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All", count: tabCounts.all },
              { id: "upcoming", label: "Upcoming", count: tabCounts.upcoming },
              { id: "overdue", label: "Overdue", count: tabCounts.overdue, isOverdueAlert: tabCounts.overdue > 0 },
              { id: "completed", label: "Completed", count: tabCounts.completed },
              { id: "cancelled", label: "Cancelled", count: tabCounts.cancelled },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${tab.isOverdueAlert
                        ? "bg-rose-500 text-white font-bold"
                        : isActive
                          ? "bg-slate-700 text-slate-100"
                          : "bg-slate-200 text-slate-700"
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Vehicle Dropdown Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedVehicleFilter}
              onChange={(e) => setSelectedVehicleFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Registered Vehicles</option>
              {vehicles.map((v) => (
                <option key={v._id.toString()} value={v._id.toString()}>
                  {v.registrationNumber} ({v.make} {v.model})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading service records...</div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="text-center py-16 border-dashed">
            <CardContent className="space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No appointments found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No service records match the selected filter tabs or vehicle criteria.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setAppointmentToEdit(null);
                  setIsAppointmentModalOpen(true);
                }}
                className="gap-1.5 mt-2"
              >
                <Plus className="h-4 w-4" />
                Schedule Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3.5">
            {filteredAppointments.map((appt) => {
              const vehicle = appt.vehicle as IVehicle | undefined;
              const overdue = appt.status === "Scheduled" && isDateOverdue(appt.scheduledDate);

              return (
                <Card
                  key={appt._id.toString()}
                  className={`hover:border-blue-300 transition-all ${overdue
                      ? "border-rose-300 bg-rose-50/15"
                      : appt.status === "Completed"
                        ? "border-emerald-200/80 bg-white"
                        : "bg-white"
                    }`}
                >
                  <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Column: Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Reg Number badge */}
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white shadow-xs">
                          {vehicle?.registrationNumber || "UNKNOWN VEHICLE"}
                        </span>
                        <span className="text-xs font-medium text-slate-700">
                          {vehicle?.make} {vehicle?.model}
                        </span>

                        {/* Status Badge */}
                        {overdue ? (
                          <Badge variant="overdue">Overdue</Badge>
                        ) : appt.status === "Completed" ? (
                          <Badge variant="completed">Completed</Badge>
                        ) : appt.status === "Cancelled" ? (
                          <Badge variant="cancelled">Cancelled</Badge>
                        ) : (
                          <Badge variant="scheduled">Scheduled</Badge>
                        )}
                      </div>

                      {/* Service Title */}
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {appt.serviceType}
                      </h3>

                      {/* Detail Pills */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-blue-500" />
                          <span>Scheduled: {formatDateTime(appt.scheduledDate)}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-slate-400" />
                          <span>{appt.serviceCentre}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                          <span>Est. ₹{appt.estimatedCost.toLocaleString()}</span>
                        </span>
                      </div>

                      {/* Completed outcome info */}
                      {appt.status === "Completed" && (
                        <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-emerald-900">
                          <span className="flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Actual Cost: ₹{(appt.actualCost || 0).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                            Completed on: {formatDate(appt.completionDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Gauge className="h-3.5 w-3.5 text-emerald-600" />
                            Service Odometer: {(appt.serviceOdometer || 0).toLocaleString()} km
                          </span>
                        </div>
                      )}

                      {/* Notes / Cancellation Reason */}
                      {appt.notes && (
                        <p className="text-xs text-slate-500 italic flex items-center gap-1 pt-0.5">
                          <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{appt.notes}</span>
                        </p>
                      )}

                      {/* Live Workshop Weather for Scheduled Services */}
                      {appt.status === "Scheduled" && (
                        <WeatherWidget location={appt.serviceCentre} />
                      )}
                    </div>

                    {/* Right Column: Actions */}
                    <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                      {appt.status === "Scheduled" && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => setAppointmentToComplete(appt)}
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
                              setAppointmentToEdit(appt);
                              setIsAppointmentModalOpen(true);
                            }}
                            className="text-xs gap-1"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAppointmentToCancel(appt)}
                            className="text-xs text-slate-500 hover:text-red-600"
                          >
                            Cancel
                          </Button>
                        </>
                      )}

                      {appt.status === "Completed" && (
                        <div className="text-xs text-emerald-700 font-semibold px-2.5 py-1 rounded-md bg-emerald-100/60">
                          Verified &amp; Closed
                        </div>
                      )}

                      {appt.status === "Cancelled" && (
                        <div className="text-xs text-slate-400 font-medium px-2 py-1">
                          Appointment Closed
                        </div>
                      )}

                      {/* Delete destructive action */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setAppointmentToDelete(appt)}
                        title="Delete service record"
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

      {/* Appointment Create/Edit Modal */}
      <AppointmentFormModal
        isOpen={isAppointmentModalOpen}
        onClose={() => {
          setIsAppointmentModalOpen(false);
          setAppointmentToEdit(null);
        }}
        onSuccess={() => {
          fetchData();
        }}
        appointmentToEdit={appointmentToEdit}
        vehicles={vehicles}
      />

      {/* Complete Appointment Modal */}
      <CompleteAppointmentModal
        isOpen={!!appointmentToComplete}
        onClose={() => setAppointmentToComplete(null)}
        onSuccess={() => {
          fetchData();
        }}
        appointment={appointmentToComplete}
      />

      {/* Cancel Appointment Modal */}
      <CancelAppointmentModal
        isOpen={!!appointmentToCancel}
        onClose={() => setAppointmentToCancel(null)}
        onSuccess={() => {
          fetchData();
        }}
        appointment={appointmentToCancel}
      />

      {/* Vehicle Form Modal */}
      <VehicleFormModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
      />

      {/* Confirm Delete Dialog (Destructive Action Confirmation) */}
      <ConfirmDialog
        isOpen={!!appointmentToDelete}
        onClose={() => setAppointmentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Service Appointment"
        message={`Are you sure you want to permanently delete this ${appointmentToDelete?.serviceType} appointment record? This action cannot be undone.`}
        confirmText="Yes, Delete Record"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading appointments...</div>}>
      <AppointmentsContent />
    </Suspense>
  );
}
