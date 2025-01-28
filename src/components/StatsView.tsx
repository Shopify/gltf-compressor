import { useEffect } from "react";

import { WebIO } from "@gltf-transform/core";
import { inspect } from "@gltf-transform/functions";

interface StatsViewProps {
  url: string;
}

export default function ModelView({ url }: StatsViewProps) {
  useEffect(() => {
    const analyzeWithGLTFTransform = async () => {
      const io = new WebIO();
      const document = await io.read(url);
      const report = inspect(document);
      console.log("GLTF-Transform Report:", report);
    };

    analyzeWithGLTFTransform();
  }, [url]);

  return <div></div>;
}
