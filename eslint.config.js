import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const importsOfApiApp = {
  paths: [{ name: "@catalogue/api", message: "The web app must never import from the API app." }],
  patterns: [
    {
      regex: "(^|/)(apps/)?api/src(/|$)|(^|/)apps/api(/|$)",
      message: "The web app must never import from the API app.",
    },
  ],
};

const axiosImport = {
  paths: [{ name: "axios", message: "Only src/lib/http.ts may import axios." }],
  patterns: [],
};

const httpClientImport = {
  paths: [],
  patterns: [
    { regex: "(^|/)lib/http(\\.ts)?$", message: "Only src/lib/api.ts may use the HTTP client." },
  ],
};

const apiFunctionsImport = {
  paths: [],
  patterns: [
    {
      regex: "(^|/)lib/api(\\.ts)?$",
      message: "Only feature hooks (features/<name>/hooks) may call lib/api.ts.",
    },
  ],
};

const serverStateImport = {
  paths: [
    {
      name: "@tanstack/react-query",
      message: "Components receive data through props; server state lives in feature hooks.",
    },
  ],
  patterns: [],
};

const infrastructureLibraries = [
  "express",
  "express-rate-limit",
  "rate-limit-redis",
  "ioredis",
  "nodemailer",
  "axios",
  "helmet",
  "cors",
  "pino-http",
  "http",
  "https",
  "node:http",
  "node:https",
];

const servicesAndPortsForbidden = {
  paths: infrastructureLibraries.map((name) => ({
    name,
    message: "Services and ports are pure TypeScript; depend on a port instead.",
  })),
  patterns: [
    {
      regex: "(^|/)(adapters|routes|middleware)(/|$)",
      message: "Services and ports must not depend on adapters, routes or middleware.",
    },
  ],
};

const routesForbidden = {
  paths: [],
  patterns: [
    {
      regex: "(^|/)adapters(/|$)",
      message: "Routes call services; only container.ts wires adapters.",
    },
  ],
};

const contractsForbidden = {
  paths: [
    { name: "@catalogue/web", message: "Contracts must not depend on an app." },
    { name: "@catalogue/api", message: "Contracts must not depend on an app." },
  ],
  patterns: [{ regex: "(^|/)apps/", message: "Contracts must not depend on an app." }],
};

function restrictImports(...restrictions) {
  return [
    "error",
    {
      paths: restrictions.flatMap((restriction) => restriction.paths),
      patterns: restrictions.flatMap((restriction) => restriction.patterns),
    },
  ];
}

export default defineConfig([
  globalIgnores(["**/dist/**", "**/coverage/**", "**/node_modules/**"]),

  {
    files: ["**/*.js"],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },

  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSUnknownKeyword",
          message: "Do not use unknown. Narrow with instanceof or type external data with z.infer.",
        },
      ],
    },
  },

  {
    files: ["apps/api/src/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["apps/api/src/routes/**/*.ts"],
    rules: { "no-restricted-imports": restrictImports(routesForbidden) },
  },
  {
    files: ["apps/api/src/services/**/*.ts", "apps/api/src/ports/**/*.ts"],
    rules: { "no-restricted-imports": restrictImports(servicesAndPortsForbidden) },
  },

  {
    files: ["apps/web/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat["recommended-latest"]],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Use the typed functions in src/lib/api.ts via a feature hook." },
      ],
      "no-restricted-imports": restrictImports(
        importsOfApiApp,
        axiosImport,
        httpClientImport,
        apiFunctionsImport,
      ),
    },
  },
  {
    files: ["apps/web/src/lib/http.ts"],
    rules: { "no-restricted-imports": restrictImports(importsOfApiApp, apiFunctionsImport) },
  },
  {
    files: ["apps/web/src/lib/api.ts"],
    rules: { "no-restricted-imports": restrictImports(importsOfApiApp, axiosImport) },
  },
  {
    files: ["apps/web/src/features/*/hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictImports(importsOfApiApp, axiosImport, httpClientImport),
    },
  },
  {
    files: [
      "apps/web/src/components/**/*.{ts,tsx}",
      "apps/web/src/features/*/components/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": restrictImports(
        importsOfApiApp,
        axiosImport,
        httpClientImport,
        apiFunctionsImport,
        serverStateImport,
      ),
    },
  },

  {
    files: ["packages/contracts/**/*.ts"],
    rules: { "no-restricted-imports": restrictImports(contractsForbidden) },
  },

  prettier,
]);
