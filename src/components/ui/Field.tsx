import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";

interface FieldProps {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** Подпись, поле и подсказка/ошибка. id должен совпадать с id самого поля. */
export function Field({ id, label, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="field-hint text-danger-ink">
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leadingIcon?: IconName;
  trailing?: ReactNode;
  wrapperClassName?: string;
}

/** Текстовое поле. Обёртка рендерится всегда, чтобы не терять фокус при появлении иконок. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, wrapperClassName, invalid, leadingIcon, trailing, ...props },
  ref,
) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      {leadingIcon ? (
        <Icon
          name={leadingIcon}
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
        />
      ) : null}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn("field", leadingIcon && "pl-10", trailing && "pr-11", className)}
        {...props}
      />
      {trailing ? (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>
      ) : null}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn("field field-textarea", className)}
      {...props}
    />
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, wrapperClassName, children, ...props },
  ref,
) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select ref={ref} className={cn("field appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <Icon
        name="chevronDown"
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-faint"
      />
    </div>
  );
});
