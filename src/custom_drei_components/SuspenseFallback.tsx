import { Html } from "@react-three/drei";
import { useEffect } from "react";

function SuspenseFallback() {
  useEffect(() => {
    console.log("*** Mounted SuspenseFallback");

    return () => {
      console.log("*** Unmounted SuspenseFallback");
    };
  }, []);

  return (
    <Html
      center
      style={{
        color: "white",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
        fontSize: "0.75rem",
        lineHeight: "1rem",
      }}
    >
      Loading...
    </Html>
  );
}

export { SuspenseFallback };
