import { TextureCompressionSettings } from "@/types";
import { Document, Material, Texture, WebIO } from "@gltf-transform/core";
import {
  ALL_EXTENSIONS,
  EXTTextureWebP,
  KHRDracoMeshCompression,
} from "@gltf-transform/extensions";
import { cloneDocument } from "@gltf-transform/functions";
import { DocumentView } from "@gltf-transform/view";
import { compressImage } from "./compress";
import { getTexturesFromMaterial } from "./utils";

export const createDocuments = async (url: string) => {
  const io = new WebIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      // @ts-ignore
      "draco3d.encoder": await new DracoEncoderModule(),
      // @ts-ignore
      "draco3d.decoder": await new DracoDecoderModule(),
    });
  const originalDocument = await io.read(url);

  // The modified document is the one that we will be compressing
  const modifiedDocument = cloneDocument(originalDocument);

  // Create a live view of the modified document
  // We render this live view in the ModelView component
  const modifiedDocumentView = new DocumentView(modifiedDocument);
  const sceneDef = modifiedDocument.getRoot().getDefaultScene()!;
  const sceneView = modifiedDocumentView.view(sceneDef);

  return { originalDocument, modifiedDocument, sceneView };
};

export const compressDocumentTexture = async (
  originalTexture: Texture,
  compressionSettings: TextureCompressionSettings
) => {
  const format = compressionSettings.type || "image/jpeg";
  const compressedImageData = await compressImage(
    originalTexture.getImage()!,
    compressionSettings.maxDimension,
    format,
    compressionSettings.quality
  );
  if (compressionSettings.compressed) {
    compressionSettings.compressed!.setImage(compressedImageData);
    compressionSettings.compressed!.setMimeType(format);
  }
};

export const getAvailableMaterialNames = (document: Document) => {
  return document
    .getRoot()
    .listMaterials()
    .map((m) => m.getName());
};

export const getMaterialbyName = (
  document: Document,
  name: string
): Material | null => {
  return (
    document
      .getRoot()
      .listMaterials()
      .find((m) => m.getName() === name) || null
  );
};

export const getMaterialTextureBySlot = (
  material: Material,
  slot: string
): Texture | null => {
  return (
    getTexturesFromMaterial(material).find(
      ({ slot: textureSlot }) => textureSlot === slot
    )?.texture || null
  );
};

export const exportDocument = async (
  documentToExport: Document,
  useDracoCompression: boolean
) => {
  const io = new WebIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      // @ts-ignore
      "draco3d.encoder": await new DracoEncoderModule(),
      // @ts-ignore
      "draco3d.decoder": await new DracoDecoderModule(),
    });

  if (useDracoCompression) {
    documentToExport
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

  const documentHasWebPTexture = documentToExport
    .getRoot()
    .listTextures()
    .some((texture) => texture.getMimeType() === "image/webp");
  if (documentHasWebPTexture) {
    // Add EXT_texture_webp
    documentToExport.createExtension(EXTTextureWebP).setRequired(true);
  } else {
    // Remove EXT_texture_webp if it exists
    const ext = documentToExport
      .getRoot()
      .listExtensionsUsed()
      .find((ext) => ext.extensionName === "EXT_texture_webp");
    if (ext) {
      ext.dispose();
    }
  }

  const compressedArrayBuffer = await io.writeBinary(documentToExport);

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
};
