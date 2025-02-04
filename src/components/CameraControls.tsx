import { useViewportStore } from "@/stores/useViewportStore";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export default function CameraControls() {
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    const unsubscribe = useViewportStore.subscribe(
      (state) => state.autoRotate,
      (value) => {
        if (orbitControlsRef.current) {
          orbitControlsRef.current.autoRotate = value;
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
