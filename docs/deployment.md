# Production deployment checklist

Configure these Vercel **Production** environment variables before redeploying:

`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`.

After saving variables, redeploy the latest `main` deployment. Apply the committed Prisma migration against the production database with `npm run db:migrate:deploy`. Run `npm run db:seed` only when a disposable demo organization and operator-approved demo password are configured. Never commit `.env` files or paste secret values into screenshots or chat.

Validate the public URL, sign-up/email verification, password reset, invitation acceptance, organization isolation, and Jobs create/edit/archive flows before final submission.
