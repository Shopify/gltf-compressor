import { Html } from "@react-three/drei";

function SuspenseFallback() {
  return (
    <Html
      center
      style={{
        color: "white",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
        fontSize: "0.75rem",
        lineHeight: "1rem",
        whiteSpace: "nowrap",
      }}
    >
      Loading model...
    </Html>
  );
}

export { SuspenseFallback };
