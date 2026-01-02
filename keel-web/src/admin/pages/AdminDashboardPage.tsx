// keel-web/src/admin/pages/AdminDashboardPage.tsx
//
// Keel Shore Admin — Command Center Dashboard
// FINAL STRUCTURAL FIX
//
// This version uses EXPLICIT CARD CONTAINERS.
// No theme dependency. No magic. No guessing.

import type { ReactNode } from "react";


function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        rounded-xl
        p-6
        bg-white
        text-black

        shadow-2xl
        border-4 border-red-500
      "
    >
      {children}
    </div>
  );
}



export function AdminDashboardPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Shore Command Center
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Fleet-wide training status, audit readiness, and operational health.
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            Active Vessels
          </div>
          <div className="text-3xl font-semibold mt-2">18</div>
        </Card>

        <Card>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            Cadets Onboard
          </div>
          <div className="text-3xl font-semibold mt-2">64</div>
        </Card>

        <Card>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            TRBs Ready for Lock
          </div>
          <div className="text-3xl font-semibold mt-2">21</div>
        </Card>

        <Card>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            Pending Signatures
          </div>
          <div className="text-3xl font-semibold mt-2">9</div>
        </Card>
      </div>

      {/* AUDIT READINESS */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">
          Audit Readiness
        </h2>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <div className="text-sm">Fully Compliant TRBs</div>
            <div className="text-2xl font-semibold text-green-500 mt-2">
              42
            </div>
          </Card>

          <Card>
            <div className="text-sm">Missing Evidence</div>
            <div className="text-2xl font-semibold text-yellow-400 mt-2">
              6
            </div>
          </Card>

          <Card>
            <div className="text-sm">Rejected Tasks</div>
            <div className="text-2xl font-semibold text-red-500 mt-2">
              3
            </div>
          </Card>

          <Card>
            <div className="text-sm">Signatures &gt; 7 Days</div>
            <div className="text-2xl font-semibold text-yellow-400 mt-2">
              4
            </div>
          </Card>
        </div>
      </Card>

      {/* FLEET ACTIVITY */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">
          Fleet Training Activity
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Vessel</th>
              <th className="text-left py-2">Type</th>
              <th className="text-left py-2">Cadets</th>
              <th className="text-left py-2">Last Sync</th>
              <th className="text-left py-2">Activity</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">MV Ocean Pioneer</td>
              <td className="py-2">Bulk Carrier</td>
              <td className="py-2">4</td>
              <td className="py-2 text-green-500">Online</td>
              <td className="py-2">High</td>
            </tr>
            <tr>
              <td className="py-2">MT Blue Horizon</td>
              <td className="py-2">Oil Tanker</td>
              <td className="py-2">3</td>
              <td className="py-2 text-yellow-400">Offline</td>
              <td className="py-2">Medium</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
