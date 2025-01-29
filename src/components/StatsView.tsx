import { WebIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { inspect } from "@gltf-transform/functions";
import { useEffect, useState } from "react";

interface StatsViewProps {
  url: string;
}

interface Stats {
  numMeshes: number;
  numVertices: number;
  numTextures: number;
  numAnimationClips: number;
  sizeOfMeshes: number;
  sizeOfTextures: number;
  sizeOfAnimations: number;
  percentOfSizeTakenByMeshes: number;
  percentOfSizeTakenByTextures: number;
  percentOfSizeTakenByAnimations: number;
}

export default function StatsView({ url }: StatsViewProps) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const analyzeWithGLTFTransform = async () => {
      const io = new WebIO()
        .registerExtensions(KHRONOS_EXTENSIONS)
        .registerDependencies({
          // @ts-ignore
          "draco3d.encoder": await new DracoEncoderModule(),
          // @ts-ignore
          "draco3d.decoder": await new DracoDecoderModule(),
        });
      const document = await io.read(url);
      const report = inspect(document);

      const numRenderVertices = report.scenes.properties.reduce(
        (total, scene) => total + scene.renderVertexCount,
        0
      );

      const sizeOfMeshes = report.meshes.properties.reduce(
        (total, mesh) => total + mesh.size / 1000,
        0
      );

      const sizeOfTextures = report.textures.properties.reduce(
        (total, texture) => total + texture.size / 1000,
        0
      );

      const sizeOfAnimations = report.animations.properties.reduce(
        (total, animation) => total + animation.size / 1000,
        0
      );

      const totalSize = sizeOfMeshes + sizeOfTextures + sizeOfAnimations;
      const percentOfSizeTakenByMeshes = (sizeOfMeshes / totalSize) * 100;
      const percentOfSizeTakenByTextures = (sizeOfTextures / totalSize) * 100;
      const percentOfSizeTakenByAnimations =
        (sizeOfAnimations / totalSize) * 100;

      setStats({
        numMeshes: report.meshes.properties.length,
        numVertices: numRenderVertices,
        numTextures: report.textures.properties.length,
        numAnimationClips: report.animations.properties.length,
        sizeOfMeshes: sizeOfMeshes,
        sizeOfTextures: sizeOfTextures,
        sizeOfAnimations: sizeOfAnimations,
        percentOfSizeTakenByMeshes: percentOfSizeTakenByMeshes,
        percentOfSizeTakenByTextures: percentOfSizeTakenByTextures,
        percentOfSizeTakenByAnimations: percentOfSizeTakenByAnimations,
      });
    };

    analyzeWithGLTFTransform();
  }, [url]);

  if (!stats) return null;

  return (
    <div className="absolute top-4 left-4 p-4 text-white font-mono text-xs">
      <div>Number of Meshes: {stats.numMeshes}</div>
      <div>Number of Vertices: {stats.numVertices}</div>
      <div>Number of Textures: {stats.numTextures}</div>
      <div>Number of Animation Clips: {stats.numAnimationClips}</div>
      <div>
        Size of Meshes: {stats.sizeOfMeshes.toFixed(2)} KB (
        {stats.percentOfSizeTakenByMeshes.toFixed(2)}%)
      </div>
      <div>
        Size of Textures: {stats.sizeOfTextures.toFixed(2)} KB (
        {stats.percentOfSizeTakenByTextures.toFixed(2)}%)
      </div>
      <div>
        Size of Animation Clips: {stats.sizeOfAnimations.toFixed(2)} KB (
        {stats.percentOfSizeTakenByAnimations.toFixed(2)}%)
      </div>
    </div>
  );
}
