# Decisions

## Finalised Tech Stack

### Dev Tools
- pnpm
- eslint
- prettier
- vitest

### Frontend

- React + TypeScript (strict type checking)
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
- Mailpit (local email inbox)

## Assumptions and Decisions

1. **Featured products on the home page**
   The acceptance criteria do not say how the "top rated" products are selected for the home page. I am assuming an admin chooses the 5 top-rated products, which are served from a config file rather than relying on the Fake Store API's rating score. If the config file is empty, the backend falls back to the Fake Store API rating. An admin panel is out of scope for now.

2. **Top-rated products on the category page**
   The acceptance criteria do not specify how many top-rated products to show on the category page. I will show 3.

3. **Search**
   The acceptance criteria for search mention "matching text" but do not name the fields to search. I will search the product title and description. Only exact text matching will be performed; semantic search is out of scope for now.

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
   The backend will use Redis for caching, since the Fake Store API is a public service and may be unavailable at times. The last good copy will be served for 24 hours and redis will be used as the rate limiter.

7. **Health Endpoint & Unknown Routes**
   GET /health returns {"status":"ok"} and unknown routes return the 404 error shape, both on the dev command and on the production build.