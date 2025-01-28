import { useModelStore } from "@/stores/useModelStore";
import { updateModel } from "@/utils/utils";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface ModelViewProps {
  url: string;
}

function analyzeGLTFAssest(gltf) {
  const json = gltf.parser.json; // Access the JSON part of the GLTF
  const buffer = gltf.parser.extensions.KHR_binary_glTF; // Access the Binary part

  console.log(json);
  console.log(buffer);

  let geometrySize = 0,
    textureSize = 0,
    animationSize = 0,
    otherSize = 0;

  // Calculate geometry size
  if (json.meshes) {
    json.meshes.forEach((mesh) => {
      mesh.primitives.forEach((primitive) => {
        // Get size of attributes
        if (primitive.attributes) {
          Object.values(primitive.attributes).forEach((attribute) => {
            const accessor = json.accessors[attribute];
            const accessorSize =
              accessor.count * getBytesPerComponent(accessor.componentType);
            geometrySize += accessorSize;
          });
        }
        // Get size of indices
        if (primitive.indices !== undefined) {
          const accessor = json.accessors[primitive.indices];
          const accessorSize =
            accessor.count * getBytesPerComponent(accessor.componentType);
          geometrySize += accessorSize;
        }
      });
    });
  }

  // Calculate texture size
  if (json.images) {
    json.images.forEach((image) => {
      if (image.bufferView !== undefined) {
        const bufferView = json.bufferViews[image.bufferView];
        textureSize += bufferView.byteLength;
      }
    });
  }

  // Calculate animation size
  if (json.animations) {
    json.animations.forEach((animation) => {
      animation.channels.forEach((channel) => {
        const accessor = json.accessors[channel.sampler];
        const samplerSize =
          accessor.count * getBytesPerComponent(accessor.componentType);
        animationSize += samplerSize;
      });
    });
  }

  console.log(buffer);
  console.log("geometrySize", geometrySize);
  console.log("textureSize", textureSize);
  console.log("animationSize", animationSize);

  // Determine "other" size as the remaining buffer size
  const totalSize = buffer.header.length;
  otherSize = totalSize - geometrySize - textureSize - animationSize;

  const geometryPercent = (geometrySize / totalSize) * 100;
  const texturePercent = (textureSize / totalSize) * 100;
  const animationPercent = (animationSize / totalSize) * 100;
  // const otherPercent = (otherSize / totalSize) * 100;
  const otherPercent =
    100 - geometryPercent - texturePercent - animationPercent;

  console.log(`Geometry: ${geometryPercent}%`);
  console.log(`Textures: ${texturePercent}%`);
  console.log(`Animations: ${animationPercent}%`);
  console.log(`Other: ${otherPercent}%`);
  console.log(
    `Total percentage: ${(
      geometryPercent +
      texturePercent +
      animationPercent +
      otherPercent
    ).toFixed(2)}%`
  ); // Should be 100%
}

function getBytesPerComponent(componentType) {
  switch (componentType) {
    case 5120: // BYTE
    case 5121: // UNSIGNED_BYTE
      return 1;
    case 5122: // SHORT
    case 5123: // UNSIGNED_SHORT
      return 2;
    case 5125: // UNSIGNED_INT
    case 5126: // FLOAT
      return 4;
    default:
      return 1;
  }
}

export default function ModelView({ url }: ModelViewProps) {
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  const gltf = useGLTF(url);
  analyzeGLTFAssest(gltf);
  const { model, compressionSettings } = useModelStore();
  const setModel = useModelStore((state) => state.setModel);

  useEffect(() => {
    setModel(gltf);
  }, [gltf, setModel]);

  useEffect(() => {
    if (compressionSettings && model) {
      updateModel(model, compressionSettings, true);
    }
  }, [compressionSettings, model]);

  return (
    <div id="view-3d">
      <Canvas camera={{ position: [0, 0, 150], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage
            // @ts-ignore
            controls={orbitControlsRef}
            preset={"rembrandt"}
            intensity={1}
            shadows={"contact"}
            adjustCamera
            environment={"city"}
          >
            <primitive object={gltf.scene} />
          </Stage>
        </Suspense>
        <OrbitControls ref={orbitControlsRef} />
      </Canvas>
    </div>
  );
}
