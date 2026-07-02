# modules/auth/ — Authentication

JWT verification using Passport.js. Validates Bearer tokens and populates `req.user` with the decoded payload.

---

## Structure

```
auth/
├── guards/
│   ├── index.ts                   # barrel — import as `@modules/auth/guards`
│   └── jwt-auth.guard.ts          # Global guard; respects @Public() routes
├── interfaces/
│   └── jwt-payload.interface.ts   # Shape of the decoded JWT / req.user
├── strategies/
│   └── jwt.strategy.ts            # Validates Bearer token; populates req.user
└── auth.module.ts
```

---

## How It Works

1. **Protected routes (default)**: every route is protected by default — `JwtStrategy` validates
   the Bearer token and attaches the decoded `JwtPayload` to `req.user`.
2. **Public routes**: decorate with `@Public()` to skip JWT verification (e.g. `GET /health`, or
   an entire controller like `InternalController` that authenticates via `X-Api-Key` instead).
3. **Role-based access**: decorate with `@Roles('admin')` and apply `RolesGuard` (opt-in,
   per-controller/route — not a global guard).

`JwtStrategy`'s constructor fails closed: it throws at boot if `JWT_SECRET` is unset, rather than
starting with no signature verification.

---

## Global Guard Setup (already wired in AppModule)

```typescript
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards';

providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }]
```

This is live in `app.module.ts` (alongside a `ThrottlerGuard` `APP_GUARD` registered first — see
`src/common/AGENTS.md` § Global Guards). Adding a new controller does **not** need any guard
wiring — it denies by default; add `@Public()` only for genuinely public/service-to-service routes.

---

## JWT Payload

```typescript
interface JwtPayload {
  sub: string;         // user ID — always present
  roles?: string[];    // role names — standard claim for RBAC (@Roles()/RolesGuard)
  iat?: number;
  exp?: number;
  [key: string]: unknown; // any additional claims from the token
}
```

The strategy only validates that `sub` is present. All other claims are passed through as-is.
