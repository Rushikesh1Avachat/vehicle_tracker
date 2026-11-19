import mongoose, { Schema, Model } from "mongoose";
import { normalizeRegistrationNumber } from "@/types";
export { normalizeRegistrationNumber };

export interface IVehicleDocument {
  _id: mongoose.Types.ObjectId;
  registrationNumber: string;
  make: string;
  model: string;
  manufacturingYear: number;
  fuelType: "Petrol" | "Diesel" | "Electric" | "Hybrid" | "CNG" | "LPG";
  currentOdometer: number;
  nickname?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicleDocument>(
  {
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
      set: (val: string) => normalizeRegistrationNumber(val),
    },
    make: {
      type: String,
      required: [true, "Vehicle make is required"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Vehicle model is required"],
      trim: true,
    },
    manufacturingYear: {
      type: Number,
      required: [true, "Manufacturing year is required"],
      min: [1900, "Manufacturing year cannot be before 1900"],
      max: [new Date().getFullYear() + 1, "Manufacturing year cannot be in the future"],
    },
    fuelType: {
      type: String,
      required: [true, "Fuel type is required"],
      enum: {
        values: ["Petrol", "Diesel", "Electric", "Hybrid", "CNG", "LPG"],
        message: "{VALUE} is not a supported fuel type",
      },
    },
    currentOdometer: {
      type: Number,
      required: [true, "Current odometer reading is required"],
      min: [0, "Odometer reading cannot be negative"],
    },
    nickname: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

VehicleSchema.index({ registrationNumber: 1 }, { unique: true });

export const Vehicle: Model<IVehicleDocument> =
  mongoose.models.Vehicle || mongoose.model<IVehicleDocument>("Vehicle", VehicleSchema);
