import { easings, useSpring } from "@react-spring/web";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  DoubleSide,
  InstancedInterleavedBuffer,
  InstancedMesh,
  InterleavedBufferAttribute,
  PlaneGeometry,
  ShaderMaterial,
} from "three";

import gradientsTextureAtlasUrl from "@/assets/images/gradients_texture_atlas.png";
import { useViewportStore } from "@/stores/useViewportStore";

import fragmentShader from "../shaders/confetti/fragment.glsl";
import vertexShader from "../shaders/confetti/vertex.glsl";

export default function Confetti() {
  const gradientsTextureAtlas = useTexture(gradientsTextureAtlasUrl);

  const particlePoolSize = 3000;
  const duration = 10.0;

  const modelDimensions = useViewportStore((state) => state.modelDimensions);

  const { gridHeight, gridFadeDistance } = useMemo(() => {
    let maxDimension = 0;
    let gridHeight = 0;
    if (modelDimensions) {
      maxDimension = Math.max(
        Math.max(modelDimensions[0], modelDimensions[1]),
        modelDimensions[2]
      );
      gridHeight = -modelDimensions[1] / 2;
    }

    const gridScaleThreshold = 0.48227369284251115;
    const scaleFactor = Math.sqrt(maxDimension / gridScaleThreshold);
    const gridFadeDistance = maxDimension + 4.5 * Math.min(1, scaleFactor);

    return { gridHeight, gridFadeDistance };
  }, [modelDimensions]);

  const confettiGeometry = useMemo(() => {
    const radiusOfSpawnArea = gridFadeDistance;

    // 3 floats for the spawn position
    // 1 float for the timeOffset
    // 1 float for the gradient ID
    // 1 float for the rotation direction
    // 3 + 1 + 1 + 1 = 6 floats per particle
    const numStaticFloatsPerParticle = 6;

    const staticParticleData = new Float32Array(
      particlePoolSize * numStaticFloatsPerParticle
    );

    for (
      let particleIndex = 0;
      particleIndex < particlePoolSize;
      particleIndex++
    ) {
      // Generate a random spawn position
      const randomAngle = Math.random() * Math.PI * 2.0;
      const randomRadius = radiusOfSpawnArea * Math.random();
      const xPos = Math.cos(randomAngle) * randomRadius;
      const yPos = gridFadeDistance;
      const zPos = Math.sin(randomAngle) * randomRadius;

      // Pick a random gradient
      const gradientID = Math.floor(Math.random() * 32);

      // Set the spawn position of the particle
      staticParticleData[particleIndex * numStaticFloatsPerParticle + 0] = xPos;
      staticParticleData[particleIndex * numStaticFloatsPerParticle + 1] = yPos;
      staticParticleData[particleIndex * numStaticFloatsPerParticle + 2] = zPos;
      // Set the time offset of the particle
      staticParticleData[particleIndex * numStaticFloatsPerParticle + 3] =
        Math.random() * duration;
      // Set the gradient ID of the particle
      staticParticleData[particleIndex * numStaticFloatsPerParticle + 4] =
        gradientID;
      // Set the rotation direction of the particle
      staticParticleData[particleIndex * numStaticFloatsPerParticle + 5] =
        Math.random() < 0.5 ? -1.0 : 1.0;
    }

    // Store the static particle data in an interleaved buffer
    const staticInterleavedBuffer = new InstancedInterleavedBuffer(
      staticParticleData,
      numStaticFloatsPerParticle
    );

    const geometry = new PlaneGeometry(1, 0.5);
    geometry.setAttribute(
      "spawnPosition",
      new InterleavedBufferAttribute(staticInterleavedBuffer, 3, 0)
    );
    geometry.setAttribute(
      "timeOffset",
      new InterleavedBufferAttribute(staticInterleavedBuffer, 1, 3)
    );
    geometry.setAttribute(
      "gradientID",
      new InterleavedBufferAttribute(staticInterleavedBuffer, 1, 4)
    );
    geometry.setAttribute(
      "rotationDirection",
      new InterleavedBufferAttribute(staticInterleavedBuffer, 1, 5)
    );

    return geometry;
  }, [gridFadeDistance]);

  const confettiMaterial = useMemo(() => {
    const spawnHeight = gridFadeDistance;
    const fallDistance = spawnHeight - gridHeight;
    const fallSpeed = fallDistance / duration;
    const rotationSpeed = gridFadeDistance * 0.04856193792;
    const circleRadius = gridFadeDistance * 0.48561937929;
    const flutterSpeed = 10.0;
    const scale = gridFadeDistance * 0.0065;

    return new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        duration: { value: duration },
        fallSpeed: { value: fallSpeed },
        rotationSpeed: { value: rotationSpeed },
        circleRadius: { value: circleRadius },
        flutterSpeed: { value: flutterSpeed },
        scale: { value: scale },
        globalScalingFactor: { value: 0.0 },
        gradientsTextureAtlas: { value: gradientsTextureAtlas },
      },
      vertexShader,
      fragmentShader,
      side: DoubleSide,
    });
  }, [gridFadeDistance, gridHeight, gradientsTextureAtlas]);

  useFrame(({ clock }) => {
    confettiMaterial.uniforms.time.value = clock.elapsedTime;
  });

  const meshRef = useRef<InstancedMesh | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [scaleSpring, scaleSpringAPI] = useSpring(
    () => ({
      from: { progress: 0.0 },
      config: {
        easing: easings.easeOutCubic,
        duration: 1000,
      },
      onChange: () => {
        confettiMaterial.uniforms.globalScalingFactor.value =
          scaleSpring.progress.get();
      },
      onRest: () => {
        if (scaleSpring.progress.get() === 0.0 && meshRef.current) {
          meshRef.current.visible = false;
        }
      },
    }),
    [confettiMaterial]
  );

  useEffect(() => {
    const unsubscribe = useViewportStore.subscribe(
      (state) => state.confettiCounter,
      (confettiCounter) => {
        // Clear any existing timeout
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }

        if (confettiCounter > 0) {
          if (meshRef.current) {
            meshRef.current.visible = true;
          }
          scaleSpringAPI.start({ to: { progress: 1.0 } });

          // Set timeout to hide confetti after 5 seconds
          hideTimeoutRef.current = setTimeout(() => {
            scaleSpringAPI.start({ to: { progress: 0.0 } });
          }, 5000);
        } else {
          // Hide confetti immediately
          scaleSpringAPI.start({ to: { progress: 0.0 } });
        }
      }
    );

    return () => {
      unsubscribe();
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [scaleSpringAPI]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[confettiGeometry, confettiMaterial, particlePoolSize]}
      frustumCulled={false}
      visible={false}
    />
  );
}

useTexture.preload(gradientsTextureAtlasUrl);
