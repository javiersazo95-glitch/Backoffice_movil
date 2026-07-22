export type RootStackParamList = {
  Login: undefined;
  AreaSelector: undefined;
  Permissions: undefined;
  Administracion: undefined;
  Soporte: undefined;
  Confianza: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
