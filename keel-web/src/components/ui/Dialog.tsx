import React, { useEffect } from "react";
import { X } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* DIALOG                                   */
/* -------------------------------------------------------------------------- */
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [open]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={() => onOpenChange(false)}
    >
      {/* We clone the children to pass the onClose handler down if needed, 
        but usually DialogContent handles the layout.
        We stop propagation so clicking the modal content doesn't close it.
      */}
      <div 
        className="relative z-50 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DIALOG CONTENT                                */
/* -------------------------------------------------------------------------- */
interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className = "" }: DialogContentProps) {
  // We need to find the "Close" trigger logic, but strictly speaking 
  // the parent controls the close via the overlay click. 
  // For a pure implementation, we render a close button inside Header usually.
  
  return (
    <div 
      className={`
        bg-[hsl(var(--card))] 
        text-[hsl(var(--card-foreground))] 
        border border-[hsl(var(--border))] 
        shadow-lg 
        rounded-lg 
        w-full 
        p-6 
        space-y-4
        animate-in zoom-in-95 duration-200
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DIALOG HEADER                                */
/* -------------------------------------------------------------------------- */
export function DialogHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col space-y-1.5 text-left mb-4 ${className}`}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DIALOG TITLE                                */
/* -------------------------------------------------------------------------- */
export function DialogTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );
}
