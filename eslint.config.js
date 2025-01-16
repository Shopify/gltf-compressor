import shopifyPlugin from "@shopify/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import _import from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";

const eslintConfig = [
  {
    ignores: ["**/vendor", "**/tmp", "**/public", "config/**/*.json"],
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
      "import/no-named-default": "warn",
      "babel/camelcase": "off",
      "template-curly-spacing": "off",
      "no-shadow": "off",
      "jsx-a11y/label-has-for": "off",
      "jsx-a11y/control-has-associated-label": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@shopify/typescript-prefer-pascal-case-enums": "off",
      "@shopify/typescript-prefer-singular-enums": "off",
      "@shopify/prefer-module-scope-constants": "off",
      "@shopify/strict-component-boundaries": "off",
      "@shopify/typescript/prefer-pascal-case-enums": "off",
      "@shopify/typescript/prefer-singular-enums": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-indexed-object-style": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/member-ordering": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "no-unused-vars": "off",
      "consistent-return": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

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
          ],
        },
      ],

      "@shopify/jsx-no-hardcoded-content": "off",
      "id-length": "off",
      "comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "ignore",
        },
      ],
    },
  },
];

export default eslintConfig;
