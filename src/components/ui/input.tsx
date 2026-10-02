import { type InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, className = "", ...props }, ref) => (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-ink/80 mb-1"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`w-full rounded-md border border-rule bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-lamp/40 focus:border-lamp ${className}`}
        {...props}
      />
    </div>
  )
);
Input.displayName = "Input";