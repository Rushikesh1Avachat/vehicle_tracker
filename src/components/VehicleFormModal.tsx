"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { IVehicle, normalizeRegistrationNumber } from "@/types";
import { FuelTypes } from "@/lib/validations";
import { Car, Hash, Gauge, Calendar, Fuel, Tag, AlertCircle } from "lucide-react";

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vehicle: IVehicle) => void;
  vehicleToEdit?: IVehicle | null;
}

export function VehicleFormModal({
  isOpen,
  onClose,
  onSuccess,
  vehicleToEdit,
}: VehicleFormModalProps) {
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    registrationNumber: "",
    make: "",
    model: "",
    manufacturingYear: currentYear,
    fuelType: "Petrol" as (typeof FuelTypes)[number],
    currentOdometer: 0,
    nickname: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vehicleToEdit) {
      setFormData({
        registrationNumber: vehicleToEdit.registrationNumber || "",
        make: vehicleToEdit.make || "",
        model: vehicleToEdit.model || "",
        manufacturingYear: vehicleToEdit.manufacturingYear || currentYear,
        fuelType: vehicleToEdit.fuelType || "Petrol",
        currentOdometer: vehicleToEdit.currentOdometer ?? 0,
        nickname: vehicleToEdit.nickname || "",
      });
    } else {
      setFormData({
        registrationNumber: "",
        make: "",
        model: "",
        manufacturingYear: currentYear,
        fuelType: "Petrol",
        currentOdometer: 0,
        nickname: "",
      });
    }
    setErrorMessage(null);
    setFieldErrors({});
  }, [vehicleToEdit, isOpen, currentYear]);

  const normalizedPreview = normalizeRegistrationNumber(formData.registrationNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const url = vehicleToEdit ? `/api/vehicles/${vehicleToEdit._id}` : "/api/vehicles";
      const method = vehicleToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
        setErrorMessage(result.error || "Failed to save vehicle details.");
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
      title={vehicleToEdit ? "Edit Vehicle Details" : "Register New Vehicle"}
      description="Enter vehicle specifications. Registration number will be automatically normalized."
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

        {/* License Plate Visual Preview */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
            Normalized Registration Number
          </span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border-2 border-slate-800 shadow-xs font-mono font-bold tracking-widest text-slate-900 text-sm">
            <span className="text-blue-600 text-xs font-sans">IND</span>
            <span>{normalizedPreview || "MH12AB1234"}</span>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Registration Number */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-slate-400" />
              Registration Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. mh 12 ab 1234"
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-2 ${
                fieldErrors.registrationNumber
                  ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />
            {fieldErrors.registrationNumber && (
              <p className="text-[11px] text-red-600 mt-1">{fieldErrors.registrationNumber}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Spaces and casing are automatically normalized (e.g. &apos;mh12 ab 1234&apos; &rarr; &apos;MH12AB1234&apos;).
            </p>
          </div>

          {/* Make */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5 text-slate-400" />
              Make (Brand) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Honda, Toyota, Tata"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.make
                  ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />
            {fieldErrors.make && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.make}</p>}
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5 text-slate-400" />
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. City ZX, Nexon EV, Innova"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.model
                  ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />
            {fieldErrors.model && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.model}</p>}
          </div>

          {/* Manufacturing Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Manufacturing Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1900}
              max={currentYear + 1}
              value={formData.manufacturingYear}
              onChange={(e) =>
                setFormData({ ...formData, manufacturingYear: parseInt(e.target.value) || 0 })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.manufacturingYear
                  ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />
            {fieldErrors.manufacturingYear && (
              <p className="text-[11px] text-red-600 mt-1">{fieldErrors.manufacturingYear}</p>
            )}
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5 text-slate-400" />
              Fuel Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.fuelType}
              onChange={(e) =>
                setFormData({ ...formData, fuelType: e.target.value as (typeof FuelTypes)[number] })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {FuelTypes.map((fuel) => (
                <option key={fuel} value={fuel}>
                  {fuel}
                </option>
              ))}
            </select>
          </div>

          {/* Current Odometer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-slate-400" />
              Current Odometer (km) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              value={formData.currentOdometer}
              onChange={(e) =>
                setFormData({ ...formData, currentOdometer: parseFloat(e.target.value) || 0 })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.currentOdometer
                  ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />
            {fieldErrors.currentOdometer && (
              <p className="text-[11px] text-red-600 mt-1">{fieldErrors.currentOdometer}</p>
            )}
            {vehicleToEdit && (
              <p className="text-[10px] text-slate-400 mt-1">
                Recorded: {vehicleToEdit.currentOdometer.toLocaleString()} km (cannot be lowered).
              </p>
            )}
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              Optional Nickname
            </label>
            <input
              type="text"
              placeholder="e.g. City Cruiser, Family Roadie"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="sm" type="submit" isLoading={isSubmitting}>
            {vehicleToEdit ? "Save Changes" : "Register Vehicle"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
