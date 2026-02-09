"use client";

import { Label } from "./Label";

interface FormFieldProps {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  success,
  hint,
  required,
  optional,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <Label required={required} optional={optional}>
          {label}
        </Label>
      )}
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && !error && <p className="text-sm text-green-500">{success}</p>}
      {hint && !error && !success && (
        <p className="text-sm text-text-muted">{hint}</p>
      )}
    </div>
  );
}
