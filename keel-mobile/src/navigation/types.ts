export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  EnableBiometrics: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
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
