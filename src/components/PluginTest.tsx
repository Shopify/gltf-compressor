import { folder, useControls } from "leva";
import { bezier } from "../plugins/plugin-bezier/index";
import { date } from "../plugins/plugin-dates/index";

export default function PluginTest() {
  useControls(
    "Plugins",
    {
      Curve: folder({ curve: bezier() }),
      Date: folder({ birthday: date({ date: new Date() }) }),
    },
    { collapsed: true }
  );

  return null;
}
