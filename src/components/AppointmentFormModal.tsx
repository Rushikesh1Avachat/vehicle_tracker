"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { WeatherWidget } from "./WeatherWidget";
import { IAppointment, IVehicle } from "@/types";
import { Wrench, Calendar, DollarSign, Building, FileText, Car, AlertCircle } from "lucide-react";

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointment: IAppointment) => void;
  appointmentToEdit?: IAppointment | null;
  vehicles: IVehicle[];
  initialVehicleId?: string;
}

const COMMON_SERVICE_TYPES = [
  "Routine Maintenance",
  "Engine Oil & Filter Change",
  "Brake Inspection & Pad Replacement",
  "Wheel Alignment & Tire Balancing",
  "Tire Replacement",
  "Battery Diagnostics & Replacement",
  "Air Conditioning Service",
  "Transmission Fluid Change",
  "Full Vehicle Inspection",
];

export function AppointmentFormModal({
  isOpen,
  onClose,
  onSuccess,
  appointmentToEdit,
  vehicles,
  initialVehicleId,
}: AppointmentFormModalProps) {
  const getDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    // Format YYYY-MM-DDTHH:MM for datetime-local
    return d.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    vehicle: initialVehicleId || (vehicles[0]?._id?.toString() || ""),
    serviceType: "Routine Maintenance",
    scheduledDate: getDefaultDate(),
    estimatedCost: 2500,
    serviceCentre: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (appointmentToEdit) {
      const vId =
        typeof appointmentToEdit.vehicle === "object" && appointmentToEdit.vehicle !== null
          ? (appointmentToEdit.vehicle as any)._id?.toString()
          : appointmentToEdit.vehicle?.toString();

      const d = new Date(appointmentToEdit.scheduledDate);
      const localIso = !isNaN(d.getTime()) ? d.toISOString().slice(0, 16) : getDefaultDate();

      setFormData({
        vehicle: vId || "",
        serviceType: appointmentToEdit.serviceType || "Routine Maintenance",
        scheduledDate: localIso,
        estimatedCost: appointmentToEdit.estimatedCost ?? 0,
        serviceCentre: appointmentToEdit.serviceCentre || "",
        notes: appointmentToEdit.notes || "",
      });
    } else {
      setFormData({
        vehicle: initialVehicleId || (vehicles[0]?._id?.toString() || ""),
        serviceType: "Routine Maintenance",
        scheduledDate: getDefaultDate(),
        estimatedCost: 2500,
        serviceCentre: "",
        notes: "",
      });
    }
    setErrorMessage(null);
    setFieldErrors({});
  }, [appointmentToEdit, isOpen, initialVehicleId, vehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const url = appointmentToEdit
        ? `/api/appointments/${appointmentToEdit._id}`
        : "/api/appointments";
      const method = appointmentToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          scheduledDate: new Date(formData.scheduledDate).toISOString(),
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        if (result.details && Array.isArray(result.details)) {
          const errorsMap: Record<string, string> = {};
          result.details.forEach((err: { field: string; message: string }) => {
            errorsMap[err.field] = err.message;
          });
          setFieldErrors(errorsMap);
        }
        setErrorMessage(result.error || "Failed to schedule service appointment.");
        return;
      }

      onSuccess(result.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVehicleObj = vehicles.find((v) => v._id.toString() === formData.vehicle);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={appointmentToEdit ? "Reschedule / Edit Service" : "Book Service Appointment"}
      description="Schedule maintenance for your car with estimated budget and preferred workshop."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium">Action Failed</p>
              <p className="text-xs mt-0.5 text-red-600">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Vehicle Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Car className="h-3.5 w-3.5 text-slate-400" />
            Vehicle <span className="text-red-500">*</span>
          </label>
          {vehicles.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              No vehicles registered yet. Please add a vehicle first before scheduling a service.
            </div>
          ) : (
            <select
              required
              value={formData.vehicle}
              onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.vehicle
                  ? "border-red-400 focus:ring-red-200"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
            >
              {vehicles.map((v) => (
                <option key={v._id.toString()} value={v._id.toString()}>
                  {v.registrationNumber} — {v.make} {v.model} ({v.currentOdometer.toLocaleString()} km)
                  {v.nickname ? ` [${v.nickname}]` : ""}
                </option>
              ))}
            </select>
          )}
          {fieldErrors.vehicle && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.vehicle}</p>}
          {selectedVehicleObj && (
            <p className="text-[11px] text-slate-500 mt-1">
              Current recorded odometer: <strong className="font-semibold text-slate-700">{selectedVehicleObj.currentOdometer.toLocaleString()} km</strong>
            </p>
          )}
        </div>

        {/* Service Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-slate-400" />
            Service Type <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            list="service-type-suggestions"
            placeholder="e.g. Periodic Maintenance, Oil Change"
            value={formData.serviceType}
            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              fieldErrors.serviceType
                ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />
          <datalist id="service-type-suggestions">
            {COMMON_SERVICE_TYPES.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
          {fieldErrors.serviceType && (
            <p className="text-[11px] text-red-600 mt-1">{fieldErrors.serviceType}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Scheduled Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Scheduled Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.scheduledDate
                  ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />
            {fieldErrors.scheduledDate && (
              <p className="text-[11px] text-red-600 mt-1">{fieldErrors.scheduledDate}</p>
            )}
          </div>

          {/* Estimated Cost */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-slate-400" />
              Estimated Cost (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              step={50}
              placeholder="e.g. 3500"
              value={formData.estimatedCost}
              onChange={(e) =>
                setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.estimatedCost
                  ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />
            {fieldErrors.estimatedCost && (
              <p className="text-[11px] text-red-600 mt-1">{fieldErrors.estimatedCost}</p>
            )}
          </div>
        </div>

        {/* Service Centre */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-slate-400" />
            Service Centre / Workshop Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Authorized Apex Honda Care, Downtown"
            value={formData.serviceCentre}
            onChange={(e) => setFormData({ ...formData, serviceCentre: e.target.value })}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              fieldErrors.serviceCentre
                ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />
          {fieldErrors.serviceCentre && (
            <p className="text-[11px] text-red-600 mt-1">{fieldErrors.serviceCentre}</p>
          )}
          {formData.serviceCentre.trim().length >= 3 && (
            <div className="mt-1.5">
              <WeatherWidget location={formData.serviceCentre} compact={true} />
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            Optional Notes & Instructions
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Check AC cooling, replace air filter, wheel vibration check"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="sm" type="submit" isLoading={isSubmitting} disabled={vehicles.length === 0}>
            {appointmentToEdit ? "Save Changes" : "Confirm Schedule"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
