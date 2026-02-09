"use client";

import { forwardRef } from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  optional?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, required, optional, className = "", ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`text-sm font-medium text-text-secondary ${className}`}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && (
          <span className="text-text-dim ml-1 font-normal">(optional)</span>
        )}
      </label>
    );
  }
);

Label.displayName = "Label";
