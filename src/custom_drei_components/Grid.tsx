import { useControls } from "leva";
import { useMemo, useRef } from "react";
import { BackSide, Color, ShaderMaterial } from "three";
import fragmentShader from "../shaders/grid/fragment.glsl";
import vertexShader from "../shaders/grid/vertex.glsl";

export default function Grid() {
  const gridSettings = useRef({
    cellColor: "#6f6f6f",
    sectionColor: "#9d4b4b",
    cellSize: 0.6,
    sectionSize: 3.3,
    cellThickness: 1,
    sectionThickness: 1.5,
    fadeDistance: 10,
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

  const updateUniform = (uniformName: string, value: any) => {
    if (gridMaterial.uniforms[uniformName]) {
      gridMaterial.uniforms[uniformName].value = value;
    }
  };

  useControls(
    "Grid",
    {
      cellColor: "#6f6f6f",
      sectionColor: "#9d4b4b",
      cellSize: {
        value: gridSettings.current.cellSize,
        min: 0.1,
        max: 10,
        step: 0.1,
        onChange: (value) => {
          gridSettings.current.cellSize = value;
          updateUniform("cellSize", value);
        },
      },
      sectionSize: {
        value: gridSettings.current.sectionSize,
        min: 0.1,
        max: 10,
        step: 0.1,
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
        step: 1,
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

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[10, 10]} />
      <primitive object={gridMaterial} />
    </mesh>
  );
}

export { Grid };
