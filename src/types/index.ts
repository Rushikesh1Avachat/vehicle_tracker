export type FuelType = "Petrol" | "Diesel" | "Electric" | "Hybrid" | "CNG" | "LPG";

export interface IVehicle {
  _id: string;
  registrationNumber: string;
  make: string;
  model: string;
  manufacturingYear: number;
  fuelType: FuelType;
  currentOdometer: number;
  nickname?: string;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    totalAppointments: number;
    completedAppointments: number;
    scheduledAppointments: number;
  };
}

export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";

export interface IAppointment {
  _id: string;
  vehicle: string | IVehicle;
  serviceType: string;
  scheduledDate: string;
  estimatedCost: number;
  serviceCentre: string;
  notes?: string;
  status: AppointmentStatus;
  actualCost?: number;
  completionDate?: string;
  serviceOdometer?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function normalizeRegistrationNumber(rawReg: string): string {
  if (!rawReg) return "";
  // Removes all whitespace and transforms to uppercase: "mh 12 ab 1234" -> "MH12AB1234"
  return rawReg.trim().replace(/\s+/g, "").toUpperCase();
}

