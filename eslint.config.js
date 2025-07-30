import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import _import from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import typescript from "typescript-eslint";

const eslintConfig = [
  {
    ignores: [
      "**/vendor",
      "**/tmp",
      "**/public",
      "config/**/*.json",
      "node_modules/**",
      "dist/**",
      ".claude/**",
      "**/*.wasm",
      "**/draco/**",
    ],
  },
  js.configs.recommended,
  reactPlugin.configs.flat.recommended,
  ...typescript.configs.recommended,
  prettier,
  {
    plugins: {
      import: _import,
      "react-hooks": reactHooks,
    },

    languageOptions: {
      globals: {
        ...globals.node,
        React: true,
        google: true,
        JSX: true,
      },

      parser: tsParser,
    },

    settings: {
      react: {
        version: "detect",
      },

      "import/resolver": {
        typescript: {
          project: "tsconfig.json",
        },
      },

      "import/external-module-folders": ["node_modules", "packages"],
    },

    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/ban-ts-comment": "off",
      "react/no-unknown-property": [
        "error",
        {
          ignore: [
            "object",
            "attach",
            "args",
            "intensity",
            "instanceCount",
            "dithering",
            "roughness",
            "metalness",
            "envMapIntensity",
            "transparent",
            "side",
            "toneMapped",
            "onBeforeCompile",
            "renderOrder",
            "rotation",
            "geometry",
            "quaternion",
            "envMap",
            "position",
            "map",
            "visible",
            "dispose",
            "material",
            "wireframe",
            "skeleton",
            "layers",
            "envMapRotation",
            "transmission",
            "ior",
            "thickness",
            "clearcoat",
            "clearcoatRoughness",
            "clearcoatNormalMap",
            "clearcoatNormalScale",
            "normalMap",
            "normalScale",
            "dispersion",
            "aoMap",
            "aoMapIntensity",
            "alphaMap",
            "onBeforeRender",
            "onAfterRender",
            "position-x",
            "clippingPlanes",
            "penumbra",
            "frustumCulled",
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
