import { useModelStore } from "@/stores/useModelStore";
import { updateModel } from "@/utils/utils";
import { WebIO } from "@gltf-transform/core";
import {
  KHRDracoMeshCompression,
  KHRONOS_EXTENSIONS,
} from "@gltf-transform/extensions";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { button, useControls } from "leva";
import { Suspense, useCallback, useEffect, useRef } from "react";
import { Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { Stage } from "../drei_stuff/Stage";

interface ModelViewProps {
  url: string;
}

export default function ModelView({ url }: ModelViewProps) {
  const sceneRef = useRef<Group>(null);
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  const gltf = useGLTF(url);
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

  const useDracoCompressionRef = useRef(false);

  const exportGLTF = useCallback(() => {
    if (!sceneRef.current || !sceneRef.current.children) return;

    const exporter = new GLTFExporter();
    exporter.parse(
      sceneRef.current.children,
      async (gltf) => {
        let blob;
        if (useDracoCompressionRef.current) {
          const io = new WebIO()
            .registerExtensions(KHRONOS_EXTENSIONS)
            .registerDependencies({
              // @ts-ignore
              "draco3d.encoder": await new DracoEncoderModule(),
              // @ts-ignore
              "draco3d.decoder": await new DracoDecoderModule(),
            });

          const doc = await io.readBinary(new Uint8Array(gltf as ArrayBuffer));

          // Resample animation clips, losslessly deduplicating keyframes to reduce file size
          // await doc.transform(resample());

          doc
            .createExtension(KHRDracoMeshCompression)
            .setRequired(true)
            .setEncoderOptions({
              method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
              encodeSpeed: 5,
            });

          const compressedArrayBuffer = await io.writeBinary(doc);
          blob = new Blob([compressedArrayBuffer], {
            type: "application/octet-stream",
          });
        } else {
          // @ts-ignore
          blob = new Blob([gltf], { type: "application/octet-stream" });
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "scene.glb";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
      },
      (error) => {
        console.error("An error occurred while exporting the file", error);
      },
      {
        binary: true,
        animations: gltf.animations,
      }
    );
  }, []);

  useControls(
    "Export",
    {
      "Use Draco Compression": {
        value: false,
        onChange: (value) => {
          useDracoCompressionRef.current = value;
        },
      },
      Export: button(() => {
        exportGLTF();
      }),
    },
    { collapsed: false }
  );

  return (
    <div id="view-3d">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
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
            <primitive ref={sceneRef} object={gltf.scene} />
          </Stage>
        </Suspense>
        <OrbitControls ref={orbitControlsRef} />
      </Canvas>
    </div>
  );
}
