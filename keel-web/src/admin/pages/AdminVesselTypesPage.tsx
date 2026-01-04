// keel-web/src/admin/pages/AdminVesselTypesPage.tsx
//
// Keel — Vessel Types (System Taxonomy Register)
// ----------------------------------------------------
// PURPOSE:
// - Display canonical vessel types from backend
// - Reflect real system taxonomy (Code, Name, Description)
// - Read-only, audit-safe reference screen
//
// IMPORTANT:
// - Vessel types are SYSTEM-DEFINED
// - No create / edit / delete allowed
// - Data comes directly from admin_ship_types_v
//

import { useEffect, useState } from "react";
import { Ship, Layers } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */
/**
 * Vessel Type shape as returned by backend.
 * This MUST match admin_ship_types_v exactly.
 */
type VesselType = {
  ship_type_id: number;
  type_code: string;
  name: string;
  description: string;
};

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminVesselTypesPage() {
  /* ------------------------------------------------------------------------ */
  /* State                                                                    */
  /* ------------------------------------------------------------------------ */
  const [vesselTypes, setVesselTypes] = useState<VesselType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Data Fetch                                                               */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    async function loadVesselTypes() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "/api/v1/admin/ship-types",
          {
            credentials: "include", // IMPORTANT: send auth cookies
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch vessel types");
        }

        const result = await response.json();

        if (!result?.success) {
          throw new Error(result?.message || "Unknown error");
        }

        setVesselTypes(result.data || []);
      } catch (err) {
        console.error("Failed to load vessel types:", err);
        setError("Unable to load vessel types");
      } finally {
        setLoading(false);
      }
    }

    loadVesselTypes();
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="space-y-6 max-w-6xl">
      {/* ============================ HEADER ============================ */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Layers size={20} />
          Vessel Types
        </h1>

        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          System-defined vessel taxonomy used across training and records.
        </p>
      </div>

      {/* ============================ STATES ============================ */}
      {loading && (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">
          Loading vessel types…
        </div>
      )}

      {!loading && error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && vesselTypes.length === 0 && (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">
          No vessel types available in the system.
        </div>
      )}

      {/* ============================ TABLE ============================ */}
      {!loading && !error && vesselTypes.length > 0 && (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--muted))]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  Code
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Vessel Type
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Description
                </th>
              </tr>
            </thead>

            <tbody>
              {vesselTypes.map((v) => (
                <tr
                  key={v.ship_type_id}
                  className="border-t border-[hsl(var(--border))]"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {v.type_code}
                  </td>

                  <td className="px-4 py-3 flex items-center gap-2">
                    <Ship size={14} />
                    {v.name}
                  </td>

                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                    {v.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================ DISCLAIMER ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Vessel types are system-controlled reference data.
        Modifications require regulatory review and are not permitted
        through the administrative interface.
      </p>
    </div>
  );
}
