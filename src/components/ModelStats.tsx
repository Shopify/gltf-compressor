import { Material } from "three";
import { GLTF } from "three-stdlib";

interface ModelStatsProps {
  model: GLTF & {
    materials: { [key: string]: Material };
  };
}

export default function ModelStats({ model }: ModelStatsProps) {
  const { materials } = model;

  return (
    <div id="model-stats">
      <h3>Model Materials</h3>
      <ul>
        {Object.entries(materials).map(([name, material], index) => (
          <li key={index}>
            {name} ({material.type})
          </li>
        ))}
      </ul>
    </div>
  );
}
