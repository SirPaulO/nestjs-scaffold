# common/ — Shared Utilities

Shared infrastructure used across feature modules. Import via `@common/*` path alias.

---

## Structure

```
common/
├── constants/
│   └── error-codes.ts        # AppErrorCode enum — add codes here as the domain grows
├── decorators/
│   ├── roles.decorator.ts    # @Roles(...roles) — metadata for RolesGuard
│   └── public.decorator.ts   # @Public() — skip JWT auth on a route
├── dto/
│   └── pagination.dto.ts     # PaginationDto base class
├── filters/
│   └── http-exception.filter.ts  # Global error filter (consistent JSON shape)
├── guards/
│   ├── api-key.guard.ts      # X-Api-Key vs SYSTEM_API_KEYS, constant-time compare
│   └── roles.guard.ts        # Enforces @Roles() metadata
└── validators/               # Custom class-validator decorators
    ├── is-future-date.validator.ts
    ├── is-phone-number.validator.ts
    ├── is-strong-password.validator.ts
    └── is-timezone.validator.ts
```

---

## Error Response Shape

All errors return:
```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden",
  "errorCode": "FORBIDDEN",
  "details": null
}
```

Debug mode (APP_DEBUG=true or X-Debug-Mode header in non-prod) expands messages and surfaces validation details.

---

## Global Guards (already wired in AppModule)

`AppModule` registers two global `APP_GUARD`s, in this order:
```typescript
{ provide: APP_GUARD, useClass: ThrottlerGuard }, // rate-limit first — applies even to bad auth
{ provide: APP_GUARD, useClass: JwtAuthGuard },   // deny by default; @Public() opts a route out
```
Every route requires a valid JWT unless decorated `@Public()`. `RolesGuard` stays **opt-in**:
apply it (with `@UseGuards(RolesGuard)`) plus `@Roles(...)` on the specific controller/route that
needs role checks — it is not a global guard, since not every route needs RBAC.

`ApiKeyGuard` (X-Api-Key vs `SYSTEM_API_KEYS`) is separate from both: it's for service-to-service
routes under `modules/internal`, which mark themselves `@Public()` to opt out of the JWT guard
while `ApiKeyGuard` still fully guards them.

---

## Adding Error Codes

Add to `AppErrorCode` enum in `constants/error-codes.ts`. Use `UPPER_SNAKE_CASE`.
Pass as the second argument to NestJS exceptions:
```typescript
throw new ForbiddenException('message', AppErrorCode.FORBIDDEN);
```
