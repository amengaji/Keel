export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  EnableBiometrics: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;

  /**
   * Full-screen Sea Service Wizard
   * - Opened when user taps "Add Sea Service" on dashboard
   * - Later we can extend params for edit mode, etc.
   */
  SeaServiceWizard: undefined;
};


export type AppStackParamList = {
  TaskList: undefined;
  TaskDetails: { id: number };
};

export type BottomTabParamList = {
  Home: undefined;
  SeaService: undefined;
  Daily: undefined;
  Tasks: undefined;
  Profile: undefined;
};
