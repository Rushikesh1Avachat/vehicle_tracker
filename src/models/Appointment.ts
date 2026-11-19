import mongoose, { Schema, Model } from "mongoose";
import { IVehicleDocument } from "./Vehicle";

export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";

export interface IAppointmentDocument {
  _id: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId | IVehicleDocument;
  serviceType: string;
  scheduledDate: Date;
  estimatedCost: number;
  serviceCentre: string;
  notes?: string;
  status: AppointmentStatus;
  actualCost?: number;
  completionDate?: Date;
  serviceOdometer?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointmentDocument>(
  {
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle reference is required"],
    },
    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    estimatedCost: {
      type: Number,
      required: [true, "Estimated cost is required"],
      min: [0, "Estimated cost cannot be negative"],
    },
    serviceCentre: {
      type: String,
      required: [true, "Service centre name is required"],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["Scheduled", "Completed", "Cancelled"],
        message: "{VALUE} is not a valid appointment status",
      },
      default: "Scheduled",
      required: true,
    },
    actualCost: {
      type: Number,
      min: [0.01, "Actual cost must be greater than zero"],
    },
    completionDate: {
      type: Date,
    },
    serviceOdometer: {
      type: Number,
      min: [0, "Service odometer cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

AppointmentSchema.index({ vehicle: 1, scheduledDate: -1 });
AppointmentSchema.index({ status: 1, scheduledDate: 1 });

export const Appointment: Model<IAppointmentDocument> =
  mongoose.models.Appointment || mongoose.model<IAppointmentDocument>("Appointment", AppointmentSchema);
