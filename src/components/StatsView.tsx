import { useModelStore } from "@/stores/useModelStore";
import { inspect } from "@gltf-transform/functions";
import { useEffect, useState } from "react";

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

export default function StatsView() {
  const { modifiedDocument } = useModelStore();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const analyzeWithGLTFTransform = async () => {
      if (!modifiedDocument) return;

      const report = inspect(modifiedDocument);

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
  }, [modifiedDocument]);

  if (!stats) return null;

  return (
    <div className="absolute top-4 left-4 p-4 text-white font-mono text-xs select-none pointer-events-none">
      <div>Meshes: {stats.numMeshes}</div>
      <div>Verts: {stats.numVertices}</div>
      <div>Textures: {stats.numTextures}</div>
      <div>Anim Clips: {stats.numAnimationClips}</div>
      <br />
      <div>
        Meshes: {stats.sizeOfMeshes.toFixed(2)} KB (
        {stats.percentOfSizeTakenByMeshes.toFixed(2)}%)
      </div>
      <div>
        Textures: {stats.sizeOfTextures.toFixed(2)} KB (
        {stats.percentOfSizeTakenByTextures.toFixed(2)}%)
      </div>
      <div>
        Anim Clips: {stats.sizeOfAnimations.toFixed(2)} KB (
        {stats.percentOfSizeTakenByAnimations.toFixed(2)}%)
      </div>
    </div>
  );
}
