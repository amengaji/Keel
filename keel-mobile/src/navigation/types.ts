export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  EnableBiometrics: undefined;
};

export type MainStackParamList = {
  Home: undefined;
};

export type AppStackParamList = {
  TaskList: undefined;
  TaskDetails: { id: number };
};
