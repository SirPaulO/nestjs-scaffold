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

## Adding Guards Globally

Register `JwtAuthGuard` or `RolesGuard` as global guards in `AppModule`:
```typescript
{ provide: APP_GUARD, useClass: JwtAuthGuard }
```

---

## Adding Error Codes

Add to `AppErrorCode` enum in `constants/error-codes.ts`. Use `UPPER_SNAKE_CASE`.
Pass as the second argument to NestJS exceptions:
```typescript
throw new ForbiddenException('message', AppErrorCode.FORBIDDEN);
```
