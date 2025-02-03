import { useModelStore } from "@/stores/useModelStore";
// import { useControls } from "leva";
import { useEffect, useMemo, useRef } from "react";
import { BackSide, Color, ShaderMaterial } from "three";
import fragmentShader from "../shaders/grid/fragment.glsl";
import vertexShader from "../shaders/grid/vertex.glsl";

export default function Grid() {
  const { modelDimensions } = useModelStore();

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
      side: BackSide,
    });
  }, []);

  /*
  const updateUniform = (uniformName: string, value: any) => {
    if (gridMaterial.uniforms[uniformName]) {
      gridMaterial.uniforms[uniformName].value = value;
    }
  };

  useControls(
    "Grid",
    {
      cellColor: {
        value: gridSettings.current.cellColor,
        onChange: (value) => {
          gridSettings.current.cellColor = value;
          updateUniform("cellColor", new Color(value));
        },
      },
      sectionColor: {
        value: gridSettings.current.sectionColor,
        onChange: (value) => {
          gridSettings.current.sectionColor = value;
          updateUniform("sectionColor", new Color(value));
        },
      },
      cellSize: {
        value: gridSettings.current.cellSize,
        min: 0.1,
        max: 10,
        step: 0.01,
        onChange: (value) => {
          gridSettings.current.cellSize = value;
          updateUniform("cellSize", value);
        },
      },
      sectionSize: {
        value: gridSettings.current.sectionSize,
        min: 0.1,
        max: 10,
        step: 0.01,
        onChange: (value) => {
          gridSettings.current.sectionSize = value;
          updateUniform("sectionSize", value);
        },
      },
      cellThickness: {
        value: gridSettings.current.cellThickness,
        min: 0,
        max: 5,
        step: 0.1,
        onChange: (value) => {
          gridSettings.current.cellThickness = value;
          updateUniform("cellThickness", value);
        },
      },
      sectionThickness: {
        value: gridSettings.current.sectionThickness,
        min: 0,
        max: 5,
        step: 0.1,
        onChange: (value) => {
          gridSettings.current.sectionThickness = value;
          updateUniform("sectionThickness", value);
        },
      },
      fadeDistance: {
        value: gridSettings.current.fadeDistance,
        min: 0,
        max: 100,
        step: 0.1,
        onChange: (value) => {
          gridSettings.current.fadeDistance = value;
          updateUniform("fadeDistance", value);
        },
      },
      fadeStrength: {
        value: gridSettings.current.fadeStrength,
        min: 0,
        max: 1,
        step: 0.1,
        onChange: (value) => {
          gridSettings.current.fadeStrength = value;
          updateUniform("fadeStrength", value);
        },
      },
      infiniteGrid: {
        value: gridSettings.current.infiniteGrid,
        onChange: (value) => {
          gridSettings.current.infiniteGrid = value;
          updateUniform("infiniteGrid", value);
        },
      },
    },
    { collapsed: false }
  );
  */

  useEffect(() => {
    if (!modelDimensions) return;
    // Find the maximum dimension of the model in the XZ plane
    const maxDimension = Math.max(modelDimensions[0], modelDimensions[2]);
    // Update the fade distance
    gridMaterial.uniforms.fadeDistance.value = maxDimension + 4.5;
  }, [modelDimensions]);

  if (!modelDimensions) return null;

  return (
    <mesh position={[0, -modelDimensions[1] / 2, 0]} frustumCulled={false}>
      <planeGeometry args={[10, 10]} />
      <primitive object={gridMaterial} />
    </mesh>
  );
}

export { Grid };
