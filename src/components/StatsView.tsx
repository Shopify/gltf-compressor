import { useModelStore } from "@/stores/useModelStore";

export default function StatsView() {
  const { modelStats } = useModelStore();

  if (!modelStats) return null;

  return (
    <div className="absolute top-4 left-4 text-white font-mono text-xs pointer-events-none">
      <div>Meshes: {modelStats.numMeshes}</div>
      <div>Vertices: {modelStats.numVertices}</div>
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
        {modelStats.percentChangeInTextures !== null &&
          modelStats.percentChangeInTextures > 0 && (
            <span className="text-green-400">
              {" "}
              ↓ {modelStats.percentChangeInTextures.toFixed(1)}%
            </span>
          )}
        {modelStats.percentChangeInTextures !== null &&
          modelStats.percentChangeInTextures < 0 && (
            <span className="text-red-400">
              {" "}
              ↑ {Math.abs(modelStats.percentChangeInTextures).toFixed(1)}%
            </span>
          )}
      </div>
      <div>
        Anim Clips: {modelStats.sizeOfAnimations.toFixed(2)} KB (
        {modelStats.percentOfSizeTakenByAnimations.toFixed(2)}%)
      </div>
    </div>
  );
}
