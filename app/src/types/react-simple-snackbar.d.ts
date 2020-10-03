declare module "react-simple-snackbar" {
  import { ReactNode } from "react";
  export default function SnackbarProvider(opts: { children: ReactNode }): JSX.Element;

  type OpenSnackbar = (node: ReactNode, duration?: number) => void;
  type CloseSnackbar = () => void;

  export function useSnackbar(): [OpenSnackbar, CloseSnackbar];
}
