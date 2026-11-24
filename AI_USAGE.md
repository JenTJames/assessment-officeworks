# AI Usage Log

## 23 November 2026, 23:05 - 24 November 2026, 01:20

### 1. Requirements analysis

- **Tool:** Claude Opus 5.5, medium effort (claude.ai)
- **Key prompt:**

  > Analyze the attached document and understand the requirement. You are the Senior Developer in charge of creating the application and I am the Product Manager. Based on your analysis, ask me clarifying questions (if any). Based on my answers, your task is to identify the gaps and design the solution to make it maintainable and extensible in the long run.

- **Outcome:**: Claude analyzed the document and asked for clarifying questions and bought forward the gaps in the acceptance criteria.


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

- **Outcome:**: Claude generated the plan and passed it to me for approval. After approval, the workspace is scaffolded and I reviewed the folder structure to ensure that it followed the plan accurately and best practices were followed.
- **My correction to Claude's Plan:**
    I went reviewed the plan and asked Claude to use React 19 instead of React 18 since ShadCN's Tailwind V4 components no longer uses React.forwardRef and instead uses React 19's ref as an ordinary prop.

## 24 November 2026, 14:30 - 24 November 2026, 06:00

### 4. Scaffolding the Project
- **Tool:** Claude Opus 5.5, medium effort (Claude Code CLI, Accept edits mode)
- **Outcome:** Claude scaffolded the project, correctly flagged incompatibility of React Router 8 & React 19.2.7 below versions. So, if I went ahead with Claude's suggestion of using React 18, it could have broken the app.

### 5. Building API Contracts
- **Tool:** Claude Opus 5.5, medium effort (Claude Code CLI, Accept edits mode)
- **Prompt:** Let's work on the contracts now. Check the Fakestore API documentation at https://fakestoreapi.com/ and build contracts for Product, Category, Page<T>, CategoryPage, SearchQuery, EnquiryRequest
- **Outcome:** Claude correctly visited the FakeStore APIs and built the contracts as expected and gave back for review.

### 6. Building the APIs
- **Tool:** Claude Opus 5.5, medium effort (Claude Code CLI, Accept edits mode)
- **Outcome:** Multiple prompts and followups were fired to build the APIs using claude.

### 6. Creating the UI
- **Tool:** Claude Opus 5.5, high effort (claude.ai, claude design) - Artifact created for reference in code
- **Prompt:** Refer the artifact and build the build the UI for supporting the catelogue API. Build using a component driven design and prefer maintainability, readability and minimal code duplication. The design should be made configurable so that it is easy to update the theme of the application. 
- **Outcome:** Claude referred the created design artifact and created the UI eaxactly as is. 