import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Mesh,
  ShaderMaterial,
  Vector3,
} from "three";

import { useViewportStore } from "@/stores/useViewportStore";
import { easings, useSpring } from "@react-spring/web";
import hologramFragmentShader from "../shaders/hologram/fragment.glsl";
import hologramVertexShader from "../shaders/hologram/vertex.glsl";

export const Hologram = forwardRef((_, ref) => {
  const numRings = 12;
  const thickness = 1.5;

  const ringPoints = useMemo(() => {
    const pointsPerCircle = 16;
    const vertex = new Vector3();
    const ringPoints: Vector3[][] = [];

    // Compute the points that make up the rings
    for (let ringIndex = 0; ringIndex <= numRings; ringIndex++) {
      // Use linear interpolation for even spacing between rings
      // Go from a small radius (not 0 to avoid degenerate geometry) to 1
      const ringRadius = (ringIndex + 1) / (numRings + 1);

      const currentRingPoints: Vector3[] = [];
      for (let i = 0; i < pointsPerCircle; i++) {
        const angle = (i / pointsPerCircle) * Math.PI * 2;
        vertex.set(
          ringRadius * Math.cos(angle),
          0,
          ringRadius * Math.sin(angle)
        );
        currentRingPoints.push(vertex.clone());
      }

      ringPoints.push(currentRingPoints);
    }

    return ringPoints;
  }, []);

  const hologramGeometry = useMemo(() => {
    const numRings = ringPoints.length;
    const numSegments = 128;
    const totalSegments = numRings * numSegments;
    const totalTimeDelayOfRings = 3;

    const geometry = new BufferGeometry();
    if (numRings === 0) {
      return geometry;
    }

    const indices = new Uint32Array(totalSegments * 6);
    const vertexPositions = new Float32Array(
      totalSegments * 2 * 3 + numRings * 2 * 3
    );
    const vertexUVs = new Float32Array(
      totalSegments * 2 * 2 + numRings * 2 * 2
    );
    const vertexDirections = new Float32Array(
      totalSegments * 2 * 3 + numRings * 2 * 3
    );
    const vertexTimeDelays = new Float32Array(
      totalSegments * 2 * 1 + numRings * 2 * 1
    );

    const curve = new CatmullRomCurve3();
    const firstPos = new Vector3();
    const firstDir = new Vector3();
    const prevDir = new Vector3();
    const vertexPosition = new Vector3();
    const vertexDirection = new Vector3();
    const nextPosition = new Vector3();

    for (let index = 0; index < numRings; index++) {
      curve.points = ringPoints[index];
      curve.closed = true;
      curve.updateArcLengths();

      let isFirstSegment = true;

      // Define the positions and uv coordinates for each segment
      for (let i = 0; i <= numSegments; i++) {
        const globalIndex = index * (numSegments + 1) + i;
        const y = i / numSegments;

        vertexUVs[globalIndex * 4 + 0] = 0;
        vertexUVs[globalIndex * 4 + 1] = y;

        vertexUVs[globalIndex * 4 + 2] = 1;
        vertexUVs[globalIndex * 4 + 3] = y;

        vertexTimeDelays[globalIndex * 2 + 0] =
          (index / (numRings - 1)) * totalTimeDelayOfRings;
        vertexTimeDelays[globalIndex * 2 + 1] =
          (index / (numRings - 1)) * totalTimeDelayOfRings;

        curve.getPointAt(y, vertexPosition);
        if (y < 1.0) {
          // Calculate the direction vector
          const nextTValue = (i + 1) / numSegments;
          curve.getPointAt(nextTValue, nextPosition);
          vertexDirection.subVectors(nextPosition, vertexPosition).normalize();

          if (isFirstSegment) {
            firstPos.copy(vertexPosition);
            firstDir.copy(vertexDirection);
            isFirstSegment = false;
          }

          prevDir.copy(vertexDirection);
        } else {
          vertexPosition.copy(firstPos);
          vertexDirection.copy(firstDir);
        }

        // Set positions for both sides of the loop
        vertexPositions[globalIndex * 6 + 0] = vertexPosition.x;
        vertexPositions[globalIndex * 6 + 1] = vertexPosition.y;
        vertexPositions[globalIndex * 6 + 2] = vertexPosition.z;

        vertexPositions[globalIndex * 6 + 3] = vertexPosition.x;
        vertexPositions[globalIndex * 6 + 4] = vertexPosition.y;
        vertexPositions[globalIndex * 6 + 5] = vertexPosition.z;

        // Set direction vectors for both sides of the loop
        vertexDirections[globalIndex * 6 + 0] = vertexDirection.x;
        vertexDirections[globalIndex * 6 + 1] = vertexDirection.y;
        vertexDirections[globalIndex * 6 + 2] = vertexDirection.z;

        vertexDirections[globalIndex * 6 + 3] = vertexDirection.x;
        vertexDirections[globalIndex * 6 + 4] = vertexDirection.y;
        vertexDirections[globalIndex * 6 + 5] = vertexDirection.z;
      }

      // Define the indices for this loop
      for (
        let kVal = 0, cVal = 0;
        cVal < numSegments * 6;
        kVal += 2, cVal += 6
      ) {
        const baseIndex = index * (numSegments + 1) * 2;
        indices[index * numSegments * 6 + cVal + 0] = baseIndex + kVal + 0;
        indices[index * numSegments * 6 + cVal + 1] = baseIndex + kVal + 1;
        indices[index * numSegments * 6 + cVal + 2] = baseIndex + kVal + 2;
        indices[index * numSegments * 6 + cVal + 3] = baseIndex + kVal + 2;
        indices[index * numSegments * 6 + cVal + 4] = baseIndex + kVal + 1;
        indices[index * numSegments * 6 + cVal + 5] = baseIndex + kVal + 3;
      }
    }

    geometry.setIndex(new BufferAttribute(indices, 1));
    geometry.setAttribute("position", new BufferAttribute(vertexPositions, 3));
    geometry.setAttribute("uv", new BufferAttribute(vertexUVs, 2));
    geometry.setAttribute(
      "direction",
      new BufferAttribute(vertexDirections, 3)
    );
    geometry.setAttribute(
      "timeDelay",
      new BufferAttribute(vertexTimeDelays, 1)
    );

    return geometry;
  }, [ringPoints]);

  const hologramMaterial = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        thickness: { value: thickness },
        color: { value: new Color("#80b1ff") },
        bloomIntensity: { value: 2.0 },
        progress: { value: 0.0 },
      },
      vertexShader: hologramVertexShader,
      fragmentShader: hologramFragmentShader,
      transparent: true,
      visible: true,
    });
  }, []);

  const hologramRef = useRef<Mesh>(null);
  const modelHeightRef = useRef<number>(0);

  useEffect(() => {
    const unsubscribe = useViewportStore.subscribe(
      (state) => state.modelDimensions,
      (modelDimensions) => {
        if (!modelDimensions) return;

        modelHeightRef.current = modelDimensions[1];

        // Find the maximum dimension of the model
        const maxDimension = Math.max(
          Math.max(modelDimensions[0], modelDimensions[1]),
          modelDimensions[2]
        );

        // Update the position and scale of the hologram
        if (hologramRef.current) {
          hologramRef.current.position.set(0, -modelDimensions[1] / 2, 0);
          hologramRef.current.scale.set(
            maxDimension,
            maxDimension,
            maxDimension
          );
        }

        // Update the thickness of the hologram
        const referenceMaxDim = 1.8069445774908532;
        const scaledThickness = (maxDimension / referenceMaxDim) * thickness;
        hologramMaterial.uniforms.thickness.value = scaledThickness;
      },
      { fireImmediately: true }
    );

    return () => {
      unsubscribe();
    };
  }, [hologramMaterial]);

  const [revealSpring, revealSpringAPI] = useSpring(
    () => ({
      from: { progress: 0.0 },
      config: {
        easing: easings.linear,
        duration: 2000,
      },
      onStart: () => {
        // Show the hologram
        if (hologramRef.current) {
          hologramRef.current.visible = true;
        }
      },
      onChange: () => {
        const duration = 2000;
        const currTime = revealSpring.progress.get() * duration;
        if (currTime <= 1000) {
          // Fade in the hologram during the first second
          const easeInOutSineProgress = easings.easeInOutSine(currTime / 1000);
          hologramMaterial.uniforms.progress.value =
            easeInOutSineProgress * 4.25992104989;
        } else {
          // Raise and fade out the hologram during the second second
          const easeOutCubicProgress = easings.easeOutCubic(
            (currTime - 1000) / 1000
          );
          if (hologramRef.current) {
            hologramRef.current.position.set(
              0,
              -modelHeightRef.current / 2 +
              modelHeightRef.current * easeOutCubicProgress,
              0
            );
          }
          const linearProgress = easings.linear((currTime - 1000) / 1000);
          hologramMaterial.uniforms.progress.value =
            (1.0 - linearProgress) * 4.25992104989;
        }
      },
      onRest: () => {
        // Hide the hologram
        if (hologramRef.current) {
          hologramRef.current.visible = false;
        }
      },
    }),
    [hologramMaterial]
  );

  const playAnimation = (): void => {
    revealSpringAPI.start({
      to: {
        progress: 1.0,
      },
    });
  };

  useImperativeHandle(ref, () => ({
    playAnimation,
  }));

  return (
    <mesh
      ref={hologramRef}
      geometry={hologramGeometry}
      material={hologramMaterial}
      rotation={[0, Math.PI * -0.5, 0]}
      visible={false}
    />
  );
});

Hologram.displayName = "Hologram";
