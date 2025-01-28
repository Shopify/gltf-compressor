import { WebIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { inspect } from "@gltf-transform/functions";
import { useEffect, useState } from "react";

interface StatsViewProps {
  url: string;
}

interface Stats {
  meshes: number;
  textures: number;
  animations: number;
}

export default function StatsView({ url }: StatsViewProps) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const analyzeWithGLTFTransform = async () => {
      const io = new WebIO().registerExtensions(KHRONOS_EXTENSIONS);
      const document = await io.read(url);
      const report = inspect(document);

      setStats({
        meshes: report.meshes.properties.length,
        textures: report.textures.properties.length,
        animations: report.animations.properties.length,
      });
    };

    analyzeWithGLTFTransform();
  }, [url]);

  if (!stats) return null;

  return (
    <div className="absolute top-4 left-4 bg-black/50 p-4 rounded text-white font-mono text-sm">
      <div>Meshes: {stats.meshes}</div>
      <div>Textures: {stats.textures}</div>
      <div>Animations: {stats.animations}</div>
    </div>
  );
}
