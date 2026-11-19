import { z } from "zod";
import { normalizeRegistrationNumber } from "@/types";

export const FuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid", "CNG", "LPG"] as const;

const currentYear = new Date().getFullYear();

export const vehicleCreateSchema = z.object({
  registrationNumber: z
    .string()
    .min(1, "Registration number is required")
    .transform((val) => normalizeRegistrationNumber(val))
    .refine((val) => /^[A-Z0-9]{4,15}$/.test(val), {
      message: "Registration number must be 4-15 alphanumeric characters (e.g. MH12AB1234)",
    }),
  make: z.string().trim().min(1, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
  manufacturingYear: z.coerce
    .number()
    .int("Year must be a whole number")
    .min(1900, "Manufacturing year cannot be before 1900")
    .max(currentYear + 1, `Manufacturing year cannot exceed ${currentYear + 1}`),
  fuelType: z.enum(FuelTypes, {
    message: "Please select a valid fuel type",
  }),
  currentOdometer: z.coerce
    .number()
    .min(0, "Odometer reading cannot be negative"),
  nickname: z.string().trim().optional().default(""),
});

export const vehicleUpdateSchema = vehicleCreateSchema;

export const appointmentCreateSchema = z.object({
  vehicle: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid vehicle ID"),
  serviceType: z
    .string()
    .trim()
    .min(1, "Service type is required"),
  scheduledDate: z
    .string()
    .min(1, "Scheduled date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Please provide a valid scheduled date",
    }),
  estimatedCost: z.coerce
    .number()
    .min(0, "Estimated cost cannot be negative"),
  serviceCentre: z
    .string()
    .trim()
    .min(1, "Service centre is required"),
  notes: z.string().trim().optional().default(""),
});

export const appointmentUpdateSchema = z.object({
  vehicle: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid vehicle ID")
    .optional(),
  serviceType: z.string().trim().min(1, "Service type is required").optional(),
  scheduledDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Please provide a valid date" })
    .optional(),
  estimatedCost: z.coerce.number().min(0, "Estimated cost cannot be negative").optional(),
  serviceCentre: z.string().trim().min(1, "Service centre is required").optional(),
  notes: z.string().trim().optional(),
});

export const appointmentCompleteSchema = z.object({
  actualCost: z.coerce
    .number()
    .gt(0, "Actual cost must be greater than zero"),
  completionDate: z
    .string()
    .min(1, "Completion date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Please provide a valid completion date",
    }),
  serviceOdometer: z.coerce
    .number()
    .min(0, "Service odometer reading cannot be negative"),
});

export const appointmentCancelSchema = z.object({
  notes: z.string().trim().optional(),
});
