import { folder, useControls } from "leva";
import { bezier } from "../plugins/plugin-bezier/index";

export default function PluginTest() {
  useControls(
    "Plugins",
    {
      "Bezier Curve": folder({ curve: bezier() }),
    },
    { collapsed: true }
  );

  return null;
}
