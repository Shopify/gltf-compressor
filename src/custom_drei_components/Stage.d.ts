import * as React from "react";
import { PresetsType } from "../helpers/environment-assets";
import { CenterProps } from "./Center";
import { ContactShadowsProps } from "./ContactShadows";
import { EnvironmentProps } from "./Environment";
type StageShadows = Partial<ContactShadowsProps> & {
  type: "contact";
  offset?: number;
  bias?: number;
  normalBias?: number;
  size?: number;
};
type StageProps = {
  preset?:
    | "rembrandt"
    | "portrait"
    | "upfront"
    | "soft"
    | {
        main: [x: number, y: number, z: number];
        fill: [x: number, y: number, z: number];
      };
  shadows?: boolean | "contact" | StageShadows;
  adjustCamera?: boolean | number;
  environment?: PresetsType | Partial<EnvironmentProps> | null;
  intensity?: number;
  center?: Partial<CenterProps>;
};
export declare function Stage({
  children,
  center,
  adjustCamera,
  intensity,
  shadows,
  environment,
  preset,
  ...props
}: JSX.IntrinsicElements["group"] & StageProps): React.JSX.Element;
export {};
