# CLAUDE.md

Product catalogue web app. Customers browse and search products and send an enquiry about a product to the sales team. This is the foundation of a real product, not a prototype. **The product data source, the look and feel, and the email provider will all change**, so each must stay swappable without touching the rest of the code.

Read `DECISIONS.md` for product decisions and `PLAN.md` for the scaffold plan.

## Commands

Run everything from the repo root with Node 26.13.1 (`nvm use`) and pnpm.

First-time setup: `cp .env.example .env`. The API reads the root `.env` in dev and exits at startup if a required variable is missing.

| Command          | Purpose                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `pnpm install`   | Install all workspaces                                                |
| `pnpm dev`       | Run api (port 3000) and web (port 5173, proxies `/api` and `/health`) |
| `pnpm typecheck` | `tsc --noEmit` in every workspace                                     |
| `pnpm lint`      | ESLint over the whole repo, including the boundary rules              |
| `pnpm test`      | Vitest in every workspace                                             |
| `pnpm build`     | Build contracts, api and web                                          |
| `pnpm format`    | Prettier                                                              |

All four of `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` must pass before work is considered done.

## Stack

- Node.js **26.13.1**, pinned in `.nvmrc`, root `package.json` `engines` (enforced by `engineStrict` in `pnpm-workspace.yaml`), and `node:26.13.1-alpine` in Dockerfiles.
- pnpm workspaces: `apps/web`, `apps/api`, `packages/contracts`. Versions are saved exactly (`saveExact`).
- TypeScript **6.0.x**. Do not upgrade to 7 until typescript-eslint supports it.
- **contracts**: Zod 4.
- **api**: Express 5, Zod, ioredis, express-rate-limit + rate-limit-redis, helmet, cors, Nodemailer, pino + pino-http. Runs on Node's native TypeScript support in dev (no tsx, no dotenv; `--env-file-if-exists=../../.env` loads the root `.env`). Built with `tsc` for production.
- **web**: React 19, Vite, Tailwind CSS v4, shadcn/ui (new-york style, Radix), React Router 8, TanStack Query, one Axios instance, React Hook Form + `@hookform/resolvers`, Zod.
- **Tests**: Vitest everywhere, Supertest (api), Testing Library + jsdom (web), MSW for faking HTTP. Playwright later.
- **Later**: Docker Compose with web (nginx), api, redis, mailpit.

**Ask before adding any dependency** that is not already in a `package.json`. The shadcn CLI may try to install packages: review the diff of `package.json` after every `shadcn add`. It once installed an unrelated npm package called `cn` because it could not resolve `@/lib/utils`.

## Workspace layout

```
packages/contracts/src/      Zod schemas + z.infer types: the single API contract
apps/api/src/
  server.ts                  Starts/stops the HTTP server only (env → container → app → listen, graceful shutdown)
  app.ts                     buildApp(container): builds the Express app, mounts middleware and routes
  container.ts               Composition root: the ONLY place that creates adapters and injects them into services, chosen by env
  config/                    Env loading and validation with Zod; fail fast at startup
  errors/                    AppError and its subclasses, thrown by services and mapped by the error handler
  routes/                    HTTP only
  middleware/                Cross-cutting concerns only
  services/                  All business rules
  ports/                     Interfaces services depend on: ProductSource, FeaturedSelector, Mailer, Cache
  adapters/                  The only code that talks to the outside world
apps/web/src/
  main.tsx                   Mounts <App/>
  index.css                  Tailwind import + shadcn CSS variables (all theme tokens)
  app/                       Router, routes, providers and layout only
  features/<name>/           home, category, search, product, enquiry: page, hooks/, components/
  components/                Shared presentational components; components/ui/ holds shadcn
  lib/http.ts                The single Axios instance
  lib/api.ts                 Typed API functions; validates every response with contracts
  lib/utils.ts               cn()
  config/brand.ts            Brand name, copy and other brand values
```

## API layers (ports and adapters)

Each layer has one job and depends only on the layer below it or on interfaces. **Business rules never live in HTTP handlers, React components or adapters.**

- **routes/**: Parse and validate the request with contract schemas, call **one** service method, map the result or error to a response. No business logic.
- **middleware/**: Validation, error handling, rate limiting, honeypot, request logging. Nothing feature-specific.
- **services/**: All business rules (featured selection, top-rated ranking, search, pagination, enquiry handling). Pure TypeScript with no Express, Redis, HTTP client or SMTP imports. Services receive ports through their constructor or factory arguments.
- **ports/**: Interfaces only (`ProductSource`, `FeaturedSelector`, `Mailer`, `Cache`). Expressed in our own types.
- **adapters/**: Fake Store, featured.json, Redis, SMTP. Each maps external data to our own types **at the edge**, validating it with Zod. Only the Fake Store adapter knows Fake Store's response shape and category slugs (e.g. `men's clothing` → `mens-clothing`, upstream `jewelery` → `jewellery`).
- **container.ts**: Composition root. Picks adapters from env, builds services, exposes them to `buildApp`.
- **app.ts / server.ts**: `app.ts` builds the app and is what tests use with Supertest. `server.ts` only starts and stops it.

### API conventions

- Feature endpoints live under `/api/v1`, plus `GET /health`.
- Every error response uses one shape, `errorResponseSchema` in contracts: `{ error: { code, message, fields? } }`. Throw `AppError` subclasses from services and let `middleware/error-handler.ts` map them. A `ZodError` becomes 400 `VALIDATION_ERROR` with `fields`. Unknown errors become 500 `INTERNAL_ERROR` and never leak details.
- Config comes only from `config/env.ts`. When you add a variable, add it to the Zod schema **and** `.env.example`. Never commit `.env` or secrets.
- Relative imports in api and contracts use explicit `.ts` extensions (Node native TS; `tsc` rewrites them to `.js`).

### Product rules to preserve (from the spec)

- The backend fetches the full Fake Store product list once and caches it in Redis. Search, rating order and pagination happen in memory. Do not use Fake Store's `limit`/`sort`. The `ProductSource` query interface still carries `search`, `sort`, `page`, `pageSize` so a future source can handle them upstream.
- Cache: fresh for 10 minutes, then refetch. If the refetch fails, serve the last good copy for up to 24 hours. If Redis is down, call Fake Store directly.
- Home: 5 featured products by ID from `featured.json`. If it's empty, use the 5 highest-rated.
- Category: top 3 by rating, then the rest paginated. No product appears twice.
- Search: case-insensitive partial match on title or description. No semantic search.
- Enquiry: name, email, optional phone, optional message, product ID attached. Email to the sales inbox over SMTP (Mailpit locally, SES later). No customer confirmation and no storage. Honeypot field + rate limiting (Redis store), no CAPTCHA.
- The frontend never calls Fake Store; all product data goes through our API.

## Web layers

- **app/**: Router, route table, providers (QueryClient) and layout. No feature logic.
- **features/<name>/**: One folder per feature: `<Name>Page.tsx`, `hooks/` (TanStack Query), `components/` (feature-specific UI).
- **Pages** compose components and hooks. They hold no data-fetching or formatting logic.
- **Hooks** own server state and call `lib/api.ts`. They are the only callers of `lib/api.ts`.
- **lib/http.ts** holds the single Axios instance. **lib/api.ts** holds the typed API functions and parses responses with contract schemas.
- **components/**: Shared presentational components (ProductTile, ProductGrid, Pagination, PriceTag, loading/error/empty states). They receive props and render. No fetching and no TanStack Query.
- **Branding** lives only in `config/brand.ts` and the CSS variables in `index.css`, so a redesign never touches feature code. Use theme tokens (`bg-primary`, `text-muted-foreground`), never raw colours, in feature code.
- Web imports are extensionless and use the `@/` alias for `src/`.

## Contracts

`packages/contracts` is the only code shared between web and api. It exports Zod schemas and their `z.infer` types. Dev, test and typecheck read its `src` through the `source` export condition, and production uses `dist`. Contracts never imports an app.

## Enforced boundaries (ESLint `no-restricted-imports`, see `eslint.config.js`)

| Files                                                       | May not import                                                                                                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/src/routes/**`                                         | `adapters/**`                                                                                                                                                   |
| `api/src/services/**`, `api/src/ports/**`                   | express, express-rate-limit, rate-limit-redis, ioredis, nodemailer, axios, helmet, cors, pino-http, `node:http(s)`, `adapters/**`, `routes/**`, `middleware/**` |
| `web/src/**`                                                | `@catalogue/api` or any api source; axios (except `lib/http.ts`); `lib/http` (except `lib/api.ts`); `lib/api` (except `features/*/hooks/**`); global `fetch`    |
| `web/src/components/**`, `web/src/features/*/components/**` | all of the above + `@tanstack/react-query`                                                                                                                      |
| `packages/contracts/**`                                     | `@catalogue/web`, `@catalogue/api`, `apps/**`                                                                                                                   |

Do not weaken or bypass these rules to make code compile. Fix the design instead.

## Coding rules

- TypeScript strict + `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly` (no enums, no namespaces, no constructor parameter properties).
- **Never write `any` or `unknown`.** ESLint bans both. Narrow caught errors with `instanceof`. Type external data (HTTP responses, Redis values, JSON files, env) by parsing it with a Zod schema and using `z.infer`.
- **No comments in code.** Use clear names instead. ESLint can't enforce this, so it's on you, including in generated shadcn files.
- Small, single-purpose modules. Prefer functions and factories that take their dependencies as arguments.
- **Every feature ships with tests for its business rules**: service unit tests with fake ports, route tests with Supertest against `buildApp`, adapter tests with MSW, and hook/component tests with Testing Library + MSW.
- Tests sit next to the code as `*.test.ts(x)`.
- Ask before adding a dependency.
