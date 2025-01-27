import type { Object3D } from "three";
import type { InternalTree, TreeNode } from "./tree-types";

function buildTreeNode(object: Object3D): TreeNode {
  return {
    name: object.name || object.type,
    object,
    children: object.children.map((child) => buildTreeNode(child)),
    expanded: false,
  };
}

export const normalize = (input: Object3D) => {
  const value: InternalTree = {
    root: buildTreeNode(input),
  };

  return {
    value,
    settings: {
      expanded: false,
    },
  };
};

export const sanitize = (value: InternalTree) => {
  return value;
};
