import { useEffect, useMemo, useRef } from "react";
import { Color, DoubleSide, Mesh, ShaderMaterial } from "three";

import { useViewportStore } from "@/stores/useViewportStore";

import fragmentShader from "../../shaders/grid/fragment.glsl";
import vertexShader from "../../shaders/grid/vertex.glsl";

export default function Grid() {
  const gridSettings = useRef({
    cellColor: "#6f6f6f",
    sectionColor: "#7f7f7f",
    cellSize: 0.25,
    sectionSize: 0.75,
    cellThickness: 1,
    sectionThickness: 1.5,
    fadeDistance: 4.5,
    fadeStrength: 1,
    infiniteGrid: true,
  });

  const gridMaterial = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        cellColor: { value: new Color(gridSettings.current.cellColor) },
        sectionColor: { value: new Color(gridSettings.current.sectionColor) },
        cellSize: { value: gridSettings.current.cellSize },
        sectionSize: { value: gridSettings.current.sectionSize },
        cellThickness: { value: gridSettings.current.cellThickness },
        sectionThickness: { value: gridSettings.current.sectionThickness },
        fadeDistance: { value: gridSettings.current.fadeDistance },
        fadeStrength: { value: gridSettings.current.fadeStrength },
        infiniteGrid: { value: gridSettings.current.infiniteGrid },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
    });
  }, []);

  const gridRef = useRef<Mesh>(null);

  useEffect(() => {
    const unsubscribe = useViewportStore.subscribe(
      (state) => state.modelDimensions,
      (modelDimensions) => {
        if (!modelDimensions) return;

        // Update the position and scale of the grid
        if (gridRef.current) {
          gridRef.current.position.set(0, -modelDimensions[1] / 2 - 0.001, 0);
          gridRef.current.scale.set(1, 1, 1);
        }

        // Find the maximum dimension of the model
        const maxDimension = Math.max(
          Math.max(modelDimensions[0], modelDimensions[1]),
          modelDimensions[2]
        );

        // Update the fade distance and cell/section sizes of the grid
        const gridScaleThreshold = 0.48227369284251115;
        const scaleFactor = Math.sqrt(maxDimension / gridScaleThreshold);
        gridMaterial.uniforms.fadeDistance.value =
          maxDimension + 4.5 * Math.min(1, scaleFactor);
        gridMaterial.uniforms.cellSize.value = 0.25 * scaleFactor;
        gridMaterial.uniforms.sectionSize.value = 0.75 * scaleFactor;
      },
      { fireImmediately: true }
    );

    return () => {
      unsubscribe();
    };
  }, [gridMaterial]);

  useEffect(() => {
    const unsubscribe = useViewportStore.subscribe(
      (state) => state.showGrid,
      (showGrid) => {
        if (gridRef.current) {
          gridRef.current.visible = showGrid;
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <mesh ref={gridRef} position={[0, 0, 0]} scale={[0, 0, 0]} renderOrder={0}>
      <planeGeometry args={[10, 10]} />
      <primitive object={gridMaterial} />
    </mesh>
  );
}

export { Grid };
