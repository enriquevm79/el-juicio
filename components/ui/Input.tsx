"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm text-secondary font-medium">{label}</label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 bg-surface-light border border-secondary/20 rounded-xl
            text-foreground placeholder:text-text-muted
            focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50
            transition-all duration-200
            ${error ? "border-danger focus:border-danger focus:ring-danger/50" : ""}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
