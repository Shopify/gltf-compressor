import shopifyPlugin from "@shopify/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import _import from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";

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
  reactPlugin.configs.flat.recommended,
  ...shopifyPlugin.configs.esnext,
  ...shopifyPlugin.configs.react,
  ...shopifyPlugin.configs.typescript,
  ...shopifyPlugin.configs.prettier,
  {
    plugins: {
      import: _import,
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
      "@typescript-eslint/ban-ts-comment": "off",
      "id-length": "off",
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
      "prettier/prettier": [
        "error",
        {
          trailingComma: "es5",
          singleQuote: false,
          printWidth: 80,
          semi: true,
        },
      ],
    },
  },
];

export default eslintConfig;
