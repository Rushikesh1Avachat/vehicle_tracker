import React, { HTMLAttributes } from "react";
import clsx from "clsx";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "destructive"
    | "outline"
    | "overdue"
    | "scheduled"
    | "completed"
    | "cancelled";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-blue-100 text-blue-800 border-blue-200",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    destructive: "bg-red-100 text-red-800 border-red-200",
    outline: "border-slate-300 text-slate-700 bg-white",
    // Semantic mappings for appointments
    scheduled: "bg-sky-50 text-sky-700 border-sky-300 font-medium",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-300 font-medium",
    cancelled: "bg-zinc-100 text-zinc-600 border-zinc-300 line-through font-medium",
    overdue: "bg-rose-100 text-rose-800 border-rose-300 font-semibold animate-pulse",
  };

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

