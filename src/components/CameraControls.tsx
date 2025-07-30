import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useViewportStore } from "@/stores/useViewportStore";

export default function CameraControls() {
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    const unsubscribe = useViewportStore.subscribe(
      (state) => state.autoRotateCamera,
      (autoRotateCamera) => {
        if (orbitControlsRef.current) {
          orbitControlsRef.current.autoRotate = autoRotateCamera;
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <OrbitControls
      ref={orbitControlsRef}
      makeDefault
      autoRotate={false}
      autoRotateSpeed={-1}
    />
  );
}
