# Task Manager API

NestJS 12 + TypeScript (ESM) REST API: user registration/login with JWT, and
per-user tasks stored in PostgreSQL through TypeORM.

## Quick start

```bash
cp .env.example .env          # then set DB_PASSWORD and a real JWT_SECRET
docker compose up -d db       # PostgreSQL on localhost:${DB_PORT}
yarn install
yarn start:dev                # migrations are applied automatically on boot
```

- API: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/docs` (disabled when `NODE_ENV=production`)
- Health: `http://localhost:3000/api/health`

Run the whole stack in containers with `docker compose up --build`.

## Configuration

All settings come from environment variables and are validated at startup
(`src/config/env.validation.ts`); the app refuses to boot on bad config.
See `.env.example` for the full list. Never commit `.env`.

## Scripts

| Script                       | Purpose                                          |
| ---------------------------- | ------------------------------------------------ |
| `yarn start:dev`             | Watch mode                                       |
| `yarn build` / `start:prod`  | Compile to `dist/` and run it                    |
| `yarn lint` / `format`       | oxlint (type-aware) / prettier                   |
| `yarn test` / `test:cov`     | Unit tests (no database needed)                  |
| `yarn test:e2e`              | End-to-end tests, **requires a running Postgres**|
| `yarn migration:generate <path>` | Diff entities against the DB into a migration |
| `yarn migration:run` / `revert`  | Apply / roll back migrations                  |

## Database and migrations

`synchronize` is off. Schema changes go through migrations in
`src/database/migrations`, applied on boot (`migrationsRun`) and via
`yarn migration:run`. After changing an entity:

```bash
yarn migration:generate src/database/migrations/DescribeTheChange
```

Review the generated SQL before committing it. Setting `DB_SYNCHRONIZE=true`
is only for throwaway local databases (the e2e suite does this itself).

## Architecture

```
src/
  main.ts / app.setup.ts   bootstrap; app.setup.ts is shared with e2e tests
  config/                  typed configuration + env validation
  database/                TypeORM wiring, data-source (CLI), migrations
  common/                  cross-cutting code shared by feature modules
    decorators/            @Public(), @CurrentUser()
    guards/                JwtAuthGuard (global, secure by default)
    filters/ interceptors/ HttpExceptionFilter; logging/transform interceptors
    hashing/               HashingService abstraction (bcrypt implementation)
    logger/                dynamic LoggerModule + request logging middleware
    entities/              BaseEntity (uuid id, timestamps)
  auth/  users/  tasks/    feature modules: controller, service, dto/, entities/
  health/                  liveness/readiness (database + heap)
```

Conventions worth knowing:

- **Secure by default.** `JwtAuthGuard` is global; opt out with `@Public()`.
- **Password never leaves the API.** `User.password` is `@Exclude()`d and a
  global `ClassSerializerInterceptor` strips it from every response.
- **Responses** are wrapped as `{ success, data }`; errors as
  `{ success: false, statusCode, message, ... }`.
- **Tasks are scoped to their owner.** Another user's task returns 404, not 403,
  so ids cannot be probed.
- **Validation** is a global `ValidationPipe` (whitelist, reject unknown
  fields, transform). DTOs carry both `class-validator` and Swagger decorators.
- **Rate limiting** is global (`THROTTLE_*`), with a stricter limit on
  `/auth/*`.
- `findByEmail` returns `null`; `findOne` throws `NotFoundException`. Use the
  non-throwing one for existence checks.

## Endpoints

| Method | Path                   | Auth | Notes                     |
| ------ | ---------------------- | ---- | ------------------------- |
| POST   | `/api/auth/register`   | no   | returns `accessToken`     |
| POST   | `/api/auth/login`      | no   | returns `accessToken`     |
| CRUD   | `/api/tasks[/:id]`     | yes  | only the caller's tasks   |
| CRUD   | `/api/users[/:id]`     | yes  | no roles yet, see below   |
| GET    | `/api/health`          | no   |                           |

## Known gaps

- `/api/users` is open to any authenticated user. Add roles/permissions
  before exposing it beyond a trusted audience.
- No refresh tokens; access tokens live for `JWT_EXPIRES_IN`.
- No API versioning yet (`/api/v1`) and no structured (JSON) logging.
