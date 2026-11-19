"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { VehicleFormModal } from "@/components/VehicleFormModal";
import { AppointmentFormModal } from "@/components/AppointmentFormModal";
import { CompleteAppointmentModal } from "@/components/CompleteAppointmentModal";
import { CancelAppointmentModal } from "@/components/CancelAppointmentModal";
import { WeatherWidget } from "@/components/WeatherWidget";
import { formatDate, formatDateTime, isDateOverdue } from "@/lib/dateUtils";
import { IVehicle, IAppointment } from "@/types";
import {
  Car,
  Wrench,
  Calendar,
  IndianRupee,
  Gauge,
  Fuel,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  AlertCircle,
  Building,
  FileText,
} from "lucide-react";

interface VehicleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const resolvedParams = use(params);
  const vehicleId = resolvedParams.id;

  const [vehicle, setVehicle] = useState<IVehicle | null>(null);
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<IAppointment | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<IAppointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<IAppointment | null>(null);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);

  const fetchVehicleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load vehicle details");
      }
      setVehicle(json.data);
      setAppointments(json.data.appointments || []);
    } catch (err: any) {
      setError(err.message || "Failed to load vehicle details");
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchVehicleData();
  }, [fetchVehicleData]);

  const handleDeleteAppointmentConfirm = async () => {
    if (!appointmentToDelete) return;
    setIsDeletingAppointment(true);
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
      fetchVehicleData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsDeletingAppointment(false);
    }
  };

  const totalSpentOnVehicle = appointments
    .filter((a) => a.status === "Completed")
    .reduce((sum, a) => sum + (a.actualCost || 0), 0);

  const completedCount = appointments.filter((a) => a.status === "Completed").length;
  const pendingCount = appointments.filter((a) => a.status === "Scheduled").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onBookServiceClick={() => setIsAppointmentModalOpen(true)}
        onSeedSuccess={fetchVehicleData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link */}
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vehicles
        </Link>

        {/* Global Error Banner */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 text-center text-sm text-slate-500">Loading vehicle profile...</div>
        ) : !vehicle ? (
          <Card className="text-center py-16">
            <CardContent>
              <Car className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="text-base font-semibold text-slate-800">Vehicle not found</p>
              <Link href="/vehicles" className="mt-3 inline-block">
                <Button size="sm">Return to Fleet</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Vehicle Hero Card */}
            <Card className="overflow-hidden border-slate-200 shadow-xs">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {/* Plate */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white text-slate-900 font-mono font-bold tracking-wider text-sm shadow-md">
                      <span className="text-xs text-blue-600 font-sans font-bold">IND</span>
                      <span>{vehicle.registrationNumber}</span>
                    </div>

                    <Badge variant="outline" className="border-slate-600 text-slate-200 bg-slate-800/80">
                      <Fuel className="h-3 w-3 mr-1 text-slate-300" />
                      {vehicle.fuelType}
                    </Badge>
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {vehicle.make} {vehicle.model}
                  </h1>

                  {vehicle.nickname && (
                    <p className="text-xs text-slate-300 italic">
                      Nickname: &ldquo;{vehicle.nickname}&rdquo;
                    </p>
                  )}

                  <div className="pt-1">
                    <WeatherWidget
                      location={
                        vehicle.registrationNumber.startsWith("DL")
                          ? "Delhi"
                          : vehicle.registrationNumber.startsWith("KA")
                          ? "Bengaluru"
                          : "Pune"
                      }
                      compact={true}
                    />
                  </div>
                </div>

                {/* Hero Actions */}
                <div className="flex items-center gap-2.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(true)}
                    className="border-slate-600 bg-slate-800/80 text-white hover:bg-slate-700 text-xs gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsAppointmentModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-xs gap-1.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Schedule Service
                  </Button>
                </div>
              </div>

              {/* Specs & Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white p-4">
                <div className="p-3 text-center sm:text-left">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Recorded Odometer
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                    {vehicle.currentOdometer.toLocaleString()} km
                  </span>
                </div>

                <div className="p-3 text-center sm:text-left">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Manufacturing Year
                  </span>
                  <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                    {vehicle.manufacturingYear}
                  </span>
                </div>

                <div className="p-3 text-center sm:text-left">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Services Done / Pending
                  </span>
                  <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                    <span className="text-emerald-600">{completedCount}</span> /{" "}
                    <span className="text-sky-600">{pendingCount}</span>
                  </span>
                </div>

                <div className="p-3 text-center sm:text-left">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Total Money Spent
                  </span>
                  <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                    ₹{totalSpentOnVehicle.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Service History Timeline Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-blue-600" />
                    Service &amp; Maintenance History ({appointments.length})
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Complete chronological timeline of maintenance services for {vehicle.registrationNumber}.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Book Service
                </Button>
              </CardHeader>

              <CardContent className="space-y-3 pt-2">
                {appointments.length === 0 ? (
                  <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6">
                    <Wrench className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-700">No service records yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Schedule routine maintenance, oil changes, or repairs to maintain this car&apos;s logbook.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setIsAppointmentModalOpen(true)}
                      className="mt-4 text-xs gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Book First Service
                    </Button>
                  </div>
                ) : (
                  appointments.map((appt) => {
                    const overdue =
                      appt.status === "Scheduled" && isDateOverdue(appt.scheduledDate);

                    return (
                      <div
                        key={appt._id.toString()}
                        className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          overdue
                            ? "border-rose-300 bg-rose-50/20"
                            : appt.status === "Completed"
                            ? "border-emerald-200/80 bg-white"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {overdue ? (
                              <Badge variant="overdue">Overdue</Badge>
                            ) : appt.status === "Completed" ? (
                              <Badge variant="completed">Completed</Badge>
                            ) : appt.status === "Cancelled" ? (
                              <Badge variant="cancelled">Cancelled</Badge>
                            ) : (
                              <Badge variant="scheduled">Scheduled</Badge>
                            )}

                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {formatDateTime(appt.scheduledDate)}
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-sm leading-snug">
                            {appt.serviceType}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <Building className="h-3.5 w-3.5 text-slate-400" />
                              {appt.serviceCentre}
                            </span>
                            <span className="flex items-center gap-1">
                              <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                              Est: ₹{appt.estimatedCost.toLocaleString()}
                            </span>
                          </div>

                          {appt.status === "Completed" && (
                            <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-900">
                              <span className="font-semibold flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Final Bill: ₹{(appt.actualCost || 0).toLocaleString()}
                              </span>
                              <span>Completed: {formatDate(appt.completionDate)}</span>
                              <span>Service Odo: {(appt.serviceOdometer || 0).toLocaleString()} km</span>
                            </div>
                          )}

                          {appt.notes && (
                            <p className="text-xs text-slate-500 italic flex items-center gap-1 pt-1">
                              <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{appt.notes}</span>
                            </p>
                          )}

                          {appt.status === "Scheduled" && (
                            <WeatherWidget location={appt.serviceCentre} />
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                          {appt.status === "Scheduled" && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => setAppointmentToComplete(appt)}
                                className="text-xs gap-1"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Complete
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
                    );
                  })
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Edit Vehicle Modal */}
      {vehicle && (
        <VehicleFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            fetchVehicleData();
          }}
          vehicleToEdit={vehicle}
        />
      )}

      {/* Book Service Modal for this vehicle */}
      {vehicle && (
        <AppointmentFormModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          onSuccess={() => {
            fetchVehicleData();
          }}
          vehicles={[vehicle]}
          initialVehicleId={vehicle._id.toString()}
        />
      )}

      {/* Complete Appointment Modal */}
      <CompleteAppointmentModal
        isOpen={!!appointmentToComplete}
        onClose={() => setAppointmentToComplete(null)}
        onSuccess={() => {
          fetchVehicleData();
        }}
        appointment={appointmentToComplete}
      />

      {/* Cancel Appointment Modal */}
      <CancelAppointmentModal
        isOpen={!!appointmentToCancel}
        onClose={() => setAppointmentToCancel(null)}
        onSuccess={() => {
          fetchVehicleData();
        }}
        appointment={appointmentToCancel}
      />

      {/* Confirm Delete Appointment Dialog */}
      <ConfirmDialog
        isOpen={!!appointmentToDelete}
        onClose={() => setAppointmentToDelete(null)}
        onConfirm={handleDeleteAppointmentConfirm}
        title="Delete Service Record"
        message={`Are you sure you want to delete the record for "${appointmentToDelete?.serviceType}"? This action cannot be undone.`}
        confirmText="Yes, Delete Record"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeletingAppointment}
      />
    </div>
  );
}

