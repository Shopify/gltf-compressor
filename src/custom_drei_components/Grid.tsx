import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import {
  BackSide,
  Color,
  ColorRepresentation,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Side,
} from "three";
import fragmentShader from "../shaders/grid/fragment.glsl";
import vertexShader from "../shaders/grid/vertex.glsl";

export type GridMaterialType = {
  cellSize?: number;
  cellThickness?: number;
  cellColor?: ColorRepresentation;
  sectionSize?: number;
  sectionThickness?: number;
  sectionColor?: ColorRepresentation;
  infiniteGrid?: boolean;
  fadeDistance?: number;
  fadeStrength?: number;
  fadeFrom?: number;
  side?: Side;
};

export type GridProps = GridMaterialType & {
  args?: ConstructorParameters<typeof PlaneGeometry>;
};

const Grid = forwardRef(
  (
    {
      args,
      cellColor = "#000000",
      sectionColor = "#2080ff",
      cellSize = 0.5,
      sectionSize = 1,
      infiniteGrid = false,
      fadeDistance = 100,
      fadeStrength = 1,
      fadeFrom = 1,
      cellThickness = 0.5,
      sectionThickness = 1,
      side = BackSide,
      ...props
    }: GridProps,
    fRef
  ) => {
    const ref = useRef<Mesh>(null);
    useImperativeHandle(fRef, () => ref.current, []);

    const gridMaterial = useMemo(() => {
      return new ShaderMaterial({
        uniforms: {
          cellSize: { value: cellSize },
          sectionSize: { value: sectionSize },
          fadeDistance: { value: fadeDistance },
          fadeStrength: { value: fadeStrength },
          fadeFrom: { value: fadeFrom },
          cellThickness: { value: cellThickness },
          sectionThickness: { value: sectionThickness },
          cellColor: { value: new Color(cellColor) },
          sectionColor: { value: new Color(sectionColor) },
          infiniteGrid: { value: infiniteGrid },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        side: side,
      });
    }, []);

    return (
      <mesh ref={ref} frustumCulled={false} {...props}>
        <planeGeometry args={args} />
        <primitive object={gridMaterial} />
      </mesh>
    );
  }
);

export { Grid };
