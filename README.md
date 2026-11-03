<p align="center">
  <img src="storefront/public/brand/equidentum-logo.png" width="200" alt="Equidentum">
</p>

<h1 align="center">Equidentum Store</h1>

<p align="center">
  The online shop for horse riding gear and accessories: helmets, boots, gloves, back protectors and more.
</p>

---

## What's in this repository

| Folder | What it is |
| --- | --- |
| `backend/` | The commerce backend and admin dashboard: products, inventory, orders, customers, shipping and payments. Built on Medusa 2. |
| `storefront/` | The customer-facing shop, built with Next.js 15 and Tailwind CSS. |
| `docs/` | Architecture diagrams. |
| `docker-compose.yml` | Local Postgres, Redis, MeiliSearch and MinIO (S3) for development. |

## Stack

- **Backend:** Medusa 2 (Node.js, TypeScript)
- **Storefront:** Next.js 15 (App Router), Tailwind CSS
- **Database:** PostgreSQL
- **Cache / events:** Redis
- **Search:** MeiliSearch
- **File storage:** S3-compatible object storage (product images)
- **Payments:** Stripe
- **Email:** Resend (order confirmations, admin invites, password resets)
- **Hosting:** Railway

Stripe, Resend, MeiliSearch and S3 are optional when running locally. Each one is switched on when its environment variables are set.

## Getting started locally

### Requirements

- Node 22.12 or later (both packages ship a `.nvmrc`)
- pnpm (the project is pnpm-only; npm or yarn installs will build locally but fail on deploy)
- Docker, for the local services

### 1. Start the local services

```bash
docker compose up -d
```

This starts Postgres, Redis, MeiliSearch and MinIO. A public `medusa-media` bucket is created automatically.

- MinIO console: http://localhost:9005
- MeiliSearch: http://localhost:7700

### 2. Backend

```bash
cd backend
cp .env.template .env       # fill in the values; read the top of the file first
pnpm install
pnpm ib                     # run migrations and seed the database
pnpm dev                    # API on :9000, admin dashboard on :9000/app
```

Only run `pnpm ib` against a database you are happy to seed. See [backend/README.md](backend/README.md) for more.

### 3. Storefront

```bash
cd storefront
cp .env.local.template .env.local
pnpm install
pnpm dev                    # http://localhost:8000
```

The storefront needs the backend running on port 9000, because it fetches its publishable API key from the backend at startup. Set `NEXT_PUBLIC_STORE_NAME=Equidentum` in `.env.local`. See [storefront/README.md](storefront/README.md) for more.

## Configuration

Environment variables are documented in:

- `backend/.env.template`
- `storefront/.env.local.template`

Before any production deploy, change `JWT_SECRET`, `COOKIE_SECRET` and `EQUIDENTUM_ADMIN_PASSWORD` from their placeholder values.

## Deployment

The store runs on Railway as one project with these services: backend, storefront, Postgres, Redis, MeiliSearch, a storage bucket and a read-only bucket proxy that serves product images publicly.

![Architecture diagram](docs/diagrams/railway-stack.png)

To reproduce a deploy-only problem locally, run `pnpm build && pnpm start` in `backend/`. That runs the compiled server, the same way Railway does.

## Security

See [SECURITY.md](SECURITY.md) for how to report a vulnerability.

## License

Released under the [MIT License](LICENSE).
