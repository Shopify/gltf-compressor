import { Box3, Group, Object3D, Sphere, Vector3 } from "three";
import { ForwardRefComponent } from "../helpers/ts-utils";
export type OnCenterCallbackProps = {
  parent: Object3D;
  container: Object3D;
  width: number;
  height: number;
  depth: number;
  boundingBox: Box3;
  boundingSphere: Sphere;
  center: Vector3;
  verticalAlignment: number;
  horizontalAlignment: number;
  depthAlignment: number;
};
export type CenterProps = {
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
  front?: boolean;
  back?: boolean;
  disable?: boolean;
  disableX?: boolean;
  disableY?: boolean;
  disableZ?: boolean;
  precise?: boolean;
  onCentered?: (props: OnCenterCallbackProps) => void;
  cacheKey?: any;
};
export declare const Center: ForwardRefComponent<
  JSX.IntrinsicElements["group"] & CenterProps,
  Group
>;
