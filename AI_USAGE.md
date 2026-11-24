# AI Usage Log

## 23 November 2026, 23:05 - 24 November 2026, 01:20

### 1. Requirements analysis

- **Tool:** Claude Opus 5.5, medium effort (claude.ai)
- **Key prompt:**

  > Analyze the attached document and understand the requirement. You are the Senior Developer in charge of creating the application and I am the Product Manager. Based on your analysis, ask me clarifying questions (if any). Based on my answers, your task is to identify the gaps and design the solution to make it maintainable and extensible in the long run.

- **Outcome:** Claude analysed the document, asked clarifying questions and brought forward the gaps in the acceptance criteria.

### 2. Preparing DECISIONS.md

- **Tool:** Claude Opus 5.5, low effort (claude.ai)
- **Key prompt:**

  > I am pasting my decision.md contents. Format it properly and fix any grammatical mistakes.

  A rough draft of my DECISIONS.md was pasted as context.

- **Outcome:** Claude formatted the content as Markdown and fixed the grammar.

### 3. Building the plan

- **Tool:** Claude Opus 5.5, medium effort (Claude Code CLI, Plan Mode)
- **Key prompt:**

> We're building a product catalogue web app. Customers browse and search products and send an enquiry about a product to the sales team. Treat this as the foundation of a real product, not a throwaway prototype. The product data source, the look and feel, and the email provider will all change later, so they must be swappable without touching the rest of the code.
>
> ## Features
> 1. Home page: shows 5 featured products. An admin picks them by product ID in a config file (featured.json). If the file is empty, fall back to the 5 highest-rated products.
> 2. Category page: a category link shows the top 3 products by rating, then the remaining products in that category, paginated. No product appears twice.
> 3. Search: a search bar in the header. Clicking search shows only products whose title or description contains the term (case-insensitive, partial match). No semantic search.
> 4. Product page: clicking a product tile opens a details page with image, title, price in USD, rating, description and an Enquire button.
> 5. Enquiry: a form with name, email, phone (optional) and message (optional); the product ID is attached automatically. On submit, the sales inbox receives an email and the customer sees a "Thank you" message. If sending fails, show an error and let the customer retry. There is no confirmation email to the customer and enquiries are not stored. Spam protection is a hidden honeypot field plus rate limiting, with no CAPTCHA.
>
> ## Data and services
> - Products come from the Fake Store API (https://fakestoreapi.com). The frontend never calls it directly; all product data goes through our backend.
> - The backend fetches the full product list once, caches it in Redis, and does search, rating order and pagination in memory. Don't use Fake Store's limit/sort parameters, but keep the product query interface able to carry search, sort, page and pageSize so a future data source can handle them upstream.
> - Cache rule: data is fresh for 10 minutes. After that, refetch. If the refetch fails, serve the last good copy for up to 24 hours. If Redis is down, call Fake Store directly.
> - Email goes over SMTP to Mailpit locally (SES later).
>
> ## Stack
> - Runtime: Node.js 26.13.1 (LTS). Pin it in .nvmrc, in the "engines" field of the root package.json, and use node:26.13.1-alpine in Dockerfiles.
> - Monorepo with pnpm workspaces: apps/web, apps/api, packages/contracts.
> - packages/contracts: Zod schemas and the types inferred from them, shared by both apps as the single API contract.
> - apps/web: React 18, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Router, TanStack Query, Axios (one instance), React Hook Form, Zod. If any shadcn component or library needs React 19, tell me instead of upgrading React.
> - apps/api: Express 5, TypeScript, Zod, ioredis, express-rate-limit + rate-limit-redis, helmet, cors, Nodemailer, pino + pino-http.
> - Tests: Vitest, Supertest, Testing Library, MSW. Playwright later.
> - Docker Compose services later: web (nginx), api, redis, mailpit.
>
> ## Architecture: clear separation of concerns
> Each layer has one job and depends only on the layer below it or on interfaces. Business rules never live in HTTP handlers, React components or adapters.
>
> API (ports and adapters):
> - routes/: HTTP only. Parse and validate the request with contracts, call one service method, map the result or error to a response. No business logic.
> - middleware/: cross-cutting concerns only: validation, error handling, rate limiting, honeypot, request logging.
> - services/: all business rules (featured selection, top-rated ranking, search, pagination, enquiry handling). Pure TypeScript; no Express, Redis, HTTP client or SMTP imports.
> - ports/: interfaces the services depend on: ProductSource, FeaturedSelector, Mailer, Cache.
> - adapters/: the only code that talks to the outside world (Fake Store, featured.json, Redis, SMTP). Each maps external data to our own types at the edge. Only the Fake Store adapter knows Fake Store's response shape, including category slugs (e.g. "men's clothing" → mens-clothing, and the upstream spelling "jewelery" → jewellery).
> - config/: env loading and validation with Zod; fail fast at startup.
> - container.ts: composition root. The only place that creates adapters and passes them into services, chosen by env.
> - app.ts builds the Express app; server.ts only starts and stops it.
>
> Web:
> - app/: router, providers and layout only.
> - features/<name>/: one folder per feature (home, category, search, product, enquiry) holding its page, its data hooks and its feature-specific components.
> - Pages compose components and hooks; they hold no data-fetching or formatting logic.
> - Hooks (TanStack Query) own server state and call lib/api.ts. Components never call Axios or fetch.
> - lib/http.ts holds the single Axios instance; lib/api.ts holds the typed API functions and validates responses with contracts.
> - components/: shared presentational components (ProductTile, ProductGrid, Pagination, PriceTag, loading/error/empty states). They receive props and render; no fetching.
> - config/brand.ts and the shadcn CSS variables hold all branding, so a redesign never touches feature code.
>
> Contracts:
> - packages/contracts is the only thing shared between web and api. apps/web never imports from apps/api.
>
> Boundaries are enforced with ESLint no-restricted-imports: routes cannot import adapters, services cannot import Express/Redis/HTTP/SMTP libraries, components cannot import lib/http.ts, and web cannot import api.
>
> API conventions: everything under /api/v1, plus /health. Every error uses one shape: { error: { code, message, fields? } }. Commit .env.example; never commit .env or secrets.
>
> ## Coding rules
> - TypeScript strict mode plus noUncheckedIndexedAccess. Never use `any` or `unknown`; add ESLint rules that ban both. Narrow caught errors with instanceof; type external data with z.infer.
> - No comments in code. Clear names instead.
> - Small, single-purpose modules. Every feature ships with tests for its business rules.
> - Ask before adding any dependency not listed above.
>
> ## Your first task: scaffold only, no features yet
> 1. Propose the full folder tree and the exact packages per workspace, then wait for my approval.
> 2. After approval, set up:
>    - the workspace with Node 26.13.1 pinned, and a shared strict tsconfig base
>    - ESLint and Prettier with the rules and import boundaries above
>    - the Vite React 18 app with Tailwind v4 and shadcn initialised (Button, Card, Input, Form, Skeleton, Badge, Pagination)
>    - the Express app split into app.ts and server.ts, with helmet, pino-http, a typed error handler and GET /health
>    - the empty layer folders for both apps, so the structure is visible from day one
>    - an empty contracts package wired into both apps
>    - a Vitest setup in each package with one passing test
> 3. Write a CLAUDE.md at the repo root that captures this architecture, the layer responsibilities, the boundaries and the coding rules, so future sessions follow them.
> 4. Finish by running `pnpm install`, `pnpm typecheck`, `pnpm lint` and `pnpm test`. All must pass. Then summarise what you created and anything you assumed.

- **Outcome:** Claude generated the plan (`PLAN.md`) and passed it to me for approval.
- **My correction to Claude's plan:** I reviewed the plan and asked Claude to use React 19 instead of React 18, since shadcn/ui's Tailwind v4 components no longer use `React.forwardRef` and instead rely on React 19's `ref` as an ordinary prop.

## 24 November 2026, 14:30 - 24 November 2026, 18:30

### 4. Scaffolding the project

- **Tool:** Claude Opus 5.5, medium effort (Claude Code CLI, Accept edits mode)
- **Outcome:** Claude scaffolded the workspace from the approved plan. I reviewed the folder structure to make sure it followed the plan and best practices. Claude also flagged that React Router 8 is incompatible with React versions below 19.2.7, which confirmed my correction: had I kept React 18 as originally prompted, the app would have broken.

### 5. Building the API contracts

- **Tool:** Claude Opus 5.5, medium effort (Claude Code CLI, Accept edits mode)
- **Key prompt:**

  > Let's work on the contracts now. Check the Fakestore API documentation at https://fakestoreapi.com/ and build contracts for Product, Category, Page<T>, CategoryPage, SearchQuery, EnquiryRequest

- **Outcome:** Claude read the Fake Store API documentation, built the contracts as expected and handed them back for review.

### 6. Building the catalogue API

- **Tool:** Claude Opus 5.5, medium effort (Claude Code CLI, Accept edits mode)
- **Outcome:** Built over multiple prompts and follow-ups: the Fake Store adapter, the cached product feed (10-minute freshness, 24-hour stale fallback, single-flight refetch), the in-memory product source, the catalogue service and the featured, category, search and product endpoints.

### 7. Creating the UI

- **Tool:** Claude Opus 5.5, high effort (claude.ai, Claude Design). The design artifact was then used as the reference in Claude Code.
- **Key prompt:**

  > Refer the artifact and build the UI for supporting the catalogue API. Build using a component driven design and prefer maintainability, readability and minimal code duplication. The design should be made configurable so that it is easy to update the theme of the application.

- **Outcome:** Claude built the UI to match the design artifact: theme tokens in `index.css` and `config/brand.ts`, a typed API client validated against the contracts, shared product and async-state components, and the home, category, search and product pages with MSW-backed route tests.

### 8. Building the enquiry feature

- **Tool:** Claude Opus 5.5, medium effort (Claude Code CLI, Accept edits mode)
- **Outcome:** Claude built the enquiry flow end to end: the `Mailer` port and SMTP adapter, the enquiry service, the Redis-backed rate limiter that fails open, the honeypot middleware, `POST /api/v1/enquiries`, and the enquiry form on the product page with server field errors mapped onto the inputs. Follow-ups added the "Thank you" message after a successful enquiry and a configurable number of trusted proxy hops, so the rate limiter sees the real client IP behind nginx. The enquiry decisions were recorded in DECISIONS.md (section 8).

### 9. Docker and documentation

- **Tool:** Claude Opus 5.5, medium effort (Claude Code CLI, Accept edits mode)
- **Outcome:** Claude added the production API Dockerfile, the nginx web image and a Docker Compose file running web, api, redis and mailpit, then wrote the README and updated CLAUDE.md with the Docker setup.

### 10. Updating this log and DECISIONS.md

- **Tool:** Claude Opus 5.5 (Claude Code CLI, auto mode)
- **Key prompt:**

  > update the @AI_USAGE.md and @DECISIONS.md

- **Outcome:** Claude added the missing entries from the git history, fixed the numbering, the session end time and typos, and recorded the decisions made during implementation in DECISIONS.md.

## Where the AI got things wrong

1. **The API ignored the root `.env`.** When Claude scaffolded the API, its dev script loaded `--env-file-if-exists=.env`. That path resolves to `apps/api/.env`, not the root `.env` the plan specified. Because the flag is "if exists", nothing reported the missing file. I caught it when the API exited at startup: the env validation in `config/env.ts` fails fast when a required variable is missing. I fixed the path to `../../.env` (commit `6d80f4c`).
2. **shadcn installed an unrelated npm package.** While adding a shadcn component, the shadcn CLI could not resolve the `@/lib/utils` alias, and as a result an unrelated npm package called `cn` was added to `package.json`. I caught it by reviewing the `package.json` diff and removed it. I then added a rule to CLAUDE.md: ask before adding any dependency, and review `package.json` after every `shadcn add`.
3. **Plan corrections.** These weren't errors, but I overrode two of Claude's choices during planning. I changed my own prompt's React 18 to React 19, and Claude later confirmed that React Router 8 needs React 19.2.7 or later. I also rejected Claude's suggestion of Fastify in favour of Express to keep the stack simple (see [DECISIONS.md](DECISIONS.md)).
