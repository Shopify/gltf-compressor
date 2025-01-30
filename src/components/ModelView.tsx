import { EXPORT_FOLDER_ORDER } from "@/constants";
import { useModelStore } from "@/stores/useModelStore";
import { useModelStore2 } from "@/stores/useModelStore2";
import { updateModel } from "@/utils/utils";
import { Document, WebIO } from "@gltf-transform/core";
import {
  ALL_EXTENSIONS,
  KHRDracoMeshCompression,
} from "@gltf-transform/extensions";
import { cloneDocument } from "@gltf-transform/functions";
import { DocumentView } from "@gltf-transform/view";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { button, useControls } from "leva";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Group } from "three";
import { Stage } from "../drei_stuff/Stage";

interface ModelViewProps {
  url: string;
}

export default function ModelView({ url }: ModelViewProps) {
  const gltf = useGLTF(url);
  const { model, compressionSettings } = useModelStore();
  const setModel = useModelStore((state) => state.setModel);
  const setDocuments = useModelStore2((state) => state.setDocuments);

  useEffect(() => {
    setModel(gltf);
  }, [gltf, setModel]);

  useEffect(() => {
    if (compressionSettings && model) {
      updateModel(model, compressionSettings, true);
    }
  }, [compressionSettings, model]);

  const [modelData, setModelData] = useState<{
    originalDocument: Document;
    modifiedDocument: Document;
    modifiedDocumentView: DocumentView;
    scene: Group;
  } | null>(null);

  useEffect(() => {
    const setupDocumentView = async () => {
      const io = new WebIO()
        .registerExtensions(ALL_EXTENSIONS)
        .registerDependencies({
          // @ts-ignore
          "draco3d.encoder": await new DracoEncoderModule(),
          // @ts-ignore
          "draco3d.decoder": await new DracoDecoderModule(),
        });
      const originalDocument = await io.read(url);
      const modifiedDocument = cloneDocument(originalDocument);
      const modifiedDocumentView = new DocumentView(modifiedDocument);
      const sceneDef = modifiedDocument.getRoot().getDefaultScene()!;
      const group = modifiedDocumentView.view(sceneDef);

      /*
      const materials = originalDocument.getRoot().listMaterials();
      console.log(materials);

      const textures = originalDocument.getRoot().listTextures();
      console.log(textures);

      materials.forEach((material) => {
        console.log("********************");

        console.log("Textures for material: ", material.getName());
        console.log(
          "Base Color: ",
          material.getBaseColorTexture(),
          "Emissive: ",
          material.getEmissiveTexture(),
          "Metallic Roughness: ",
          material.getMetallicRoughnessTexture(),
          "Normal: ",
          material.getNormalTexture(),
          "Occlusion: ",
          material.getOcclusionTexture()
        );

        console.log("Texture Info for material:", material.getName(), {
          baseColor: material.getBaseColorTextureInfo(),
          emissive: material.getEmissiveTextureInfo(),
          metallicRoughness: material.getMetallicRoughnessTextureInfo(),
          normal: material.getNormalTextureInfo(),
          occlusion: material.getOcclusionTextureInfo(),
        });
      });
      */

      setDocuments(originalDocument, modifiedDocument);

      setModelData({
        originalDocument: originalDocument,
        modifiedDocument: modifiedDocument,
        modifiedDocumentView: modifiedDocumentView,
        scene: group,
      });
    };

    if (url) {
      setupDocumentView();
    }
  }, [url]);

  const useDracoCompressionRef = useRef(false);

  const exportGLTF = useCallback(async () => {
    if (!modelData) return;

    const io = new WebIO()
      .registerExtensions(ALL_EXTENSIONS)
      .registerDependencies({
        // @ts-ignore
        "draco3d.encoder": await new DracoEncoderModule(),
        // @ts-ignore
        "draco3d.decoder": await new DracoDecoderModule(),
      });

    if (useDracoCompressionRef.current) {
      modelData.modifiedDocument
        .createExtension(KHRDracoMeshCompression)
        .setRequired(true)
        .setEncoderOptions({
          method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
          encodeSpeed: 5,
        });
    } else {
      // TODO: Figure out how to remove the KHRDracoMeshCompression extension if createExtension has already been called
      // Right now if you export with draco compression enabled, all future exports will be draco compressed
    }

    const compressedArrayBuffer = await io.writeBinary(
      modelData.modifiedDocument
    );

    const blob = new Blob([compressedArrayBuffer], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "scene.glb";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  }, [modelData]);

  const processTexture = useCallback(async () => {
    if (!modelData) return;

    const originalTexture = modelData.originalDocument
      .getRoot()
      .listTextures()[0];

    const modifiedTexture = modelData.modifiedDocument
      .getRoot()
      .listTextures()[0];

    // This is an example of how to compress with gltf-transform
    // modifiedTexture.setImage(originalTexture.getImage());
    // await compressTexture(modifiedTexture, {
    //   resize: [256, 256],
    //   targetFormat: "jpeg",
    // });

    // Create a blob from the UInt8Array
    const blob = new Blob([originalTexture.getImage()!], { type: "image/png" });
    const blobUrl = URL.createObjectURL(blob);

    // Create an image element to load the blob URL
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = (e) => reject(console.log(e));
      img.src = blobUrl;
    });

    // Create resized canvas
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Draw the original image onto the canvas, scaling it to fit
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Convert canvas to PNG data as Uint8Array
    const pngUint8Array = await new Promise<Uint8Array>(async (resolve) => {
      canvas.toBlob(
        async (blob) => {
          const arrayBuffer = await blob!.arrayBuffer();
          resolve(new Uint8Array(arrayBuffer));
        },
        "image/jpeg"
        // 0.2
      );
    });

    modifiedTexture.setImage(pngUint8Array);
    modifiedTexture.setMimeType("image/jpeg");
  }, [modelData]);

  useControls(
    "Export",
    {
      "Use Draco Compression": {
        value: false,
        onChange: (value) => {
          useDracoCompressionRef.current = value;
        },
      },
      Export: button(async () => {
        await exportGLTF();
      }),
      "Compress Texture": button(async () => {
        await processTexture();
      }),
    },
    { collapsed: false, order: EXPORT_FOLDER_ORDER },
    [processTexture]
  );

  if (!modelData) return null;

  return (
    <div id="view-3d">
      <Canvas camera={{ position: [0, 0, 150], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage
            preset={"rembrandt"}
            intensity={1}
            shadows={"contact"}
            adjustCamera
            environment={"city"}
          >
            <primitive object={modelData.scene} />
          </Stage>
        </Suspense>
        <axesHelper />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
