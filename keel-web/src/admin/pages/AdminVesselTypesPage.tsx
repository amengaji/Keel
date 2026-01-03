// keel-web/src/admin/pages/AdminVesselTypesPage.tsx
//
// Keel — Vessel Types (System Taxonomy Register)
// ----------------------------------------------------
// PURPOSE:
// - Canonical list of vessel types supported by Keel
// - Training + TRB applicability reference
// - Audit-safe, read-only taxonomy
//
// IMPORTANT:
// - No create/edit/delete
// - Vessel types are system-defined
// - Changes require regulatory review
//
// AUDIT NOTE:
// This screen exists to demonstrate controlled scope,
// not operational flexibility.

import {
  Ship,
  Layers,
  CheckCircle,
  MinusCircle,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Vessel Type Registry — SYSTEM DEFINED                                       */
/* -------------------------------------------------------------------------- */
const vesselTypes = [
  {
    code: "BULK",
    name: "Bulk Carrier",
    deckTRB: true,
    engineTRB: true,
    etoTRB: false,
    ratingTRB: true,
  },
  {
    code: "OIL",
    name: "Oil Tanker",
    deckTRB: true,
    engineTRB: true,
    etoTRB: true,
    ratingTRB: true,
  },
  {
    code: "CHEM",
    name: "Chemical Tanker",
    deckTRB: true,
    engineTRB: true,
    etoTRB: true,
    ratingTRB: true,
  },
  {
    code: "PROD",
    name: "Product Tanker",
    deckTRB: true,
    engineTRB: true,
    etoTRB: true,
    ratingTRB: true,
  },
  {
    code: "GAS",
    name: "Gas Carrier",
    deckTRB: true,
    engineTRB: true,
    etoTRB: true,
    ratingTRB: true,
  },
  {
    code: "CONT",
    name: "Container Ship",
    deckTRB: true,
    engineTRB: true,
    etoTRB: true,
    ratingTRB: true,
  },
  {
    code: "GEN",
    name: "General Cargo",
    deckTRB: true,
    engineTRB: true,
    etoTRB: false,
    ratingTRB: true,
  },
  {
    code: "RORO",
    name: "Ro-Ro / PCC",
    deckTRB: true,
    engineTRB: true,
    etoTRB: true,
    ratingTRB: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Helper Icon                                                                 */
/* -------------------------------------------------------------------------- */
function YesNo({ value }: { value: boolean }) {
  return value ? (
    <CheckCircle size={14} className="text-green-600 mx-auto" />
  ) : (
    <MinusCircle size={14} className="text-slate-400 mx-auto" />
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminVesselTypesPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* ============================ HEADER ============================ */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Layers size={20} />
          Vessel Types
        </h1>

        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          System-defined vessel taxonomy and Training Record Book applicability.
        </p>
      </div>

      {/* ============================ TAXONOMY TABLE ============================ */}
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
              <th className="px-4 py-3 text-center font-medium">
                Deck TRB
              </th>
              <th className="px-4 py-3 text-center font-medium">
                Engine TRB
              </th>
              <th className="px-4 py-3 text-center font-medium">
                ETO TRB
              </th>
              <th className="px-4 py-3 text-center font-medium">
                Rating TRB
              </th>
            </tr>
          </thead>

          <tbody>
            {vesselTypes.map((v) => (
              <tr
                key={v.code}
                className="border-t border-[hsl(var(--border))]"
              >
                <td className="px-4 py-3 font-mono text-xs">
                  {v.code}
                </td>

                <td className="px-4 py-3 flex items-center gap-2">
                  <Ship size={14} />
                  {v.name}
                </td>

                <td className="px-4 py-3 text-center">
                  <YesNo value={v.deckTRB} />
                </td>

                <td className="px-4 py-3 text-center">
                  <YesNo value={v.engineTRB} />
                </td>

                <td className="px-4 py-3 text-center">
                  <YesNo value={v.etoTRB} />
                </td>

                <td className="px-4 py-3 text-center">
                  <YesNo value={v.ratingTRB} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============================ DISCLAIMER ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Vessel types and Training Record Book applicability are system-controlled.
        Modifications require regulatory review and are not permitted through
        the administrative interface.
      </p>
    </div>
  );
}
