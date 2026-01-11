// keel-web/src/components/common/DatePickerInput.tsx
//
// Keel — DatePickerInput (Canonical)
// ----------------------------------------------------
// PURPOSE:
// - Reusable, audit-safe date picker
// - NO native browser calendar icon
// - Lucide icon only
// - Dark / Light mode safe
// - Chromium showPicker() support
//
// DESIGN:
// - Visible text input (read-only)
// - Hidden native date input (calendar only)
// - Single source of truth
//

import { Calendar } from "lucide-react";

interface DatePickerInputProps {
  value: string;
  min?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DatePickerInput({
  value,
  min,
  onChange,
  placeholder = "YYYY-MM-DD",
}: DatePickerInputProps) {
  return (
    <div className="relative">
      {/* Visible input (no native icon) */}
      <input
        type="text"
        value={value}
        readOnly
        placeholder={placeholder}
        className="
          w-full rounded-md border px-3 py-1.5 text-sm
          bg-[hsl(var(--background))]
          pr-10 cursor-pointer
        "
        onClick={(e) => {
          const hidden = e.currentTarget
            .nextElementSibling as HTMLInputElement | null;
          hidden?.showPicker?.();
        }}
      />

      {/* Hidden native date input (calendar only) */}
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />

      {/* Custom calendar icon */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          const hidden = e.currentTarget
            .previousElementSibling as HTMLInputElement | null;
          hidden?.showPicker?.();
        }}
        className="
          absolute inset-y-0 right-2
          flex items-center
          text-[hsl(var(--muted-foreground))]
          hover:text-[hsl(var(--foreground))]
        "
        aria-label="Open calendar"
        tabIndex={-1}
      >
        <Calendar size={16} />
      </button>
    </div>
  );
}
