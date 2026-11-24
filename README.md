# Product Catalogue

A product catalogue where customers browse categories, search products, view product details and send an enquiry to the sales team by email. Product data comes from the [Fake Store API](https://fakestoreapi.com) through our own backend.

It is built as the foundation of a real product rather than a throwaway prototype. The product data source, the look and feel and the email provider are each behind a single seam, so they can be replaced without touching the rest of the code (see [Designed to change](#designed-to-change)).

## Contents

- [Technology choice](#technology-choice)
- [Run it locally](#run-it-locally)
- [Try the acceptance criteria](#try-the-acceptance-criteria)
- [Configuration](#configuration)
- [Commands](#commands)
- [Architecture](#architecture)
- [Designed to change](#designed-to-change)
- [API](#api)
- [Testing](#testing)
- [Known gaps](#known-gaps)
- [Time spent](#time-spent)
- [Further reading](#further-reading)

## Technology choice

| Layer   | Choice                                      |
| ------- | ------------------------------------------- |
| Client  | React 19 web app in TypeScript (Vite)       |
| Backend | Node.js with TypeScript (Express 5)         |
| Shared  | `packages/contracts`: Zod schemas and types |

**Why:**

- **One language end to end.** The web app and the API share one package of Zod schemas (`packages/contracts`). The API validates requests with them and the web app validates responses with them, so a contract change becomes a compile error on both sides instead of a runtime surprise.
- **A web client is the shortest path to something the entrepreneur can click through.** It needs no simulator or app store, and it deploys to AWS as static files (S3 + CloudFront) or a container.
- **Express over Fastify** keeps the stack familiar and simple. The architecture, not the framework, is what makes it extensible.

The full stack and the reasoning behind it are in [DECISIONS.md](DECISIONS.md).

## Run it locally

Everything is free and needs no accounts.

### Option 1: Docker Compose (recommended)

Needs only [Docker](https://docs.docker.com/get-docker/) with Compose v2.

```sh
docker compose up --build
```

The first build takes a few minutes. When it finishes:

| What          | URL                          |
| ------------- | ---------------------------- |
| Web app       | http://localhost:8080        |
| Health check  | http://localhost:8080/health |
| Mailpit inbox | http://localhost:8025        |

This starts four containers:

| Service   | What it runs                                                                   |
| --------- | ------------------------------------------------------------------------------ |
| `web`     | nginx serving the built React app and proxying `/api` and `/health` to the API |
| `api`     | The compiled Express API (`node dist/server.js`), running as a non-root user   |
| `redis`   | Product cache and enquiry rate limit store                                     |
| `mailpit` | Local SMTP server and inbox for enquiry emails                                 |

Compose needs no `.env`: its configuration is set in [`docker-compose.yml`](docker-compose.yml). `apps/api/data` is mounted into the API container, so editing `featured.json` takes effect on the next page load without a rebuild.

Stop with `Ctrl+C`, or `docker compose down` to remove the containers. Ports 8080, 8025 and 1025 must be free on your machine.

### Option 2: Local development

For working on the code, with hot reload.

| Tool    | Version   | Install                                                                    |
| ------- | --------- | -------------------------------------------------------------------------- |
| Node.js | `26.13.1` | `nvm install` (reads `.nvmrc`). The version is enforced, others will fail. |
| pnpm    | `12.23.0` | `npm install -g pnpm@12.23.0`                                              |
| Mailpit | any       | Local SMTP inbox for enquiry emails. See step 3.                           |
| Redis   | optional  | Without it the API uses an in-memory cache and rate limiter.               |

1. **Install dependencies**

   ```sh
   nvm install && nvm use
   pnpm install
   ```

2. **Create your environment file.** The defaults work as they are.

   ```sh
   cp .env.example .env
   ```

3. **Start Mailpit** so enquiry emails have somewhere to go. Either run only that container:

   ```sh
   docker compose up mailpit
   ```

   or download the binary from the [Mailpit releases](https://github.com/axllent/mailpit/releases) and run `mailpit`. Both listen on port 1025, as `.env.example` expects.

4. **Start the API and web app**

   ```sh
   pnpm dev
   ```

| What          | URL                          |
| ------------- | ---------------------------- |
| Web app       | http://localhost:5173        |
| API           | http://localhost:3000        |
| Health check  | http://localhost:3000/health |
| Mailpit inbox | http://localhost:8025        |

In development the web app proxies `/api` and `/health` to the API, so there is no CORS setup to do.

If the API exits at startup with `Invalid environment configuration`, a required variable is missing from `.env`. Compare it with `.env.example`.

## Try the acceptance criteria

| Criterion     | How to try it                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home page     | Open the home page (http://localhost:8080 with Docker, http://localhost:5173 in local development) to see 5 featured products. They are the IDs listed in [`apps/api/data/featured.json`](apps/api/data/featured.json), seeded with `["1", "5", "9", "13", "17"]`. To choose others, edit the file and reload. No restart needed. When the file is empty (`[]`), the 5 highest-rated products are shown. |
| Category page | Click a category. The top 3 products by rating appear first, followed by the rest of the category, paginated. No product appears twice.                                                                                                                                                                                                                                                                  |
| Search        | Type a term in the header search bar and click **Search**. Results match the title or description, case-insensitive, partial match.                                                                                                                                                                                                                                                                      |
| Product page  | Click any product tile.                                                                                                                                                                                                                                                                                                                                                                                  |
| Enquiry       | On a product page click **Enquire about this product**, fill in the form and submit. You see a "Thank you" message, and the email appears in Mailpit at http://localhost:8025.                                                                                                                                                                                                                           |

## Configuration

All configuration is environment variables, validated with Zod at startup in [`apps/api/src/config/env.ts`](apps/api/src/config/env.ts). The API exits with a readable message if anything is missing or invalid. `.env` is gitignored and no secrets are committed.

| Variable                       | Default                    | Purpose                                                                                          |
| ------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                     | `development`              | `development`, `test` or `production`                                                            |
| `PORT`                         | `3000`                     | API port                                                                                         |
| `LOG_LEVEL`                    | `info`                     | pino log level                                                                                   |
| `CORS_ORIGIN`                  | **required**               | Origin allowed to call the API (the web app)                                                     |
| `TRUST_PROXY_HOPS`             | `0`                        | Reverse proxies in front of the API. `1` behind nginx, so rate limiting sees the real client IP. |
| `REDIS_URL`                    | _empty_                    | Redis for the product cache and rate limiter. Empty means in-memory.                             |
| `FAKE_STORE_BASE_URL`          | `https://fakestoreapi.com` | Product data source                                                                              |
| `FAKE_STORE_TIMEOUT_MS`        | `5000`                     | Upstream request timeout                                                                         |
| `FEATURED_PRODUCTS_PATH`       | `data/featured.json`       | Admin-edited list of featured product IDs                                                        |
| `SMTP_HOST`                    | **required**               | SMTP server (`localhost` for Mailpit)                                                            |
| `SMTP_PORT`                    | `587`                      | `1025` for Mailpit                                                                               |
| `SMTP_SECURE`                  | `false`                    | Use TLS from the start of the connection                                                         |
| `SMTP_USER` / `SMTP_PASSWORD`  | _empty_                    | SMTP credentials. Set both or neither.                                                           |
| `SMTP_TIMEOUT_MS`              | `10000`                    | SMTP connection and socket timeout                                                               |
| `MAIL_FROM`                    | **required**               | Sender of enquiry emails, e.g. `Catalogue <no-reply@catalogue.local>`                            |
| `SALES_INBOX`                  | **required**               | Address that receives enquiries                                                                  |
| `ENQUIRY_RATE_LIMIT_MAX`       | `5`                        | Enquiries allowed per IP per window                                                              |
| `ENQUIRY_RATE_LIMIT_WINDOW_MS` | `900000`                   | Rate limit window (15 minutes)                                                                   |

The mail settings have no production defaults on purpose, so a deployment cannot silently send enquiries to a placeholder address.

## Commands

Run from the repository root.

| Command          | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| `pnpm dev`       | Run the API (port 3000) and web app (port 5173) with reload |
| `pnpm test`      | Vitest in every workspace                                   |
| `pnpm typecheck` | `tsc --noEmit` in every workspace                           |
| `pnpm lint`      | ESLint, including the architecture boundary rules           |
| `pnpm build`     | Build contracts, API and web app                            |
| `pnpm format`    | Prettier                                                    |

## Architecture

```
apps/web            React client. Never calls Fake Store; all data goes through the API.
apps/api            Express API, ports and adapters.
packages/contracts  Zod schemas + inferred types: the single contract between them.
```

### API: ports and adapters

```
routes/       HTTP only: validate with contracts, call one service method, map the result
middleware/   Cross-cutting: error handling, rate limiting, honeypot, request logging
services/     All business rules. Pure TypeScript, no Express/Redis/HTTP/SMTP imports
ports/        Interfaces the services depend on: ProductSource, ProductFeed,
              FeaturedSelector, Cache, Mailer
adapters/     The only code that talks to the outside world: Fake Store, featured.json,
              Redis, SMTP. Each validates external data with Zod at the edge
container.ts  Composition root: the only place adapters are created and chosen by env
```

**Catalogue data flow:** `FakeStoreProductFeed` → `CachedProductFeed` → `InMemoryProductSource` → `CatalogueService` → routes.

- The full product list is fetched once and cached (Redis, or in memory without `REDIS_URL`).
- Data is fresh for 10 minutes. After that it is refetched, and if the refetch fails the last good copy is served for up to 24 hours. Concurrent refetches are collapsed into one.
- If Redis is down, the API calls Fake Store directly. If Fake Store is down too, the API returns 503 `UPSTREAM_UNAVAILABLE`.
- Search, rating order and pagination happen in memory over the cached list.

**Enquiry flow:** `POST /api/v1/enquiries` → rate limiter → honeypot → validation → `EnquiryService` → `Mailer` port → SMTP adapter.

- The customer's address is set as Reply-To, so the sales team can reply directly. Customer input never goes into the subject line.
- A bot that fills in the hidden honeypot field gets a normal-looking success response, but no email is sent.
- If the mail server is down, the customer sees an error and can retry. What they typed is kept.

### Web: feature slices

```
app/                 Router, providers, layout
features/<name>/     home, category, search, product, enquiry: page, hooks/, components/
components/          Shared presentational components (props in, markup out)
lib/http.ts          The single Axios instance
lib/api.ts           Typed API functions; every response is validated with contracts
config/brand.ts      Brand name, locale and UI copy
src/index.css        Theme tokens (CSS variables)
```

Server state lives in TanStack Query hooks, and only hooks call `lib/api.ts`. Components never fetch.

### Boundaries are enforced, not just documented

ESLint `no-restricted-imports` rules in [`eslint.config.js`](eslint.config.js) fail `pnpm lint` if, for example:

- a route imports an adapter
- a service imports Express, Redis, Nodemailer or an HTTP client
- a web component imports Axios, `lib/api` or TanStack Query
- the web app imports API code

## Designed to change

The brief says the product data source, the look and feel and the email provider will all change. Each one is a single seam:

| Change                       | What you touch                                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product data source**      | Write a new adapter that implements `ProductFeed` (full list) or `ProductSource` (if it can search and paginate upstream), then swap it in `container.ts`. Services, routes and the web app stay as they are. |
| **Look and feel**            | Theme tokens in `apps/web/src/index.css` and copy in `apps/web/src/config/brand.ts`. Feature code uses tokens (`bg-primary`), never raw colours.                                                              |
| **Email provider (SES)**     | Write a `Mailer` adapter and swap it in `container.ts`. SES also accepts SMTP, so moving to it can be configuration only.                                                                                     |
| **Cache / rate limit store** | Already chosen by env: Redis when `REDIS_URL` is set, in-memory otherwise.                                                                                                                                    |

## API

All feature endpoints live under `/api/v1`. Response shapes are defined in `packages/contracts`.

| Method and path                              | Response                       |
| -------------------------------------------- | ------------------------------ |
| `GET /health`                                | `{ "status": "ok" }`           |
| `GET /api/v1/featured-products`              | `Product[]` (5)                |
| `GET /api/v1/categories`                     | `Category[]`                   |
| `GET /api/v1/categories/:slug?page&pageSize` | `CategoryPage`                 |
| `GET /api/v1/products?term&page&pageSize`    | `SearchResult`                 |
| `GET /api/v1/products/:id`                   | `Product`                      |
| `POST /api/v1/enquiries`                     | `202 { "status": "received" }` |

Every error has the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "fields": { "email": ["Enter a valid email address"] }
  }
}
```

| Status | Code                   | When                                                     |
| ------ | ---------------------- | -------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`     | Invalid input, with per-field messages                   |
| 404    | `NOT_FOUND`            | Unknown product, category or route                       |
| 429    | `RATE_LIMITED`         | Too many enquiries from one IP                           |
| 503    | `UPSTREAM_UNAVAILABLE` | Fake Store unreachable and no cached copy                |
| 503    | `EMAIL_UNAVAILABLE`    | Mail server unreachable                                  |
| 500    | `INTERNAL_ERROR`       | Anything unexpected. Details are logged, never returned. |

Security basics: helmet headers, CORS limited to `CORS_ORIGIN`, a 16 KB JSON body limit, Zod validation on every input, a honeypot and rate limiting on the enquiry endpoint.

## Testing

```sh
pnpm test
```

Tests sit next to the code as `*.test.ts(x)` and cover each layer:

| Layer     | How it is tested                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contracts | Schema tests for every contract                                                                                                                                               |
| Services  | Unit tests with fake ports: featured selection and fallback, top-rated ranking, no duplicates, search, pagination, cache freshness and stale fallback, enquiry email contents |
| Routes    | Supertest against the real app with a test container: status codes, error shape, honeypot, rate limit                                                                         |
| Adapters  | MSW for Fake Store (mapping, timeouts, bad data); a local transport for SMTP; unreachable-server tests for Redis and SMTP                                                     |
| Web       | Testing Library + MSW, rendering real routes: what each page shows, its not-found and error handling, and the full enquiry form flow                                          |

## Known gaps

These were left out to stay within the time box. They are listed in priority order.

- **No end-to-end browser tests.** Playwright is planned. The critical path is currently covered by route-level web tests with a faked API.
- **No deployment pipeline.** The images are AWS-ready (for example ECS Fargate for the API, ElastiCache for Redis, SES over SMTP for email, and the web image or S3 + CloudFront for the client), but there is no infrastructure code or CI yet.
- **No admin UI for featured products.** They are chosen by editing `featured.json`, as recorded in [DECISIONS.md](DECISIONS.md).

The reasons for each cut and the plan for the next day are in [DECISIONS.md](DECISIONS.md).

## Time spent

About **6h 15m** in total, over the 2–3 hour time box. The times come from the sessions logged in [AI_USAGE.md](AI_USAGE.md).

| Phase                           | Time   | What it covered                                                                                                                                |
| ------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Planning                        | 2h 15m | Analysing the requirements, writing DECISIONS.md, and building and reviewing the plan and CLAUDE.md                                            |
| Building, testing and reviewing | 4h     | Scaffolding, contracts, API, UI, enquiry, Docker and docs. More of this went on testing and reviewing the AI's output than on generating code. |

## Further reading

| File                         | What it covers                                                         |
| ---------------------------- | ---------------------------------------------------------------------- |
| [DECISIONS.md](DECISIONS.md) | Assumptions where the acceptance criteria were unclear, and trade-offs |
| [AI_USAGE.md](AI_USAGE.md)   | Tools, models, key prompts and where the AI got things wrong           |
| [CLAUDE.md](CLAUDE.md)       | The agent instructions used to build this: architecture and rules      |
| [PLAN.md](PLAN.md)           | The original scaffold plan                                             |
