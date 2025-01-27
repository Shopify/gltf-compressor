import { tree } from "@/plugins/plugin-tree";
import { useControls } from "leva";
import { Group } from "three";

interface PluginTestProps {
  scene: Group;
}

export default function PluginTest({ scene }: PluginTestProps) {
  useControls(
    "Plugins",
    {
      // Curve: folder({ curve: bezier() }),
      // Date: folder({ birthday: date({ date: new Date() }) }),
      sceneTree: tree(scene),
    },
    { collapsed: true }
  );

  return null;
}
