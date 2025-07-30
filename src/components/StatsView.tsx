import { useModelStore } from "@/stores/useModelStore";
import { formatSize } from "@/utils/displayUtils";

export default function StatsView() {
  const modelStats = useModelStore((state) => state.modelStats);

  return (
    <div className="absolute top-4 left-4 text-white font-mono text-xs pointer-events-none">
      <div>Meshes: {modelStats.numMeshes}</div>
      <div>Vertices: {modelStats.numVertices}</div>
      <div>Textures: {modelStats.numTextures}</div>
      <div>Anim Clips: {modelStats.numAnimationClips}</div>
      <br />
      <div>Meshes: {formatSize(modelStats.sizeOfMeshes)}</div>
      <div>
        Textures: {formatSize(modelStats.sizeOfTextures)}
        {modelStats.percentChangeInTextures !== 0 &&
          modelStats.percentChangeInTextures > 0 && (
            <span className="text-green-400">
              {" "}
              ↓ {modelStats.percentChangeInTextures.toFixed(1)}%
            </span>
          )}
        {modelStats.percentChangeInTextures !== 0 &&
          modelStats.percentChangeInTextures < 0 && (
            <span className="text-red-400">
              {" "}
              ↑ {Math.abs(modelStats.percentChangeInTextures).toFixed(1)}%
            </span>
          )}
      </div>
      <div>Anim Clips: {formatSize(modelStats.sizeOfAnimations)}</div>
      <br />
    </div>
  );
}
