import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "btn-yappy": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        theme?: "blue" | "dark" | "light";
        disabled?: boolean;
      };
    }
  }
}
