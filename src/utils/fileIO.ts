import { Document, Texture, WebIO } from "@gltf-transform/core";
import {
  ALL_EXTENSIONS,
  EXTTextureWebP,
  KHRDracoMeshCompression,
} from "@gltf-transform/extensions";
import {
  cloneDocument,
  dedup,
  flatten,
  join,
  prune,
  resample,
  weld,
} from "@gltf-transform/functions";
import { DocumentView } from "@gltf-transform/view";
import { toast } from "sonner";

import { useModelStore } from "@/stores/useModelStore";
import { useViewportStore } from "@/stores/useViewportStore";
import { TextureCompressionSettings } from "@/types/types";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

const isGLBFile = (path: string): boolean => /\.glb$/i.test(path);

const isGLTFFile = (path: string): boolean => /\.gltf$/i.test(path);

const loadFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

const convertArrayBufferToBase64 = (buffer: Uint8Array): string => {
  let binary = "";
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
};

const createDocumentsAndSceneFromURL = async (url: string) => {
  const io = new WebIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "draco3d.encoder":
        // @ts-ignore
        await new DracoEncoderModule(),

      "draco3d.decoder":
        // @ts-ignore
        await new DracoDecoderModule(),
      "meshopt.decoder": MeshoptDecoder,
    });
  const originalDocument = await io.read(url);
  const modifiedDocument = cloneDocument(originalDocument);

  // Create live views of the original and modified documents
  // We render these live views in the ModelView component
  const originalDocumentView = new DocumentView(originalDocument);
  const modifiedDocumentView = new DocumentView(modifiedDocument);
  const originalSceneDefinition = originalDocument.getRoot().getDefaultScene()!;
  const modifiedSceneDefinition = modifiedDocument.getRoot().getDefaultScene()!;
  const originalScene = originalDocumentView.view(originalSceneDefinition);
  const modifiedScene = modifiedDocumentView.view(modifiedSceneDefinition);

  return {
    originalDocument,
    modifiedDocument,
    originalDocumentView,
    modifiedDocumentView,
    originalScene,
    modifiedScene,
  };
};

const createDocumentsAndSceneFromBuffers = async (
  buffers: Map<string, ArrayBuffer>,
  mainFilePath: string
) => {
  const io = new WebIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "draco3d.encoder":
        // @ts-ignore
        await new DracoEncoderModule(),

      "draco3d.decoder":
        // @ts-ignore
        await new DracoDecoderModule(),
    });

  // Get the buffer of the .gltf file
  const mainBuffer = buffers.get(mainFilePath);
  if (!mainBuffer) {
    throw new Error(
      "No .gltf file was found in the files that were dropped in."
    );
  }

  // Parse the JSON
  const jsonString = new TextDecoder().decode(mainBuffer);
  const json = JSON.parse(jsonString);

  // Clone the JSON to modify it
  const modifiedJson = JSON.parse(JSON.stringify(json));

  // Track missing files
  const missingFiles: string[] = [];

  // Convert buffer URIs to data URIs
  if (modifiedJson.buffers) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modifiedJson.buffers = modifiedJson.buffers.map((buffer: any) => {
      if (buffer.uri && !buffer.uri.startsWith("data:")) {
        // Find the buffer in our buffers map
        let bufferData: ArrayBuffer | undefined;

        // Try different path variations
        const uriVariations = [
          buffer.uri,
          buffer.uri.replace(/^\//, ""),
          buffer.uri.split("/").pop(),
        ];

        for (const variation of uriVariations) {
          if (variation && buffers.has(variation)) {
            bufferData = buffers.get(variation);
            break;
          }
        }

        if (bufferData) {
          // Convert to base64 data URI efficiently
          const uint8Array = new Uint8Array(bufferData);
          const base64 = convertArrayBufferToBase64(uint8Array);
          return {
            ...buffer,
            uri: `data:application/octet-stream;base64,${base64}`,
          };
        }

        // Add to missing files list
        missingFiles.push(buffer.uri);
      }
      return buffer;
    });
  }

  // Convert image URIs to data URIs
  if (modifiedJson.images) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modifiedJson.images = modifiedJson.images.map((image: any) => {
      if (image.uri && !image.uri.startsWith("data:")) {
        // Find the image in our buffers map
        let imageData: ArrayBuffer | undefined;

        // Try different path variations
        const uriVariations = [
          image.uri,
          image.uri.replace(/^\//, ""),
          image.uri.split("/").pop(),
        ];

        for (const variation of uriVariations) {
          if (variation && buffers.has(variation)) {
            imageData = buffers.get(variation);
            break;
          }
        }

        if (imageData) {
          // Determine MIME type from file extension
          const ext = image.uri.split(".").pop()?.toLowerCase();
          const mimeTypeMap: Record<string, string> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            webp: "image/webp",
          };
          const mimeType = mimeTypeMap[ext || ""] || "application/octet-stream";

          // Convert to base64 data URI efficiently
          const uint8Array = new Uint8Array(imageData);
          const base64 = convertArrayBufferToBase64(uint8Array);
          return { ...image, uri: `data:${mimeType};base64,${base64}` };
        }

        // Add to missing files list
        missingFiles.push(image.uri);
      }
      return image;
    });
  }

  // Check if there are any missing files
  if (missingFiles.length > 0) {
    const fileList = missingFiles.map((file) => `${file}`).join(", ");
    throw new Error(`The following files are missing: ${fileList}`);
  }

  // Create a blob URL for the modified JSON with embedded data URIs
  const jsonBlob = new Blob([JSON.stringify(modifiedJson)], {
    type: "application/json",
  });
  const jsonBlobUrl = URL.createObjectURL(jsonBlob);

  let originalDocument: Document;
  try {
    // Load the document using the blob URL
    originalDocument = await io.read(jsonBlobUrl);
  } finally {
    // Clean up the blob URL
    URL.revokeObjectURL(jsonBlobUrl);
  }

  const modifiedDocument = cloneDocument(originalDocument);

  // Create live views of the original and modified documents
  // We render these live views in the ModelView component
  const originalDocumentView = new DocumentView(originalDocument);
  const modifiedDocumentView = new DocumentView(modifiedDocument);
  const originalSceneDefinition = originalDocument.getRoot().getDefaultScene()!;
  const modifiedSceneDefinition = modifiedDocument.getRoot().getDefaultScene()!;
  const originalScene = originalDocumentView.view(originalSceneDefinition);
  const modifiedScene = modifiedDocumentView.view(modifiedSceneDefinition);

  return {
    originalDocument,
    modifiedDocument,
    originalDocumentView,
    modifiedDocumentView,
    originalScene,
    modifiedScene,
  };
};

function buildTextureCompressionSettingsMap(
  document: Document,
  modifiedDocument: Document
): Map<Texture, TextureCompressionSettings> {
  const textureCompressionSettingsMap = new Map<
    Texture,
    TextureCompressionSettings
  >();

  const texturesInOriginalDocument = document.getRoot().listTextures();

  const texturesInModifiedDocument = modifiedDocument.getRoot().listTextures();

  texturesInOriginalDocument.forEach((texture, index) => {
    const resolution = texture.getSize() ?? [0, 0];
    const maxResolution = Math.max(resolution[0], resolution[1]);

    const textureCompressionSettings: TextureCompressionSettings = {
      compressedTexture: texturesInModifiedDocument[index],
      compressionEnabled: false,
      mimeType: texture.getMimeType(),
      maxResolution,
      quality: 0.8,
      isBeingCompressed: false,
    };
    textureCompressionSettingsMap.set(texture, textureCompressionSettings);
  });

  return textureCompressionSettingsMap;
}

export const importFiles = async <T extends File>(acceptedFiles: T[]) => {
  useViewportStore.setState({ loadingFiles: true });

  if (acceptedFiles.length === 0) {
    toast.error("No files were dropped in.");
    useViewportStore.setState({ loadingFiles: false });
    return;
  }

  const gltfFiles = acceptedFiles.filter((file) => isGLTFFile(file.name));
  const glbFiles = acceptedFiles.filter((file) => isGLBFile(file.name));

  // Check if there are both .glb and .gltf files
  if (glbFiles.length > 0 && gltfFiles.length > 0) {
    toast.error(
      "Cannot mix .glb and .gltf files. Please drop either a single .glb file or a .gltf file with its external resources."
    );
    useViewportStore.setState({ loadingFiles: false });
    return;
  }

  // Check if there are multiple .glb files
  if (glbFiles.length > 1) {
    toast.error(
      "Only one .glb file is allowed. Please drop a single .glb file."
    );
    useViewportStore.setState({ loadingFiles: false });
    return;
  }

  // Check if there's a .glb file with other files
  if (glbFiles.length === 1 && acceptedFiles.length > 1) {
    toast.error(
      "A .glb file should be dropped alone. Please drop only the .glb file or use a .gltf file with its external resources."
    );
    useViewportStore.setState({ loadingFiles: false });
    return;
  }

  // Check if there are multiple .gltf files
  if (gltfFiles.length > 1) {
    toast.error(
      "Only one .gltf file is allowed. Please drop a single .gltf file with its external resources."
    );
    useViewportStore.setState({ loadingFiles: false });
    return;
  }

  // Check if there's no .gltf file when multiple files are dropped
  if (gltfFiles.length === 0 && acceptedFiles.length > 1) {
    toast.error(
      "When dropping multiple files, exactly one must be a .gltf file. The other files should be textures or .bin files."
    );
    useViewportStore.setState({ loadingFiles: false });
    return;
  }

  // If there is only one file, check if it's a GLB
  // If it is, create the documents and scene from it
  if (acceptedFiles.length === 1 && isGLBFile(acceptedFiles[0].name)) {
    const url = URL.createObjectURL(acceptedFiles[0]);
    if (url) {
      const fileName = acceptedFiles[0].name.substring(
        0,
        acceptedFiles[0].name.lastIndexOf(".")
      );

      const {
        originalDocument,
        modifiedDocument,
        originalDocumentView,
        modifiedDocumentView,
        originalScene,
        modifiedScene,
      } = await createDocumentsAndSceneFromURL(url);

      const textureCompressionSettingsMap = buildTextureCompressionSettingsMap(
        originalDocument,
        modifiedDocument
      );

      useModelStore.setState({
        fileName,
        originalDocument,
        modifiedDocument,
        originalDocumentView,
        modifiedDocumentView,
        originalScene,
        modifiedScene,
        textureCompressionSettingsMap,
      });

      useModelStore.getState().setInitialModelStats();
      URL.revokeObjectURL(url);
    }

    useViewportStore.setState({ loadingFiles: false });
    return;
  }

  // If there are multiple files, one needs to be a .gltf file and the rest need to be textures or .bin files
  // Start by loading all files as ArrayBuffers
  const buffers = new Map<string, ArrayBuffer>();
  await Promise.all(
    acceptedFiles.map((file) =>
      loadFileAsArrayBuffer(file).then((buffer) =>
        buffers.set(file.name, buffer)
      )
    )
  );

  // Find the .gltf file
  const mainFilePath = Array.from(buffers.keys()).find((path) =>
    isGLTFFile(path)
  );
  if (!mainFilePath) {
    toast.error("No .gltf file was found in the files that were dropped in.");
    useViewportStore.setState({ loadingFiles: false });
    return;
  }

  try {
    const fileName = mainFilePath.substring(0, mainFilePath.lastIndexOf("."));

    const {
      originalDocument,
      modifiedDocument,
      originalDocumentView,
      modifiedDocumentView,
      originalScene,
      modifiedScene,
    } = await createDocumentsAndSceneFromBuffers(buffers, mainFilePath);

    const textureCompressionSettingsMap = buildTextureCompressionSettingsMap(
      originalDocument,
      modifiedDocument
    );

    useModelStore.setState({
      fileName,
      originalDocument,
      modifiedDocument,
      originalDocumentView,
      modifiedDocumentView,
      originalScene,
      modifiedScene,
      textureCompressionSettingsMap,
    });

    useModelStore.getState().setInitialModelStats();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    toast.error(error.message);
  } finally {
    useViewportStore.setState({ loadingFiles: false });
  }
};

export const exportDocument = async (
  fileName: string,
  documentToExport: Document,
  dracoCompress: boolean,
  deduplicate: boolean,
  flattenAndJoin: boolean,
  doWeld: boolean,
  doResample: boolean,
  doPrune: boolean
) => {
  const finalDocument = cloneDocument(documentToExport);

  if (deduplicate || flattenAndJoin || doWeld || doResample || doPrune) {
    await finalDocument.transform(
      // Remove duplicate meshes, materials, textures, etc.
      deduplicate ? dedup() : () => {},

      // Reduce nesting of the scene graph; required for join()
      flattenAndJoin ? flatten() : () => {},

      // Join compatible meshes
      flattenAndJoin ? join() : () => {},

      // Weld (index) all mesh geometry, removing duplicate vertices
      doWeld ? weld() : () => {},

      // Losslessly resample animation frames
      doResample ? resample() : () => {},

      // Remove unused nodes, textures, materials, etc.
      doPrune ? prune() : () => {}
    );
  }

  const io = new WebIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "draco3d.encoder":
        // @ts-ignore
        await new DracoEncoderModule(),

      "draco3d.decoder":
        // @ts-ignore
        await new DracoDecoderModule(),
      "meshopt.encoder": MeshoptEncoder,
    });

  if (dracoCompress) {
    // Add KHR_draco_mesh_compression
    finalDocument
      .createExtension(KHRDracoMeshCompression)
      .setRequired(true)
      .setEncoderOptions({
        method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
        encodeSpeed: 5,
      });
  } else {
    // Remove KHR_draco_mesh_compression if it exists
    const ext = finalDocument
      .getRoot()
      .listExtensionsUsed()
      .find((ext) => ext.extensionName === "KHR_draco_mesh_compression");
    if (ext) {
      ext.dispose();
    }
  }

  const documentHasWebPTexture = finalDocument
    .getRoot()
    .listTextures()
    .some((texture) => texture.getMimeType() === "image/webp");
  if (documentHasWebPTexture) {
    // Add EXT_texture_webp
    finalDocument.createExtension(EXTTextureWebP).setRequired(true);
  } else {
    // Remove EXT_texture_webp if it exists
    const ext = finalDocument
      .getRoot()
      .listExtensionsUsed()
      .find((ext) => ext.extensionName === "EXT_texture_webp");
    if (ext) {
      ext.dispose();
    }
  }

  const compressedArrayBuffer = await io.writeBinary(finalDocument);

  const blob = new Blob([compressedArrayBuffer as BlobPart], {
    type: "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = `${fileName}_compressed.glb`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
};
