import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n/runtime";

interface TimeFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
}

const VALID_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const parseTime = (raw: string): string | null => {
  const text = raw.trim();
  const match = text.match(/^(\d{1,2}):?(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const cleanInput = (raw: string) => raw.replace(/[^\d:]/g, "").slice(0, 5);

/**
 * Текстовое поле времени в 24-часовом формате.
 * Нативный input[type="time"] показывает AM/PM и обрезается в узких карточках,
 * поэтому ввод контролируемый.
 */
export function TimeField({ id, value, onChange, className, "aria-label": ariaLabel = tr("Время") }: TimeFieldProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseTime(raw);
    if (!parsed) return false;
    onChange(parsed);
    setDraft(parsed);
    return true;
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
      maxLength={5}
      value={draft}
      placeholder={tr("ЧЧ:ММ")}
      aria-label={ariaLabel}
      onChange={(event) => {
        const next = cleanInput(event.target.value);
        setDraft(next);
        if (VALID_TIME.test(next)) onChange(next);
        else if (next.length === 4 && !next.includes(":")) {
          const parsed = parseTime(next);
          if (parsed) onChange(parsed);
        }
      }}
      onBlur={() => {
        if (!commit(draft)) setDraft(value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          commit(draft);
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setDraft(value);
          event.currentTarget.blur();
        }
      }}
      className={cn("field tabular-nums", className)}
    />
  );
}
