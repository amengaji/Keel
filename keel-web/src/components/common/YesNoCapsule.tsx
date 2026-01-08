// keel-web/src/components/common/YesNoCapsule.tsx
//
// Keel — YesNoCapsule (Web)
// ----------------------------------------------------
// PURPOSE:
// - Segmented YES/NO control (web) for audit-friendly decisions
// - Controlled boolean value (no undefined)
// - Uses HSL vars for perfect light/dark compatibility
//
// USAGE:
// <YesNoCapsule value={trbApplicable} onChange={setTrbApplicable} />
//

type Props = {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function YesNoCapsule({
  value,
  onChange,
  disabled = false,
  className = "",
}: Props) {
  const yesActive = value === true;
  const noActive = value === false;

  return (
    <div
      className={[
        "inline-flex overflow-hidden rounded-full",
        "border border-[hsl(var(--border))]",
        "bg-[hsl(var(--card))]",
        "h-9 min-w-27.5",
        disabled ? "opacity-60 cursor-not-allowed" : "",
        className,
      ].join(" ")}
      role="group"
      aria-label="Yes/No"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onChange(true);
        }}
        className={[
          "flex-1 px-4 text-sm font-semibold",
          "transition-colors",
          yesActive
            ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
            : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
        ].join(" ")}
        aria-pressed={yesActive}
      >
        YES
      </button>

      <div className="w-px bg-[hsl(var(--border))]" />

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onChange(false);
        }}
        className={[
          "flex-1 px-4 text-sm font-semibold",
          "transition-colors",
          noActive
            ? "bg-red-600 text-white"
            : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
        ].join(" ")}
        aria-pressed={noActive}
      >
        NO
      </button>
    </div>
  );
}
