import { TextureCompressionSettings } from "@/types";
import {
  Document,
  ExtensionProperty,
  Material,
  Texture,
  WebIO,
} from "@gltf-transform/core";
import {
  ALL_EXTENSIONS,
  EXTTextureWebP,
  KHRDracoMeshCompression,
} from "@gltf-transform/extensions";
import { cloneDocument } from "@gltf-transform/functions";
import { DocumentView } from "@gltf-transform/view";
import { compressImage } from "./compress";

export const createDocumentsAndScene = async (url: string) => {
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

  // Create a live view of the modified document
  // We render this live view in the ModelView component
  const modifiedDocumentView = new DocumentView(modifiedDocument);
  const sceneDefinition = modifiedDocument.getRoot().getDefaultScene()!;
  const scene = modifiedDocumentView.view(sceneDefinition);

  return { originalDocument, modifiedDocument, scene };
};

export const compressTexture = async (
  originalTexture: Texture,
  compressionSettings: TextureCompressionSettings
) => {
  const format = compressionSettings.mimeType || "image/jpeg";
  const compressedImageData = await compressImage(
    originalTexture.getImage()!,
    compressionSettings.maxDimension,
    format,
    compressionSettings.quality
  );
  if (compressionSettings.compressedTexture) {
    compressionSettings.compressedTexture!.setImage(compressedImageData);
    compressionSettings.compressedTexture!.setMimeType(format);
  }
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
    // Add KHR_draco_mesh_compression
    documentToExport
      .createExtension(KHRDracoMeshCompression)
      .setRequired(true)
      .setEncoderOptions({
        method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
        encodeSpeed: 5,
      });
  } else {
    // Remove KHR_draco_mesh_compression if it exists
    const ext = documentToExport
      .getRoot()
      .listExtensionsUsed()
      .find((ext) => ext.extensionName === "KHR_draco_mesh_compression");
    if (ext) {
      ext.dispose();
    }
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

export const getMaterialNames = (document: Document) => {
  return document
    .getRoot()
    .listMaterials()
    .map((m) => m.getName());
};

export const getMaterialByName = (
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

export function getTexturesFromMaterial(
  material: Material
): { slot: string; texture: Texture }[] {
  const extensions = new Set<ExtensionProperty>(material.listExtensions());
  return material
    .getGraph()
    .listEdges()
    .filter((ref) => {
      const child = ref.getChild();
      const parent = ref.getParent();
      if (child instanceof Texture && parent === material) {
        return true;
      }
      if (
        child instanceof Texture &&
        parent instanceof ExtensionProperty &&
        extensions.has(parent)
      ) {
        return true;
      }
      return false;
    })
    .map((ref) => {
      return {
        slot: ref.getName() || "",
        texture: (ref.getChild() as Texture) || null,
      };
    });
}

export function getTextureSlotsFromMaterial(material: Material): string[] {
  return getTexturesFromMaterial(material).map(({ slot }) => slot);
}

export const getTextureBySlotName = (
  material: Material,
  slot: string
): Texture | null => {
  return (
    getTexturesFromMaterial(material).find(
      ({ slot: textureSlot }) => textureSlot === slot
    )?.texture || null
  );
};

export function getUniqueTextures(document: Document): Texture[] {
  const uniqueTextures = new Set<Texture>();

  document
    .getRoot()
    .listMaterials()
    .forEach((material) => {
      const materialTextures = getTexturesFromMaterial(material);

      materialTextures.forEach(({ texture }) => {
        uniqueTextures.add(texture);
      });
    });

  return Array.from(uniqueTextures);
}
