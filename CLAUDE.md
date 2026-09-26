# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

NestJS 12 + TypeScript REST API (JWT auth, per-user tasks) on PostgreSQL via TypeORM. Package manager is **yarn**. See `README.md` for endpoints and known gaps.

## Commands

```bash
docker compose up -d db          # local Postgres (reads DB_* from .env)
yarn start:dev                   # watch mode; pending migrations run on boot
yarn lint                        # oxlint --type-aware over src/ and test/
yarn format                      # prettier write (format:check is what CI runs)
yarn build

yarn test                                  # unit tests (src/**/*.spec.ts), no DB needed
yarn test src/users/users.service.spec.ts  # single file
yarn test -t "create"                      # filter by test name
yarn test:e2e                              # test/**/*.e2e-spec.ts, needs a running Postgres

yarn migration:generate src/database/migrations/DescribeTheChange
yarn migration:run | migration:revert
```

CI (`.github/workflows/ci.yml`) runs: `format:check` → `lint` → `build` → `test:cov` → `test:e2e`, then a Docker build.

## Things that will bite you

- **ESM project** (`"type": "module"`, `nodenext`). Relative imports must end in `.js` (`./users.service.js`), even from `.ts` files. Use `import.meta.dirname`, not `__dirname`.
- **Tests run on Vitest with SWC**, not Jest/esbuild — SWC is required so decorator metadata is emitted for Nest DI. Globals are on: use `vi.fn()`, not `jest.fn()`.
- **Schema changes need a migration.** `synchronize` is off; `DatabaseModule` sets `migrationsRun: !synchronize` and loads compiled migrations from `dist/`. The migration scripts build first and use `src/database/data-source.ts` (a separate, CLI-only DataSource — keep it in sync with `DatabaseModule` if DB options change). Review generated SQL.
- **e2e setup** (`test/setup-env.ts`) loads `.env`, forces `NODE_ENV=test` and `DB_SYNCHRONIZE=true`, and defaults `JWT_SECRET`. Tests use unique emails per run rather than truncating tables.
- **Env is validated at boot** by the Joi schema in `src/config/env.validation.ts`; adding a variable means updating it, `src/config/configuration.ts` (typed `AppConfig`), `.env.example`, and possibly CI env.

## Architecture

- **`src/app.setup.ts` → `configureApp()`** holds all HTTP-level setup (global `api` prefix, helmet, CORS, `ValidationPipe`, exception filter, interceptors, Swagger at `/docs` when not production). Both `main.ts` and the e2e suite call it, so put new global HTTP behaviour there, not in `main.ts`.
- **Global guards** are registered in `AppModule` via `APP_GUARD`: `ThrottlerGuard` then `JwtAuthGuard` (order matters). Every route requires a JWT unless marked `@Public()`; get the caller with `@CurrentUser()` (`src/common/decorators/`).
- **Response pipeline**: interceptors run `ClassSerializerInterceptor` (strips `@Exclude()` fields such as `User.password`) → `TransformInterceptor` (wraps as `{ success, data }`) → `LoggingInterceptor`. Errors are shaped by `HttpExceptionFilter` as `{ success: false, statusCode, message, ... }`. Return entities from controllers; don't hand-strip or hand-wrap.
- **Config access** is typed: `ConfigService<AppConfig, true>` with `config.get('database', { infer: true })`.
- **Hashing** is injected via the abstract `HashingService` token (bound to `BcryptService` in `HashingModule`); depend on the abstraction and mock it in tests.
- **Entities** extend `src/common/entities/base.entity.ts` (uuid id + timestamps) and are picked up by `autoLoadEntities` once registered with `TypeOrmModule.forFeature` in their module.
- **Feature modules** (`auth/`, `users/`, `tasks/`) follow controller / service / `dto/` / `entities/`. DTOs carry both `class-validator` and Swagger decorators; the global `ValidationPipe` whitelists and rejects unknown fields.
- **Ownership**: task queries are scoped to the current user; another user's task yields 404 (not 403) so ids can't be probed.
- **Service conventions**: `findOne` throws `NotFoundException`; `findByEmail` returns `null` — use the non-throwing variant for existence checks.
- **Unit tests** build a `Test.createTestingModule` with the service under test and mock providers (`getRepositoryToken(Entity)`, `HashingService`); see `src/users/users.service.spec.ts`.
