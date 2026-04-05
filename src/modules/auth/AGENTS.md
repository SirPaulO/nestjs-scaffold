# modules/auth/ — Authentication

JWT-based authentication using Passport.js.

---

## Structure

```
auth/
├── guards/
│   └── jwt-auth.guard.ts     # Global guard; respects @Public() routes
├── interfaces/
│   ├── jwt-payload.interface.ts   # Shape of the JWT payload / req.user
│   └── auth-tokens.interface.ts   # Login response shape
├── strategies/
│   ├── jwt.strategy.ts        # Validates Bearer token; populates req.user
│   └── local.strategy.ts      # Validates email + password; delegates to AuthService
├── auth.controller.ts         # POST /auth/login
├── auth.module.ts
└── auth.service.ts            # validateUser() stub — wire up User entity here
```

---

## How It Works

1. **Login** (`POST /auth/login`): `LocalStrategy` calls `AuthService.validateUser`.
   On success Passport sets `req.user`; controller calls `AuthService.login` to issue JWT.
2. **Protected routes**: `JwtStrategy` validates the Bearer token and attaches the
   decoded `JwtPayload` to `req.user`.
3. **Public routes**: Decorate with `@Public()` to skip JWT verification.
4. **Role-based access**: Decorate with `@Roles('admin')` and apply `RolesGuard`.

---

## Wiring AuthService

`auth.service.ts` contains stubs. To complete the implementation:
1. Create a `User` entity extending `BaseEntity`.
2. Inject `UsersService` (or the TypeORM repository) into `AuthService`.
3. Implement `validateUser(email, password)` using `bcrypt.compare`.
4. Optionally add `register(dto)` and refresh-token logic.

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
  sub: string;     // user ID
  email: string;
  roles: string[]; // e.g. ['admin', 'user']
}
```

Extend `roles` or add claims to suit your domain.
