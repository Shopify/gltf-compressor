import { bezier } from "@leva-ui/plugin-bezier";
import { folder, useControls } from "leva";

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
