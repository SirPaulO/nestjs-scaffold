# modules/auth/ — Authentication

JWT verification using Passport.js. Validates Bearer tokens and populates `req.user` with the decoded payload.

---

## Structure

```
auth/
├── guards/
│   └── jwt-auth.guard.ts          # Global guard; respects @Public() routes
├── interfaces/
│   └── jwt-payload.interface.ts   # Shape of the decoded JWT / req.user
├── strategies/
│   └── jwt.strategy.ts            # Validates Bearer token; populates req.user
└── auth.module.ts
```

---

## How It Works

1. **Protected routes**: `JwtStrategy` validates the Bearer token and attaches the decoded `JwtPayload` to `req.user`.
2. **Public routes**: Decorate with `@Public()` to skip JWT verification.
3. **Role-based access**: Decorate with `@Roles('admin')` and apply `RolesGuard`.

---

## Global Guard Setup (AppModule)

```typescript
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }]
```

---

## JWT Payload

```typescript
interface JwtPayload {
  sub: string;       // user ID — always present
  iat?: number;
  exp?: number;
  [key: string]: unknown; // any additional claims from the token
}
```

The strategy only validates that `sub` is present. All other claims are passed through as-is.
