# Decisions

## Finalised Tech Stack

### Dev Tools
- pnpm
- eslint
- prettier
- vitest

### Frontend

- React 19 + TypeScript (strict type checking)
  - My original planning prompt specified React 18. When I reviewed the plan I changed it to React 19 because shadcn/ui's Tailwind v4 components use React 19's `ref` as an ordinary prop instead of `React.forwardRef`. React Router 8 also requires React 19.2.7 or later.
- Vite
- Zod
- Axios
- shadcn/ui
- Tailwind CSS
- React Router
- React Hook Form
- Tanstack Query

### Backend

- Express.js + TypeScript (strict type checking)
  - Claude suggested Fastify. I challenged this and chose Express.js to keep the stack simple.
- Fake Store API (product data source)
- Redis (product cache and rate limit store)
- Nodemailer over SMTP, with Mailpit as the local email inbox (SES later)

### Shared

- `packages/contracts`: Zod schemas and inferred types, the single API contract used by both apps

## Assumptions and Decisions

1. **Featured products on the home page**
   The acceptance criteria do not say how the "top rated" products are selected for the home page. I am assuming an admin chooses the 5 top-rated products, which are served from a config file rather than relying on the Fake Store API's rating score. If the config file is empty, the backend falls back to the Fake Store API rating. An admin panel is out of scope for now.

2. **Top-rated products on the category page**
   The acceptance criteria do not specify how many top-rated products to show on the category page. I will show 3.

3. **Search**
   The acceptance criteria for search mention "matching text" but do not name the fields to search. I will search the product title and description with a case-insensitive, partial text match. Semantic search is out of scope for now.

4. **Enquiry form fields**
   The acceptance criteria do not specify which details to collect from a customer when they enquire about a product. I will collect:

   | Field        | Required                  |
   | ------------ | ------------------------- |
   | Name         | Yes                       |
   | Email        | Yes                       |
   | Phone number | No                        |
   | Message      | No                        |
   | Product ID   | Yes (attached automatically) |

5. **Currency**
   Prices are displayed in USD by default.

6. **Caching**
   The backend will use Redis for caching, since the Fake Store API is a public service and may be unavailable at times.
   - The full product list is fetched once and search, rating order and pagination happen in memory. Fake Store's `limit`/`sort` parameters are not used, but the product query interface still carries search, sort, page and page size so a future data source can handle them upstream.
   - Data is fresh for 10 minutes. After that it is refetched, and if the refetch fails the last good copy is served for up to 24 hours.
   - If Redis is down, the API calls Fake Store directly. Without `REDIS_URL` (local development) it uses an in-memory cache and rate limiter.
   - Redis is also the rate limiter's store.

7. **Health Endpoint & Unknown Routes**
   GET /health returns {"status":"ok"} and unknown routes return the 404 error shape, both on the dev command and on the production build.

8. **Enquiry handling**
   - The enquiry form sits on the product page below the product details, with an "Enquire about this product" button that jumps to it.
   - `POST /api/v1/enquiries` returns `202 { "status": "received" }` once the email has been handed to the SMTP server.
   - The sales team can reply directly: the customer's email is the email's Reply-To. User input never goes into the subject line.
   - An enquiry about a product that doesn't exist is rejected (400). If the product data source is down, the enquiry is still sent with just the product ID, because losing a sales lead is worse than a less detailed email.
   - A bot that fills in the honeypot field gets the same success response as a real customer, but no email is sent.
   - Rate limit: 5 enquiries per IP per 15 minutes (configurable through `ENQUIRY_RATE_LIMIT_MAX` / `ENQUIRY_RATE_LIMIT_WINDOW_MS`). If Redis is down the limiter lets requests through rather than blocking every customer.
   - After a successful submission the customer sees a "Thank you" message. If sending fails, they see an error and can retry.

9. **Client IP behind a proxy**
   The rate limiter keys on the client IP, so the API trusts a configurable number of proxy hops (`TRUST_PROXY_HOPS`). It defaults to 0 for local development and is 1 in Docker Compose, where nginx sits in front of the API. Trusting more hops than actually exist would let a client spoof its IP with `X-Forwarded-For`.

10. **Category slugs**
    Categories are exposed through our own URL-safe slugs (e.g. `men's clothing` → `mens-clothing`). The upstream spelling `jewelery` is corrected to `jewellery`. Only the Fake Store adapter knows the upstream names.

11. **Running locally**
    `docker compose up --build` runs the full stack (web on 8080, Mailpit on 8025) with no accounts and no `.env` needed. The web image is nginx serving the built app and proxying `/api` and `/health` to the API. `featured.json` is mounted into the API container, so an admin can change the featured products without a rebuild.

## Dropped or simplified requirements

| What                                    | Simplified to                                    | Why                                                                                                                                                                                                       |
| --------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin UI for choosing featured products | Editing `apps/api/data/featured.json`            | The criterion only needs someone to be able to choose 5 products. A file read on every request does that with no restart, and it sits behind the `FeaturedSelector` port, so an admin UI can replace it later. |
| Storing enquiries                       | Email only                                       | The criterion only asks for an email to the sales inbox. If SMTP is down the customer gets an error (503) and can retry, so the lead is not silently lost.                                                 |
| Customer confirmation email             | On-screen "Thank you" message                    | The criterion asks for a "Thank you" message, not an email. A confirmation email also lets someone use the form to send email to any address.                                                              |
| CAPTCHA                                 | Honeypot field and rate limiting                 | A CAPTCHA needs a third-party account, which the brief rules out, and it makes the form harder to use. The honeypot and the per-IP rate limit stop simple bots.                                             |
| Semantic or fuzzy search                | Case-insensitive partial match on title and description | Fits "text matching that search term" and works over 20 products. Search sits behind the `ProductSource` query interface, so a search engine can replace it later.                                   |
| End-to-end browser tests (Playwright)   | Route-level web tests with MSW, plus API tests with Supertest | These cover each acceptance criterion within the time box. A real browser against the real stack is the first thing to add (see below).                                                         |
| Deployment pipeline and infrastructure code | AWS-compatible Docker images                  | The brief only requires that infrastructure be AWS-compatible, and a reviewer runs it locally. CI and infrastructure code add little to a PoC that is not deployed yet.                                    |

## How the design grows beyond the PoC

The brief says the product data source, the look and feel and the email provider will all change. Each one sits behind a single seam:

- **Product data source.** Services depend only on the `ProductSource` port. Fake Store's response shape and category names are known only to its adapter, and the adapter validates the data with Zod as it comes in. A new source is a new adapter swapped in `container.ts`, with no change to services, routes or the web app. A source that can search and paginate itself implements `ProductSource` directly, because the query interface already carries search, sort, page and page size.
- **Look and feel.** Branding lives only in the CSS theme tokens in `index.css` and in `config/brand.ts`. Feature code uses tokens (`bg-primary`), never raw colours, so the creative work can land without touching feature code.
- **Email provider.** Services send through the `Mailer` port. Moving to SES is a new adapter, or just configuration, because SES accepts SMTP.
- **Frontend and backend.** The two apps share only `packages/contracts`, so a breaking API change fails to compile on both sides. Endpoints are versioned under `/api/v1`, and the web app validates every response against the contracts.
- **The boundaries are enforced.** ESLint `no-restricted-imports` rules stop routes importing adapters, services importing Express, Redis or SMTP, and web components fetching data. The structure survives new contributors and AI agents, not just this submission.
- **AWS.** Each part maps to a managed service: ECS Fargate for the API, ElastiCache for Redis, SES for email, and S3 + CloudFront (or the nginx image) for the web app. All configuration comes from validated environment variables.

The README's [Designed to change](README.md#designed-to-change) section lists the exact files to touch for each change.

## What I would do next with another day

In priority order:

1. **Playwright end-to-end tests** against `docker compose`, covering browsing to a product and sending an enquiry, then checking the email arrived in Mailpit through its API.
2. **CI** (GitHub Actions) running typecheck, lint, test and build on every PR, plus a `docker compose` smoke test.
3. **Keep enquiries when email is down.** Write each enquiry to a queue (SQS) before sending, so an SES outage delays the email instead of returning an error to the customer.
4. **Infrastructure as code** (CDK or Terraform) for the AWS services above, with secrets in Secrets Manager.
5. **Observability.** Metrics and alerts for upstream failures, stale cache use and failed emails, on top of the existing pino logs.
6. **Admin for featured products**, once the entrepreneur decides who manages them.

