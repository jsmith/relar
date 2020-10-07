declare module "react-simple-snackbar" {
  import { CSSProperties, ReactNode } from "react";
  export default function SnackbarProvider(opts: { children: ReactNode }): JSX.Element;

  type OpenSnackbar = (node: ReactNode, duration?: number) => void;
  type CloseSnackbar = () => void;

  export function useSnackbar(opts?: {
    position?:
      | "top-left"
      | "top-center"
      | "top-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right";

    style?: CSSProperties;
    closeStyle?: CSSProperties;
  }): [OpenSnackbar, CloseSnackbar];
}
