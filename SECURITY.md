# Security Policy

## Scope

This repository holds the Equidentum Store: its backend configuration, scripts,
API routes, integrations and storefront. It runs the official Medusa release
and does not fork or patch Medusa itself.

| Where the problem is | Report it |
| -------------------- | --------- |
| Equidentum Store configuration, scripts, API routes or storefront code | Here, see below |
| Medusa core, its modules, or the admin dashboard | To [MedusaJS](https://github.com/medusajs/medusa/security) |
| Railway the platform | To [Railway](https://railway.com/) |
| A third-party integration (Stripe, Resend, MeiliSearch, the S3 provider) | To that vendor |

If you are not sure, report it here and it will be routed.

## Supported versions

Only the current `main` branch is supported.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting: open the
[Security tab](https://github.com/gamallequ/medusajs-2.0-for-railway-boilerplate/security)
and choose **Report a vulnerability**.

Please do **not** open a public issue for anything that would let someone take
over the store, read customer data, or extract credentials.

Include what you did, what happened, what you expected, and whether you
confirmed it against the live store or only read the code.

## Known behaviour that is not a vulnerability

- **`/key-exchange` is unauthenticated.** It returns the store's *publishable*
  API key, which is public by design and already ships in the storefront's
  client bundle.
- **The password reset endpoint is not rate limited.** It is Medusa's own
  route. Each new token invalidates the previous one, tokens are single use,
  expire in 15 minutes, and are only sent to the address on the account.
- **The reset endpoint answers the same for an unknown address.** That is
  deliberate, so it cannot be used to find out which addresses have accounts.
- **`.env.template` contains `supersecret`.** It is a labelled placeholder, and
  the backend prints a warning at boot if production still uses it.

## Secrets that must be set in production

1. **`JWT_SECRET` and `COOKIE_SECRET`.** They sign admin sessions. Generate one with
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. **`MEDUSA_ADMIN_PASSWORD`.** Change it before the first boot, or change the
   password in the dashboard afterwards.

Anything copied from `.env.template` and left unchanged should be treated as public.
