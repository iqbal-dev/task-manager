---
name: new-resource
description: Scaffold a new user-owned CRUD feature module (entity, migration, DTOs, service, controller, unit + e2e tests) in this NestJS task-manager API, following the conventions of src/tasks/. Use when the user asks to add a new resource, entity, endpoint group, or feature module (e.g. "add projects", "add a tags resource", "create a comments module").
argument-hint: <resource-name> [fields...]
---

# Add a new feature module

Scaffold a resource named `$ARGUMENTS`. `src/tasks/` is the canonical template — read every file in it before writing anything, and mirror its structure, naming and comment density. Don't copy code from this skill; copy it from the real files so it stays current.

If the resource name or its fields are unclear, ask once, then proceed. Default to **user-owned** (scoped by `ownerId`) unless the user says it's global.

## Files to create

For a resource `widgets` (plural path/table) / `Widget` (singular class):

| File | Model on |
| --- | --- |
| `src/widgets/entities/widget.entity.ts` | `src/tasks/entities/task.entity.ts` |
| `src/widgets/dto/create-widget.dto.ts` | `src/tasks/dto/create-task.dto.ts` |
| `src/widgets/dto/update-widget.dto.ts` | `src/tasks/dto/update-task.dto.ts` (`PartialType` from `@nestjs/swagger`) |
| `src/widgets/widgets.service.ts` | `src/tasks/tasks.service.ts` |
| `src/widgets/widgets.controller.ts` | `src/tasks/tasks.controller.ts` |
| `src/widgets/widgets.module.ts` | `src/tasks/tasks.module.ts` |
| `src/widgets/widgets.service.spec.ts` | `src/users/users.service.spec.ts` |

## Rules that are easy to get wrong

- **ESM imports**: every relative import ends in `.js` (`./widgets.service.js`). Use `import type { Relation } from 'typeorm'` for relation property types.
- **Entity**: `@Entity('widgets')`, extend `BaseEntity` from `src/common/entities/base.entity.ts` (never redeclare `id`/timestamps). Owned resources get an `@Index()`ed `ownerId` uuid column plus `@ManyToOne(() => User, …, { onDelete: 'CASCADE' })`. Add the inverse `@OneToMany` on `src/users/entities/user.entity.ts` only if something needs it.
- **DTOs**: every field has both `class-validator` decorators and `@ApiProperty` / `@ApiPropertyOptional`. Never accept `ownerId` or `id` in a DTO — the global `ValidationPipe` whitelist would strip it anyway, but it must not appear in Swagger.
- **Service**: every method takes `ownerId` first and filters by it. `findOne` throws `NotFoundException` when the row is missing *or belongs to someone else* (404, never 403). `create` builds the entity explicitly from DTO fields plus `ownerId` — don't spread the DTO.
- **Controller**: `@ApiTags('widgets')`, `@ApiBearerAuth()`, get the caller with `@CurrentUser() user: User`, validate ids with `ParseUUIDPipe`, `DELETE` returns `@HttpCode(HttpStatus.NO_CONTENT)`. Return entities directly — the interceptors handle serialization and the `{ success, data }` envelope. No `@Public()` unless explicitly requested.
- **Module**: `TypeOrmModule.forFeature([Widget])`, then add `WidgetsModule` to `imports` in `src/app.module.ts` (next to `TasksModule`). `autoLoadEntities` picks up the entity from there.
- **Unit tests**: Vitest globals (`vi.fn()`, not `jest.fn()`); mock the repository via `getRepositoryToken(Widget)`. Cover at least: create sets `ownerId`, `findOne` 404s on a missing / foreign row, update and remove go through the ownership check.

## Migration

`synchronize` is off, so the schema change needs a migration. Postgres must be running (`docker compose up -d db`).

```bash
yarn migration:generate src/database/migrations/AddWidgets
```

Read the generated file in `src/database/migrations/` and check: the table, the FK to `users` with `ON DELETE CASCADE`, the `ownerId` index, and that `down()` reverses `up()`. It must contain **only** the new resource's changes — if it touches unrelated tables, the entities and DB have drifted; stop and tell the user rather than committing it. Then `yarn migration:run`.

If the DB isn't available, say so and leave the migration step for the user; don't hand-write one.

## e2e

Add a `describe` block (or cases) to `test/app.e2e-spec.ts` reusing its `api()`, `bearer()` and alice/bob users: 401 without a token, create → list → get → patch → delete as the owner, and **404 when bob reads/updates/deletes alice's widget**. Deleting the users in `afterAll` cascades, so no extra cleanup.

## Verify

Run in this order and fix anything that fails before reporting done:

```bash
yarn format
yarn lint
yarn build
yarn test
yarn test:e2e   # needs Postgres; if unavailable, say it was skipped
```

Finish with a short summary: files created, the migration name, the new endpoints (`/api/widgets…`), and which checks ran.
