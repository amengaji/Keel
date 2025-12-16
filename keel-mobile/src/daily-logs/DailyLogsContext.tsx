//keel-mobile/src/daily-logs/DailyLogsContext.tsx

/**
 * ============================================================
 * Daily Logs Context — Single Source of Truth
 * ============================================================
 *
 * PURPOSE:
 * - Centralise access to Daily Logs
 * - Wrap existing DB helpers safely
 * - Provide read-only consumers (Home dashboard)
 *
 * IMPORTANT:
 * - NO UI logic here
 * - NO backend logic here
 * - NO watchkeeping calculations here
 *
 * This context mirrors the role of SeaServiceContext.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  DailyLogEntry,
  getDailyLogsStatus,
  getLastDailyLogDate,
  DailyLogsStatus,
} from "./dailyLogsDomain";

/**
 * IMPORTANT:
 * We intentionally import DB helpers ONLY here.
 * Screens must NOT import DB helpers directly.
 *
 * Adjust the import path below ONLY if your
 * existing file is named differently.
 */
import {
  getAllDailyLogs,
} from "../db/dailyLogs";

/* ============================================================
 * Context Types
 * ============================================================ */

interface DailyLogsContextValue {
  /** All daily logs (raw) */
  logs: DailyLogEntry[];

  /** Derived compliance status */
  status: DailyLogsStatus;

  /** Most recent log date (for inspectors) */
  lastLogDate: Date | null;

  /** Reload logs from DB */
  refreshLogs: () => Promise<void>;

  /** Loading indicator */
  loading: boolean;
}

/* ============================================================
 * Context Setup
 * ============================================================ */

const DailyLogsContext = createContext<
  DailyLogsContextValue | undefined
>(undefined);

/* ============================================================
 * Provider
 * ============================================================ */

export function DailyLogsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [logs, setLogs] = useState<DailyLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * ----------------------------------------------------------
   * Load logs from DB
   * ----------------------------------------------------------
   */
  const loadLogs = async () => {
    try {
      setLoading(true);

      const result = await getAllDailyLogs();

/**
 * ----------------------------------------------------------
 * Normalise DB logs into DOMAIN-SAFE DailyLogEntry
 * ----------------------------------------------------------
 *
 * CRITICAL:
 * - STCW logic REQUIRES Date objects
 * - SQLite returns strings
 * - We normalise ONCE here
 */
const normalised: DailyLogEntry[] = result.map(
  (log: any) => ({
    ...log,

    // Primary log date
    date: log.date ? new Date(log.date) : new Date(),

    // Watchkeeping times (CRITICAL for STCW)
    startTime: log.startTime ? new Date(log.startTime) : undefined,
    endTime: log.endTime ? new Date(log.endTime) : undefined,

    // Metadata
    createdAt: log.createdAt ? new Date(log.createdAt) : new Date(),
    updatedAt: log.updatedAt
      ? new Date(log.updatedAt)
      : undefined,
  })
);


      setLogs(normalised);
    } catch (err) {
      console.error("Failed to load daily logs", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initial load (on mount)
   */
  useEffect(() => {
    loadLogs();
  }, []);

  /* ============================================================
   * Derived values (PURE)
   * ============================================================ */

  const status = getDailyLogsStatus(logs);
  const lastLogDate = getLastDailyLogDate(logs);

  /* ============================================================
   * Context Value
   * ============================================================ */

  const value: DailyLogsContextValue = {
    logs,
    status,
    lastLogDate,
    refreshLogs: loadLogs,
    loading,
  };

  return (
    <DailyLogsContext.Provider value={value}>
      {children}
    </DailyLogsContext.Provider>
  );
}

/* ============================================================
 * Hook
 * ============================================================ */

export function useDailyLogs() {
  const ctx = useContext(DailyLogsContext);

  if (!ctx) {
    throw new Error(
      "useDailyLogs must be used within a DailyLogsProvider"
    );
  }

  return ctx;
}
