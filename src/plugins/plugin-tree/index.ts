import { createPlugin } from "leva/plugin";
import { Tree } from "./Tree.tsx";
import { normalize, sanitize } from "./tree-plugin.ts";

export const tree = createPlugin({
  normalize,
  sanitize,
  component: Tree,
});
