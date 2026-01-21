import { Environment } from "@react-three/drei";
import { JSX, useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { ContactShadows } from "./ContactShadows";

import { useViewportStore } from "@/stores/useViewportStore";

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
    if (radius > 0 && api) api.refresh().clip().fit();
  }, [radius, api]);
  return null;
}

function Stage({ children, ...props }: JSX.IntrinsicElements["group"]) {
  const [
    lightingPreset,
    environmentPreset,
    lightIntensity,
    showContactShadows,
  ] = useViewportStore(
    useShallow((state) => [
      state.lightingPreset,
      state.environmentPreset,
      state.lightIntensity,
      state.showContactShadows,
    ])
  );
  const config = presets[lightingPreset];

  const [{ radius, height }, set] = useState({
    radius: 0,
    height: 0,
  });

  const onCentered = useCallback((props: OnCenterCallbackProps) => {
    const { width, height, depth, radius } = props;
    useViewportStore.setState({ modelDimensions: [width, height, depth] });
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
      <Bounds {...props}>
        <Refit radius={radius} />
        <Center onCentered={onCentered}>{children}</Center>
      </Bounds>
      <group position={[0, -height / 2 - 0.0005, 0]}>
        {showContactShadows && (
          <ContactShadows
            scale={radius * 4}
            far={radius}
            blur={2}
            renderOrder={1}
          />
        )}
      </group>
      <Environment preset={environmentPreset} />
    </>
  );
}

export { Stage };
