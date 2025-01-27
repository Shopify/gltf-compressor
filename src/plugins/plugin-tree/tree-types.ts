import type { LevaInputProps } from "leva/plugin";
import type { Object3D } from "three";

export type TreeNode = {
  name: string;
  children: TreeNode[];
  object: Object3D;
  expanded?: boolean;
};

export type TreeInput = Object3D;

export type InternalTree = {
  root: TreeNode;
};

export type TreeSettings = {
  expanded?: boolean;
};

export type InternalTreeSettings = TreeSettings;

export type TreeProps = LevaInputProps<InternalTree, InternalTreeSettings>;
