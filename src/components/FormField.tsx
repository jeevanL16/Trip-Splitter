import type { PropsWithChildren, ReactElement } from 'react';
import './FormField.css';

interface FormFieldProps extends PropsWithChildren {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function FormField({
  id,
  label,
  error,
  hint,
  required,
  children,
}: FormFieldProps): ReactElement {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={`form-field ${error ? 'form-field-has-error' : ''}`}>
      <label htmlFor={id} className="form-field-label">
        {label}
        {required && <span className="field-required-indicator" aria-hidden="true"> *</span>}
      </label>
      {hint && (
        <span id={hintId} className="form-field-hint">
          {hint}
        </span>
      )}
      <div className="form-field-control">{children}</div>
      {error && (
        <p id={errorId} className="form-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
