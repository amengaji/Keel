// keel-web/src/components/common/CheckboxBox.tsx
//
// Keel — CheckboxBox (Web)
// ----------------------------------------------------
// PURPOSE:
// - Standard Keel checkbox for Shore Admin UI (web)
// - Large click target, audit-friendly, accessible
//
// USAGE:
// <CheckboxBox label="TRB Applicable" checked={value} onChange={setValue} />
//

import { Check } from "lucide-react";

type Props = {
  label: string;
  description?: string;

  checked: boolean;
  onChange: (next: boolean) => void;

  disabled?: boolean;
  className?: string;
};

export function CheckboxBox({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = "",
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onChange(!checked);
      }}
      className={[
        "w-full text-left",
        "rounded-lg border border-[hsl(var(--border))]",
        "bg-[hsl(var(--card))]",
        "px-4 py-3",
        "transition-colors",
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:bg-[hsl(var(--muted))]",
        className,
      ].join(" ")}
      aria-pressed={checked}
      title={label}
    >
      <div className="flex items-start gap-3">
        {/* Box */}
        <span
          className={[
            "mt-0.5",
            "h-5 w-5 rounded-md",
            "border border-[hsl(var(--border))]",
            "flex items-center justify-center",
            checked
              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]"
              : "bg-transparent text-transparent",
          ].join(" ")}
          aria-hidden="true"
        >
          <Check className={checked ? "h-4 w-4" : "h-4 w-4 opacity-0"} />
        </span>

        {/* Text */}
        <span className="min-w-0">
          <span className="block text-sm font-medium text-[hsl(var(--foreground))]">
            {label}
          </span>

          {description ? (
            <span className="block mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              {description}
            </span>
          ) : null}
        </span>
      </div>
    </button>
  );
}
