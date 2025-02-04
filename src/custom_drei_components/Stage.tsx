import { useViewportStore } from "@/stores/useViewportStore";
import { ContactShadows, Environment } from "@react-three/drei";
import { useCallback, useEffect, useState } from "react";
import { Bounds, useBounds } from "./Bounds";
import { Center, OnCenterCallbackProps } from "./Center";

const presets = {
  rembrandt: {
    main: [1, 2, 1],
    fill: [-2, -0.5, -2],
  },
  portrait: {
    main: [-1, 2, 0.5],
    fill: [-1, 0.5, -1.5],
  },
  upfront: {
    main: [0, 2, 1],
    fill: [-1, 0.5, -1.5],
  },
  soft: {
    main: [-2, 4, 4],
    fill: [-1, 0.5, -1.5],
  },
};

function Refit({ radius }: { radius: number }) {
  const api = useBounds();
  useEffect(() => {
    if (api) api.refresh().clip().fit();
  }, [radius]);
  return null;
}

function Stage({ children, ...props }: JSX.IntrinsicElements["group"]) {
  const {
    lightingPreset,
    environmentPreset,
    lightIntensity,
    contactShadows,
    setModelDimensions,
  } = useViewportStore();
  const config = presets[lightingPreset];

  const [{ radius, height }, set] = useState({
    radius: 0,
    height: 0,
  });

  const onCentered = useCallback((props: OnCenterCallbackProps) => {
    const { width, height, depth, radius } = props;
    setModelDimensions([width, height, depth]);
    set({
      radius,
      height,
    });
  }, []);

  return (
    <>
      <ambientLight intensity={lightIntensity / 3} />
      <spotLight
        penumbra={1}
        position={[
          config.main[0] * radius,
          config.main[1] * radius,
          config.main[2] * radius,
        ]}
        intensity={lightIntensity * 2}
      />
      <pointLight
        position={[
          config.fill[0] * radius,
          config.fill[1] * radius,
          config.fill[2] * radius,
        ]}
        intensity={lightIntensity}
      />
      <Bounds fit={true} clip={true} margin={1} observe={true} {...props}>
        <Refit radius={radius} />
        <Center onCentered={onCentered}>{children}</Center>
      </Bounds>
      <group position={[0, -height / 2 - 0.0005, 0]}>
        {contactShadows && (
          <ContactShadows scale={radius * 4} far={radius} blur={2} />
        )}
      </group>
      <Environment preset={environmentPreset} />
    </>
  );
}

export { Stage };
