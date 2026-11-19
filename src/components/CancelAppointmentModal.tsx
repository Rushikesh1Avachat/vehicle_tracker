"use client";

import React, { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { IAppointment, IVehicle } from "@/types";
import { XCircle, AlertTriangle } from "lucide-react";

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointment: IAppointment) => void;
  appointment: IAppointment | null;
}

export function CancelAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  appointment,
}: CancelAppointmentModalProps) {
  const [cancellationReason, setCancellationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!appointment) return null;

  const vehicle = appointment.vehicle as IVehicle | undefined;

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/appointments/${appointment._id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: cancellationReason.trim() }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        setErrorMessage(result.error || "Failed to cancel appointment");
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
      title="Cancel Service Appointment"
      description="Cancelled appointments cannot be completed later."
      maxWidth="md"
    >
      <form onSubmit={handleCancel} className="space-y-4">
        {errorMessage && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {errorMessage}
          </div>
        )}

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Important Business Rule Notice</p>
            <p>
              Per policy, <strong>cancelled appointments cannot be completed</strong> once cancelled. If you need to service this vehicle later, a new appointment will need to be scheduled.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-3 bg-slate-50 text-xs space-y-1">
          <p>
            <span className="text-slate-500">Vehicle:</span>{" "}
            <strong>{vehicle?.registrationNumber || "Vehicle"}</strong> ({vehicle?.make} {vehicle?.model})
          </p>
          <p>
            <span className="text-slate-500">Service:</span> {appointment.serviceType}
          </p>
          <p>
            <span className="text-slate-500">Workshop:</span> {appointment.serviceCentre}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for Cancellation (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Owner rescheduled trip, parts not available, decided to do DIY..."
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Keep Appointment
          </Button>
          <Button variant="destructive" size="sm" type="submit" isLoading={isSubmitting} className="gap-1.5">
            <XCircle className="h-4 w-4" />
            Confirm Cancellation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
