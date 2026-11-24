# Product Catalogue — Scaffold Plan

## Context

We are laying the foundation for a product catalogue app (browse, search, enquire). This task is **scaffold only — no features**. The goal is a pnpm monorepo whose structure, boundaries and tooling make the ports-and-adapters API and feature-sliced web app visible and enforced from day one, with `pnpm install`, `pnpm typecheck`, `pnpm lint` and `pnpm test` all green.

Decisions confirmed by the user:
- **React 19** (not 18). shadcn's Tailwind v4 components rely on ref-as-prop, so React 19 avoids patching them.
- All proposed **NEW** dependencies approved (incl. optional pino-pretty).
- **git init** the repo.

Current state: `/home/jenthomasjames/Development/assessment-officeworks` contains only `DECISIONS.md`, `AI_USAGE.md` (left untouched) and empty `apps/api`, `apps/web`. Active Node is 22.22.2 via nvm; pnpm not installed; not a git repo.

## Step 0 — Save this plan
Copy this plan to `PLAN.md` at the repo root (first action after plan approval).

## Step 1 — Toolchain
- `nvm install 26.13.1 && nvm use 26.13.1`
- `npm i -g pnpm@latest` (Node 25+ no longer bundles corepack); record version in root `packageManager`.
- `git init`; `.gitignore` covers `node_modules`, `dist`, `coverage`, `.env`, `.env.*` (except `.env.example`), `*.log`, `.DS_Store`.

## Step 2 — Root workspace
Files:
- `.nvmrc` → `26.13.1`
- `.npmrc` → `engine-strict=true`
- `pnpm-workspace.yaml` → `apps/*`, `packages/*`
- `package.json` → `"private": true`, `"type": "module"`, `"engines": { "node": "26.13.1" }`, `packageManager`, scripts:
  - `dev`: `pnpm -r --parallel dev`
  - `build`: `pnpm -r build`
  - `typecheck`: `pnpm -r typecheck`
  - `lint`: `eslint .`
  - `test`: `pnpm -r test`
  - `format` / `format:check`: prettier
- `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `isolatedModules`, `moduleResolution: "bundler"` (web/contracts) — API overrides to `nodenext`, `customConditions: ["source"]`, `skipLibCheck`, `target: ES2023`.
- `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.env.example` (`NODE_ENV`, `PORT=3000`, `LOG_LEVEL=info`, `CORS_ORIGIN=http://localhost:5173`).
- Root dev deps: `typescript`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-config-prettier`, `globals`, `prettier`.

## Step 3 — `packages/contracts` (`@catalogue/contracts`)
- deps: `zod`; dev: `typescript`, `vitest`
- `package.json` exports: `{ ".": { "source": "./src/index.ts", "types": "./dist/index.d.ts", "default": "./dist/index.js" } }`; scripts `build` (tsc → dist), `typecheck` (`tsc --noEmit`), `test` (`vitest run`).
- `src/error.schema.ts`: `errorResponseSchema` = `{ error: { code: string, message: string, fields?: Record<string, string[]> } }` + `type ErrorResponse = z.infer<…>`.
- `src/index.ts` re-exports; `src/error.schema.test.ts` (accepts valid envelope, rejects missing `code`).
- Only deviation from "empty": the error envelope, because the API error handler and web error parsing both need it.

## Step 4 — `apps/api` (`@catalogue/api`)
- deps: `express@5`, `zod`, `ioredis`, `express-rate-limit`, `rate-limit-redis`, `helmet`, `cors`, `nodemailer`, `pino`, `pino-http`, `@catalogue/contracts` (`workspace:*`)
- dev: `typescript`, `vitest`, `supertest`, `msw`, `pino-pretty`, `@types/express`, `@types/cors`, `@types/nodemailer`, `@types/node`, `@types/supertest`
- tsconfig: `module/moduleResolution: nodenext`, `allowImportingTsExtensions` + `rewriteRelativeImportExtensions` (imports use `.ts`), `tsconfig.build.json` emits to `dist/`, excludes tests.
- scripts: `dev`: `node --watch --conditions=source --env-file-if-exists=.env src/server.ts` (native type stripping, no tsx/dotenv); `build`: `tsc -p tsconfig.build.json`; `start`: `node dist/server.js`; `typecheck`; `test`.
- `vitest.config.ts`: `resolve.conditions` / `ssr.resolve.conditions` include `source`; environment `node`.

Files:
- `src/config/env.ts` — Zod schema (`NODE_ENV`, `PORT`, `LOG_LEVEL`, `CORS_ORIGIN`), `loadEnv(source)` throws with readable message on invalid env.
- `src/errors/app-error.ts` — `AppError` (code, status, message, fields?) + `NotFoundError`, `ValidationError`.
- `src/middleware/request-logger.ts` — pino-http with injected logger.
- `src/middleware/not-found.ts` — throws `NotFoundError`.
- `src/middleware/error-handler.ts` — `AppError` → its status/envelope; `ZodError` → 400 `VALIDATION_ERROR` with `fields`; else 500 `INTERNAL_ERROR` (logged). Body typed as `ErrorResponse`.
- `src/routes/health.routes.ts` — `GET /health` → `{ status: "ok" }`.
- `src/container.ts` — `createContainer(env)` returns `{ env, logger }` (adapters/services added later).
- `src/app.ts` — `buildApp(container)`: helmet, cors(origin from env), `express.json`, request logger, `/health`, `/api/v1` router (empty), not-found, error handler.
- `src/server.ts` — load env, create container, listen, SIGINT/SIGTERM graceful close.
- Empty layers with `.gitkeep`: `src/services/`, `src/ports/`, `src/adapters/`.
- `src/app.test.ts` (Supertest): `GET /health` → 200 `{status:"ok"}`; `GET /api/v1/nope` → 404 matching `errorResponseSchema`.

## Step 5 — `apps/web` (`@catalogue/web`)
- Scaffold manually (not `create vite`, to keep the tree exact).
- deps: `react@19`, `react-dom@19`, `react-router`, `@tanstack/react-query`, `axios`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@catalogue/contracts`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `radix-ui`, `tw-animate-css`
- dev: `vite`, `@vitejs/plugin-react`, `tailwindcss@4`, `@tailwindcss/vite`, `typescript`, `@types/react@19`, `@types/react-dom@19`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`
- `vite.config.ts`: react + tailwind plugins, alias `@` → `src`, `resolve.conditions` incl. `source`, dev proxy `/api` and `/health` → `http://localhost:3000`.
- `vitest.config.ts`: jsdom, `src/test/setup.ts` (jest-dom matchers, cleanup).
- `components.json` (shadcn, Tailwind v4, aliases `@/components`, `@/lib/utils`), then `pnpm dlx shadcn@latest add button card input form skeleton badge pagination`. If `form` is missing/deprecated in the registry at install time, report it rather than substituting silently.
- Post-generation: remove any comments shadcn emits (no-comments rule) and fix any lint violations in `components/ui/`.

Files:
- `index.html`, `src/main.tsx`
- `src/index.css` — `@import "tailwindcss"; @import "tw-animate-css";` + shadcn CSS variables (all colour/radius tokens live here).
- `src/config/brand.ts` — `brand = { name, tagline, logoAlt }` typed const.
- `src/app/providers.tsx` (QueryClientProvider), `src/app/router.tsx` (createBrowserRouter, root layout, placeholder index route), `src/app/layout/RootLayout.tsx` (header with brand name, `<Outlet/>`), `src/app/App.tsx`.
- `src/lib/http.ts` — single Axios instance, `baseURL: "/api/v1"`.
- `src/lib/utils.ts` — shadcn `cn()`.
- Empty with `.gitkeep`: `src/features/{home,category,search,product,enquiry}/`. `lib/api.ts` is created with the first feature.
- `src/app/App.test.tsx` — renders app, header shows `brand.name`.

## Step 6 — ESLint (`eslint.config.js`, flat config at root)
Shared (all TS): `@eslint/js` recommended, `typescript-eslint` `strictTypeChecked` with `projectService`, `eslint-config-prettier`, plus:
- `@typescript-eslint/no-explicit-any: error`
- `no-restricted-syntax`: `TSUnknownKeyword` → "Do not use unknown; narrow with instanceof or z.infer."
Web: `eslint-plugin-react-hooks` recommended, browser globals; `no-restricted-globals: fetch`.

Boundary blocks (`no-restricted-imports` with `patterns`):
| Files | Banned imports |
|---|---|
| `apps/api/src/routes/**` | `**/adapters/**` |
| `apps/api/src/services/**`, `ports/**` | `express`, `ioredis`, `nodemailer`, `axios`, `node:http(s)`, `rate-limit-redis`, `pino-http`, `**/adapters/**`, `**/routes/**`, `**/middleware/**` |
| `apps/web/src/**` | `@catalogue/api`, `**/apps/api/**`, `axios` (except `lib/http.ts`), `**/lib/http` (except `lib/api.ts`) |
| `apps/web/src/components/**`, `features/*/components/**` | `**/lib/http`, `**/lib/api`, `axios`, `@tanstack/react-query` |
| `packages/contracts/**` | `@catalogue/web`, `@catalogue/api`, `**/apps/**` |
Ignores: `dist`, `coverage`, `node_modules`.

## Step 7 — `CLAUDE.md`
Sections: project overview; stack + Node pin; workspace layout; API layers (routes / middleware / services / ports / adapters / config / container / app vs server) with one-line responsibility each; web layers (app / features / pages / hooks / lib / components / config+CSS vars); contracts as sole shared package; boundary table (mirrors ESLint); API conventions (`/api/v1`, `/health`, error envelope, `.env.example`); coding rules (strict + noUncheckedIndexedAccess, no any/unknown, instanceof narrowing, z.infer for external data, no comments, small modules, tests for every business rule, ask before new deps); product rules reference (cache 10 min fresh / 24 h stale / Redis-down fallback, category slug mapping only in Fake Store adapter); commands.

## Step 8 — Install, verify, commit
1. `pnpm install`
2. `pnpm typecheck`, `pnpm lint`, `pnpm test` — all must pass; fix until green.
3. `pnpm format` once.
4. Initial commit on `main` (with Co-Authored-By trailer) — only if the user confirms at that point.

## Verification
- `pnpm typecheck && pnpm lint && pnpm test` green (3 test files: contracts schema, API app, web App).
- Boundary check: temporarily add `import "axios"` in `apps/web/src/components/` and `import express from "express"` in `apps/api/src/services/`, confirm `pnpm lint` fails, then remove.
- `pnpm --filter @catalogue/api dev` → `curl localhost:3000/health` returns `{"status":"ok"}`; `curl localhost:3000/api/v1/x` returns the 404 error envelope.
- `pnpm --filter @catalogue/web dev` → page loads with header and a shadcn Button rendering with Tailwind styles.

## Final summary to user
List created files/packages with resolved versions, and assumptions: error envelope in contracts, `errors/` folder in API, native Node TS in dev (no tsx), `source` export condition, env vars limited to scaffold needs, no-comments rule enforced by convention only, Docker deferred, React 19 chosen (suggest recording in DECISIONS.md).
