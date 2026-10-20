import { useId, type ComponentProps } from "react";

export const inputClass =
  "w-full rounded-md border border-outline-variant bg-surface-container-low px-space-md py-space-sm text-body-md text-on-surface transition-colors placeholder:text-outline focus:border-primary focus:bg-surface-container-lowest aria-[invalid=true]:border-error aria-[invalid=true]:bg-error-container/30";

export const labelClass =
  "mb-space-xs block font-mono text-label-sm uppercase tracking-wider text-on-surface-variant";

export function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-space-xs text-body-sm text-error">
      {children}
    </p>
  );
}

type CommonProps = {
  label: string;
  error?: string;
  /** Wrapper class, e.g. a grid column span. */
  className?: string;
};

export function Field({
  label,
  error,
  className = "",
  ...input
}: CommonProps & Omit<ComponentProps<"input">, "className">) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...input}
      />
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

export function TextAreaField({
  label,
  error,
  className = "",
  ...input
}: CommonProps & Omit<ComponentProps<"textarea">, "className">) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea
        id={id}
        className={`${inputClass} resize-y`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...input}
      />
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
