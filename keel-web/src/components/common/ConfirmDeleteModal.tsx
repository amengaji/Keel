// keel-web/src/components/common/ConfirmDeleteModal.tsx
//
// Keel — Confirm Delete Modal (Redesigned)
// --------------------------------------------------
// A modern, high-impact confirmation dialog for soft-delete operations.
//
// UX IMPROVEMENTS:
// - Backdrop blur for focus
// - Featured icon with "ripple" ring effect
// - Distinct "Soft Delete" audit notice
// - Keyboard accessibility (Escape to close)
// - Responsive (full width buttons on mobile, elegant row on desktop)

import { useEffect, useState } from "react";
import { AlertTriangle, Trash2, X, Info } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

type ConfirmDeleteModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmLabel = "Delete Entity",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  
  // UX: Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (open && e.key === "Escape" && !loading) {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="relative z-50"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* BACKDROP 
         - Uses backdrop-blur for a modern 'frosted glass' feel 
         - Fade in animation 
      */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={!loading ? onCancel : undefined}
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          
          {/* MODAL PANEL 
             - Bounce/Scale entrance animation
             - Soft shadows
             - Rounded corners (xl)
          */}
          <div className="
            relative transform overflow-hidden rounded-2xl 
            bg-[hsl(var(--card,255,100%,100%))] text-left shadow-2xl 
            transition-all 
            animate-in zoom-in-95 slide-in-from-bottom-5 duration-200
            sm:my-8 sm:w-full sm:max-w-lg 
            border border-[hsl(var(--border,220,13%,91%))]
          ">
            
            {/* CLOSE BUTTON (Top Right) */}
            <div className="absolute right-4 top-4">
              <button
                type="button"
                disabled={loading}
                onClick={onCancel}
                className="
                  rounded-md bg-transparent text-[hsl(var(--muted-foreground))] 
                  hover:text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  disabled:opacity-50
                  transition-colors
                "
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="px-6 pb-6 pt-8 sm:pb-8">
              <div className="sm:flex sm:items-start">
                
                {/* FEATURED ICON */}
                <div className="
                  mx-auto flex h-14 w-14 shrink-0 items-center justify-center 
                  rounded-full bg-red-100 sm:mx-0 sm:h-12 sm:w-12
                  ring-8 ring-red-50 dark:bg-red-900/20 dark:ring-red-900/10
                ">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" aria-hidden="true" />
                </div>

                {/* CONTENT */}
                <div className="mt-5 text-center sm:ml-5 sm:mt-0 sm:text-left w-full">
                  <h3 
                    className="text-lg font-semibold leading-6 text-[hsl(var(--foreground))]" 
                    id="modal-title"
                  >
                    {title}
                  </h3>
                  
                  <div className="mt-2">
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                      {description}
                    </p>
                  </div>

                  {/* AUDIT / SOFT DELETE NOTICE */}
                  <div className="mt-4 rounded-md bg-orange-50 dark:bg-orange-900/10 p-3 border border-orange-100 dark:border-orange-900/20">
                    <div className="flex">
                      <div className="shrink-0">
                        <Info className="h-5 w-5 text-orange-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3 flex-1 md:flex md:justify-between">
                        <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                          This item will be soft-deleted. It can be restored by an administrator via the audit log.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="bg-[hsl(var(--muted,240,5%,96%))] px-6 py-4 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className="
                  inline-flex w-full justify-center items-center gap-2 rounded-lg 
                  bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm 
                  hover:bg-red-500 
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  disabled:opacity-70 disabled:cursor-not-allowed
                  transition-all active:scale-[0.98]
                  sm:ml-3 sm:w-auto
                "
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {confirmLabel}
                  </>
                )}
              </button>
              
              <button
                type="button"
                disabled={loading}
                onClick={onCancel}
                className="
                  mt-3 inline-flex w-full justify-center rounded-lg 
                  bg-white dark:bg-transparent px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100
                  shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  disabled:opacity-50
                  transition-all
                  sm:mt-0 sm:w-auto
                "
              >
                {cancelLabel}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Preview / Harness (For Demo Purposes)                                      */
/* -------------------------------------------------------------------------- */

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    // Simulate API call
    setTimeout(() => {
      setIsDeleting(false);
      setIsOpen(false);
      // Optional: Add a toast notification here
      console.log("Deleted!");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      
      {/* Mock Content to Show Overlay Effect */}
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-sm rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Resource Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Select an item below to manage its settings or remove it from the system.
          </p>
        </div>

        <div className="flex justify-center py-8">
          <div className="p-6 border border-red-100 bg-red-50 dark:bg-red-950/30 dark:border-red-900/50 rounded-lg flex flex-col items-center gap-4 max-w-sm">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-500">
              <Trash2 size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-gray-900 dark:text-gray-200">Dangerous Action</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Click the button below to trigger the confirmation modal demo.
              </p>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md shadow-sm transition-colors"
            >
              Delete Resource
            </button>
          </div>
        </div>
      </div>

      {/* The Actual Component */}
      <ConfirmDeleteModal
        open={isOpen}
        title="Delete Vessel: 'Sea Voyager'?"
        description="Are you sure you want to delete this vessel from the fleet? This will remove all associated logs and active assignments."
        confirmLabel="Delete Vessel"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsOpen(false)}
      />
    </div>
  );
}