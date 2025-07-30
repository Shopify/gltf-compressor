import { Material as GLTFMaterial } from "@gltf-transform/core";
import { DocumentView } from "@gltf-transform/view";
import { RefObject } from "react";
import {
  Material,
  Mesh,
  Object3D,
  WebGLProgramParametersWithUniforms,
} from "three";

/**
 * Find meshes by traversing the Three.js scene and checking if their material corresponds to the glTF-Transform material
 * @param documentView The DocumentView instance
 * @param gltfMaterial The glTF-Transform material to search for
 * @param scene The Three.js scene to traverse
 * @returns Array of Three.js meshes that use the specified material
 */
export function findMeshesByMaterial(
  documentView: DocumentView,
  gltfMaterial: GLTFMaterial,
  scene: Object3D
): Mesh[] {
  const meshes: Mesh[] = [];
  const threeMaterialViews = documentView.listViews(gltfMaterial);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scene.traverse((child: any) => {
    if (child.isMesh && child.material) {
      // Handle both single material and material array cases
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      for (const material of materials) {
        if (threeMaterialViews.includes(material)) {
          meshes.push(child);
          break;
        }
      }
    }
  });

  return meshes;
}

export function applyMaterialHighlighting(
  meshesWithMaterial: Mesh[],
  glowShaderRefs: RefObject<WebGLProgramParametersWithUniforms[]>,
  modifiedMeshes: RefObject<Map<Mesh, Material | Material[]>>,
  modelDimensions: [number, number, number] | null
) {
  let materialClones: Material[] = [];
  glowShaderRefs.current = [];

  meshesWithMaterial.forEach((mesh) => {
    modifiedMeshes.current.set(mesh, mesh.material);

    if (materialClones.length === 0) {
      materialClones = Array.isArray(mesh.material)
        ? mesh.material.map((material) => material.clone())
        : [mesh.material.clone()];

      materialClones.forEach((materialClone) => {
        materialClone.onBeforeCompile = (shader) => {
          glowShaderRefs.current.push(shader);

          shader.uniforms.time = { value: 0.0 };
          shader.uniforms.progress = { value: 0.0 };
          shader.uniforms.height = {
            value: modelDimensions ? modelDimensions[1] : 0.0,
          };

          shader.vertexShader = shader.vertexShader.replace(
            "#include <common>",
            /* glsl */ `
            #include <common>
            varying vec3 vWorldPosition;`
          );

          shader.vertexShader = shader.vertexShader.replace(
            "#include <project_vertex>",
            /* glsl */ `
            #include <project_vertex>
            vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`
          );

          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <common>",
            /* glsl */ `
            #include <common>
            uniform float time;
            uniform float progress;
            uniform float height;
            varying vec3 vWorldPosition;

            vec3 pal(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
              return a + b * cos(6.28318 * (c * t + d));
            }`
          );

          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <opaque_fragment>",
            /* glsl */ `
            #include <opaque_fragment>
            float intensity = length(gl_FragColor.rgb);
            float heightProgress = (vWorldPosition.y - (-height * 0.5)) / height;

            // Rainbow highlighting
            // float rainbowTime = time * 1.0 - (1.0 - heightProgress);
            // vec3 rainbowColor = pal(rainbowTime, vec3(0.6, 0.6, 0.6), vec3(0.6, 0.6, 0.6), vec3(1.0, 1.0, 1.0), vec3(0.0, 3.66056678306, 3.34225662801));

            if (heightProgress < progress || progress >= 1.0) {
              gl_FragColor.rgb = gl_FragColor.rgb * 0.25 + vec3(1.0, 0.0, 0.0) * (intensity + 0.1);

              // Rainbow highlighting
              // gl_FragColor.rgb += rainbowColor;
            }`
          );
        };
      });
    }

    mesh.material =
      materialClones.length === 1 ? materialClones[0] : materialClones;
  });
}
