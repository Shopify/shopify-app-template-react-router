const js = require("@eslint/js");
const { fixupPluginRules } = require("@eslint/compat");
const react = require("eslint-plugin-react");
const jsxA11y = require("eslint-plugin-jsx-a11y");
const reactHooks = require("eslint-plugin-react-hooks");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");
const importPlugin = require("eslint-plugin-import");

const ignoredFiles = [
  "node_modules/",
  ".cache/",
  "build/",
  "app/build/",
  "public/build/",
  "public/_dev/",
  "app/public/build/",
  "prisma/dev.sqlite",
  "prisma/dev.sqlite-journal",
  "database.sqlite",
  "extensions/*/dist/",
  ".shopify/",
  ".shopify.lock",
  ".react-router/",
  "*/*.yml",
];

const browserGlobals = {
  AbortController: "readonly",
  Blob: "readonly",
  console: "readonly",
  document: "readonly",
  fetch: "readonly",
  FormData: "readonly",
  Headers: "readonly",
  HTMLFormElement: "readonly",
  location: "readonly",
  navigator: "readonly",
  Request: "readonly",
  Response: "readonly",
  setTimeout: "readonly",
  shopify: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  window: "readonly",
};

const nodeGlobals = {
  __dirname: "readonly",
  __filename: "readonly",
  Buffer: "readonly",
  console: "readonly",
  exports: "writable",
  global: "readonly",
  module: "writable",
  process: "readonly",
  require: "readonly",
};

module.exports = [
  {
    ignores: ignoredFiles,
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react: fixupPluginRules(react),
      "jsx-a11y": fixupPluginRules(jsxA11y),
      "react-hooks": fixupPluginRules(reactHooks),
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: browserGlobals,
    },
    settings: {
      react: {
        version: "detect",
      },
      formComponents: ["Form"],
      linkComponents: [
        { name: "Link", linkAttribute: "to" },
        { name: "NavLink", linkAttribute: "to" },
      ],
      "import/resolver": {
        typescript: {},
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react/no-unknown-property": ["error", { ignore: ["variant"] }],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
      import: fixupPluginRules(importPlugin),
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: "module",
      },
    },
    settings: {
      "import/internal-regex": "^~/",
      "import/resolver": {
        node: {
          extensions: [".ts", ".tsx"],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
    },
  },
  {
    files: [
      "eslint.config.cjs",
      "vite.config.{js,ts}",
      ".graphqlrc.{js,ts}",
      "shopify.server.{js,ts}",
      "**/*.server.{js,ts}",
    ],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
];
