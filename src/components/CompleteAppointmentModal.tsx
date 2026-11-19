"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { IAppointment, IVehicle } from "@/types";
import { CheckCircle2, DollarSign, Calendar, Gauge, AlertCircle, Info } from "lucide-react";

interface CompleteAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointment: IAppointment) => void;
  appointment: IAppointment | null;
}

export function CompleteAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  appointment,
}: CompleteAppointmentModalProps) {
  const getTodayIso = () => new Date().toISOString().slice(0, 10);

  const vehicle = appointment?.vehicle as IVehicle | undefined;
  const recordedOdometer = vehicle?.currentOdometer ?? 0;

  const [formData, setFormData] = useState({
    actualCost: appointment?.estimatedCost || 0,
    completionDate: getTodayIso(),
    serviceOdometer: recordedOdometer,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (appointment) {
      const v = appointment.vehicle as IVehicle | undefined;
      const odo = v?.currentOdometer ?? 0;
      setFormData({
        actualCost: appointment.estimatedCost || 0,
        completionDate: getTodayIso(),
        serviceOdometer: odo,
      });
    }
    setErrorMessage(null);
    setFieldErrors({});
  }, [appointment, isOpen]);

  if (!appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    // Client-side quick checks
    if (formData.actualCost <= 0) {
      setFieldErrors((prev) => ({ ...prev, actualCost: "Actual cost must be greater than zero." }));
      setIsSubmitting(false);
      return;
    }

    if (formData.serviceOdometer < 0) {
      setFieldErrors((prev) => ({ ...prev, serviceOdometer: "Odometer reading cannot be negative." }));
      setIsSubmitting(false);
      return;
    }

    if (formData.serviceOdometer < recordedOdometer) {
      setFieldErrors((prev) => ({
        ...prev,
        serviceOdometer: `Service odometer cannot be lower than the vehicle's recorded reading (${recordedOdometer.toLocaleString()} km).`,
      }));
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/appointments/${appointment._id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualCost: formData.actualCost,
          completionDate: new Date(formData.completionDate).toISOString(),
          serviceOdometer: formData.serviceOdometer,
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
        setErrorMessage(result.error || "Failed to mark service as completed.");
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Service Appointment"
      description="Record the actual service bill and the vehicle's odometer reading upon service completion."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium">Completion Blocked</p>
              <p className="text-xs mt-0.5 text-red-600">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Vehicle & Service Context Pill */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Service:</span>
            <span className="font-semibold text-slate-800">{appointment.serviceType}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Vehicle:</span>
            <span className="font-medium text-slate-800">
              {vehicle?.registrationNumber || "Vehicle"} ({vehicle?.make} {vehicle?.model})
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
            <span className="text-slate-500">Recorded Vehicle Odometer:</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              {recordedOdometer.toLocaleString()} km
            </span>
          </div>
        </div>

        {/* Actual Cost */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-slate-400" />
              Actual Final Cost (₹) <span className="text-red-500">*</span>
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              Estimated: ₹{appointment.estimatedCost.toLocaleString()}
            </span>
          </label>
          <input
            type="number"
            required
            min={0.01}
            step="any"
            placeholder="e.g. 4850"
            value={formData.actualCost}
            onChange={(e) =>
              setFormData({ ...formData, actualCost: parseFloat(e.target.value) || 0 })
            }
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${fieldErrors.actualCost
                ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
          />
          {fieldErrors.actualCost ? (
            <p className="text-[11px] text-red-600 mt-1">{fieldErrors.actualCost}</p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1">Must be greater than zero.</p>
          )}
        </div>

        {/* Completion Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Date of Completion <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.completionDate}
            onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${fieldErrors.completionDate
                ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
          />
          {fieldErrors.completionDate && (
            <p className="text-[11px] text-red-600 mt-1">{fieldErrors.completionDate}</p>
          )}
        </div>

        {/* Service Odometer */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-slate-400" />
              Service Odometer Reading (km) <span className="text-red-500">*</span>
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              Min: {recordedOdometer.toLocaleString()} km
            </span>
          </label>
          <input
            type="number"
            required
            min={recordedOdometer}
            value={formData.serviceOdometer}
            onChange={(e) =>
              setFormData({ ...formData, serviceOdometer: parseFloat(e.target.value) || 0 })
            }
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${fieldErrors.serviceOdometer
                ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
          />
          {fieldErrors.serviceOdometer ? (
            <p className="text-[11px] text-red-600 mt-1">{fieldErrors.serviceOdometer}</p>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <Info className="h-3 w-3 text-blue-500" />
              <span>Vehicle&apos;s current odometer will automatically update to this reading.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="success" size="sm" type="submit" isLoading={isSubmitting} className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Confirm Completion
          </Button>
        </div>
      </form>
    </Modal>
  );
}
