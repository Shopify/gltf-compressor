import { shaderMaterial } from "@react-three/drei/core/shaderMaterial.js";
import { version } from "@react-three/drei/helpers/constants.js";
import { extend } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useRef } from "react";
import {
  BackSide,
  Color,
  ColorRepresentation,
  Mesh,
  PlaneGeometry,
  Side,
} from "three";

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

const GridMaterial = shaderMaterial(
  {
    cellSize: 0.5,
    sectionSize: 1,
    fadeDistance: 100,
    fadeStrength: 1,
    fadeFrom: 1,
    cellThickness: 0.5,
    sectionThickness: 1,
    cellColor: new Color(),
    sectionColor: new Color(),
    infiniteGrid: false,
  },
  /* glsl */ `
    varying vec3 localPosition;
    varying vec4 worldPosition;

    uniform float fadeDistance;
    uniform bool infiniteGrid;

    void main() {
      localPosition = position.xzy;
      if (infiniteGrid) localPosition *= 1.0 + fadeDistance;
      worldPosition = modelMatrix * vec4(localPosition, 1.0);
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  /* glsl */ `
    varying vec3 localPosition;
    varying vec4 worldPosition;

    uniform float cellSize;
    uniform float sectionSize;
    uniform vec3 cellColor;
    uniform vec3 sectionColor;
    uniform float fadeDistance;
    uniform float fadeStrength;
    uniform float fadeFrom;
    uniform float cellThickness;
    uniform float sectionThickness;

    float getGrid(float size, float thickness) {
      vec2 r = localPosition.xz / size;
      vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
      float line = min(grid.x, grid.y) + 1.0 - thickness;
      return 1.0 - min(line, 1.0);
    }

    void main() {
      float g1 = getGrid(cellSize, cellThickness);
      float g2 = getGrid(sectionSize, sectionThickness);

      float dist = distance(vec3(fadeFrom), worldPosition.xyz);
      float d = 1.0 - min(dist / fadeDistance, 1.0);
      vec3 color = mix(cellColor, sectionColor, min(1.0, sectionThickness * g2));

      gl_FragColor = vec4(color, (g1 + g2) * pow(d, fadeStrength));
      gl_FragColor.a = mix(0.75 * gl_FragColor.a, gl_FragColor.a, g2);
      if (gl_FragColor.a <= 0.0) discard;

      #include <tonemapping_fragment>
      #include <${
        version >= 154 ? "colorspace_fragment" : "encodings_fragment"
      }>
    }
  `
);
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
    extend({
      GridMaterial,
    });
    const ref = useRef<Mesh>(null);
    useImperativeHandle(fRef, () => ref.current, []);

    const uniforms1 = {
      cellSize,
      sectionSize,
      cellColor,
      sectionColor,
      cellThickness,
      sectionThickness,
    };

    const uniforms2 = {
      fadeDistance,
      fadeStrength,
      fadeFrom,
      infiniteGrid,
    };

    return (
      <mesh ref={ref} frustumCulled={false} {...props}>
        <gridMaterial
          transparent
          extensions-derivatives
          side={side}
          {...uniforms1}
          {...uniforms2}
        />
        <planeGeometry args={args} />
      </mesh>
    );
  }
);

export { Grid };
