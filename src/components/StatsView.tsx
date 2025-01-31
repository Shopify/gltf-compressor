import { useModelStore } from "@/stores/useModelStore";

export default function StatsView() {
  const { modelStats } = useModelStore();

  if (!modelStats) return null;

  return (
    <div className="absolute top-4 left-4 p-4 text-white font-mono text-xs select-none pointer-events-none">
      <div>Objects: {modelStats.numMeshes}</div>
      <div>Verts: {modelStats.numVertices}</div>
      <div>Textures: {modelStats.numTextures}</div>
      <div>Anim Clips: {modelStats.numAnimationClips}</div>
      <br />
      <div>
        Meshes: {modelStats.sizeOfMeshes.toFixed(2)} KB (
        {modelStats.percentOfSizeTakenByMeshes.toFixed(2)}%)
      </div>
      <div>
        Textures: {modelStats.sizeOfTextures.toFixed(2)} KB (
        {modelStats.percentOfSizeTakenByTextures.toFixed(2)}%)
      </div>
      <div>
        Anim Clips: {modelStats.sizeOfAnimations.toFixed(2)} KB (
        {modelStats.percentOfSizeTakenByAnimations.toFixed(2)}%)
      </div>
    </div>
  );
}
