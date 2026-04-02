# Sistem Akademik

Academic information system built with SvelteKit, Tailwind, DaisyUI, and Prisma.

## Requirements

- Node `>=20.19 <21 || >=22.12`
- MariaDB / MySQL

## Environment

Copy `.env.example` to `.env` and set the required values:

```sh
cp .env.example .env
```

- `DATABASE_URL` is required and must point to the application database
- `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` protect the app and API with HTTP Basic Auth

## Scripts

```sh
npm run dev
npm run check
npm run test
npm run build
```

## Database

After updating the Prisma schema, regenerate and apply changes with:

```sh
npm run db:push
```
