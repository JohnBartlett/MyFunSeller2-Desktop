import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';

interface InputProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'email';
  placeholder?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  className?: string;
}

export function Input({
  label,
  name,
  type = 'text',
  placeholder,
  register,
  error,
  required,
  className = '',
}: InputProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name, { valueAsNumber: type === 'number' })}
        className={`w-full px-3 py-2 bg-background border ${
          error ? 'border-red-500' : 'border-border'
        } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error.message}</p>}
    </div>
  );
}

interface TextareaProps {
  label: string;
  name: string;
  placeholder?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  rows?: number;
  className?: string;
}

export function Textarea({
  label,
  name,
  placeholder,
  register,
  error,
  required,
  rows = 4,
  className = '',
}: TextareaProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={name}
        placeholder={placeholder}
        rows={rows}
        {...register(name)}
        className={`w-full px-3 py-2 bg-background border ${
          error ? 'border-red-500' : 'border-border'
        } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error.message}</p>}
    </div>
  );
}

interface SelectProps {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[] | readonly string[];
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function Select({
  label,
  name,
  options,
  register,
  error,
  required,
  placeholder = 'Select...',
  className = '',
}: SelectProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={name}
        {...register(name)}
        className={`w-full px-3 py-2 bg-background border ${
          error ? 'border-red-500' : 'border-border'
        } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value;
          const label = typeof option === 'string' ? option : option.label;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
