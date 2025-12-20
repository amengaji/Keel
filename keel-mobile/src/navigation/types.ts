//keel-mobile/src/navigation/types.ts

/**
 * ============================================================
 * Navigation Type Definitions
 * ============================================================
 *
 * IMPORTANT RULES:
 * - Stack param lists MUST match actual navigator usage
 * - A screen belongs to EXACTLY ONE stack
 * - Types must reflect real navigation hierarchy
 */

/* ------------------------------------------------------------
 * AUTH FLOW
 * ------------------------------------------------------------ */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  EnableBiometrics: undefined;
};

/* ------------------------------------------------------------
 * MAIN STACK (above Bottom Tabs)
 * ------------------------------------------------------------ */
export type MainStackParamList = {
  MainTabs: undefined;

  /**
   * Full-screen Sea Service Wizard
   * - Opened from Sea Service dashboard
   */
  SeaServiceWizard: undefined;

  /**
   * Task Details (drill-down screen)
   * - Opened from Tasks tab list
   * - Inspector-safe: explicit id
   */
  TaskDetails: { id: number };
};

/* ------------------------------------------------------------
 * BOTTOM TABS
 * ------------------------------------------------------------ */
export type BottomTabParamList = {
  Home: undefined;
  SeaService: undefined;
  Daily: undefined;
  Tasks: undefined;
  Profile: undefined;
};
