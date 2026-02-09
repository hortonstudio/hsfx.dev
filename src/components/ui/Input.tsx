"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "error" | "success";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { variant = "default", leftIcon, rightIcon, className = "", ...props },
    ref
  ) => {
    const variantStyles = {
      default: "border-border focus:border-accent focus:ring-accent",
      error: "border-red-500 focus:border-red-500 focus:ring-red-500",
      success: "border-green-500 focus:border-green-500 focus:ring-green-500",
    };

    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-background border rounded-lg px-4 py-3
            text-text-primary placeholder:text-text-dim
            focus:ring-1 focus:outline-none
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            ${variantStyles[variant]}
            ${leftIcon ? "pl-10" : ""}
            ${rightIcon ? "pr-10" : ""}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "error" | "success";
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ variant = "default", className = "", ...props }, ref) => {
    const variantStyles = {
      default: "border-border focus:border-accent focus:ring-accent",
      error: "border-red-500 focus:border-red-500 focus:ring-red-500",
      success: "border-green-500 focus:border-green-500 focus:ring-green-500",
    };

    return (
      <textarea
        ref={ref}
        className={`
          w-full bg-background border rounded-lg px-4 py-3
          text-text-primary placeholder:text-text-dim
          focus:ring-1 focus:outline-none
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed
          resize-y min-h-[100px]
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
