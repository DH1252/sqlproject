# Audit Report - Sistem Akademik

## Scope

- Functional baseline: `kelompok10_akademik_b (1).md`
- Application audited: SvelteKit + Prisma implementation in this repository
- Verification completed:
  - `npm run check` - passed
  - `npm run test` - passed
  - `npm run build` - passed, but `@sveltejs/adapter-auto` still reports no concrete production target

## Requirement Mapping

| Requirement from case study                                             | Current implementation                                                                                                                      | Status      | Notes                                                                                                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Classroom master data: type, capacity, projector, AC                    | `prisma/schema.prisma:118`, `src/routes/api/ruang-kelas/+server.ts:15`, `src/routes/ruang-kelas/+page.svelte:116`                           | Implemented | Core CRUD exists and validation is adequate.                                                                                        |
| Room usage schedule per day and hour                                    | `prisma/schema.prisma:302`, `src/routes/api/ruang-kelas/[id]/jadwal/+server.ts:5`, `src/routes/api/ruang-kelas/[id]/available/+server.ts:5` | Partial     | Model exists and availability can be checked, but there is no UI or API workflow to create and maintain room reservations.          |
| Enrollment links mahasiswa, mata kuliah, dosen, ruang, jadwal, semester | `prisma/schema.prisma:203`, `src/routes/api/enrollment/+server.ts:89`                                                                       | Implemented | Conflict checks are stronger than average for a CRUD app.                                                                           |
| KRS integrated with scheduling/enrollment                               | `prisma/schema.prisma:262`, `src/routes/api/krs/[id]/approve/+server.ts:17`                                                                 | Mismatch    | KRS approval changes status only; it does not create or reconcile actual enrollments.                                               |
| Grades with tugas, UTS, UAS, total, letter grade                        | `prisma/schema.prisma:235`, `src/lib/utils/grade-calculator.ts:72`, `src/routes/api/nilai/+server.ts:70`                                    | Implemented | Grade math is covered by unit tests.                                                                                                |
| GPA/IPK calculation from completed academic record                      | `prisma/schema.prisma:48`, `src/routes/api/mahasiswa/[id]/+server.ts:38`                                                                    | Partial     | GPA can be calculated on read, but the stored `Mahasiswa.ipk` field is not kept in sync.                                            |
| Real-time academic monitoring for stakeholders                          | dashboard at `src/routes/+page.svelte:55`, entity lists under `src/routes/*/+page.svelte`                                                   | Partial     | Information is present, but most pages use client-only loading and generic admin CRUD rather than role-specific academic workflows. |

## 1. Code Quality and Structure

- Severity: Medium
  - Location: `src/routes/+page.svelte:55`, `src/routes/mahasiswa/+page.svelte:31`, `src/routes/dosen/+page.svelte:30`, `src/routes/mata-kuliah/+page.svelte:31`, `src/routes/ruang-kelas/+page.svelte:29`, `src/routes/enrollment/+page.svelte:25`
  - Issue: Entity pages repeat nearly identical loading, pagination, modal, submit, and delete logic.
  - Recommendation: Move repeated CRUD page state into shared utilities or load data server-side and keep components focused on rendering.

- Severity: Medium
  - Location: `src/lib/components/DataTable.svelte:22`, `src/routes/api/mahasiswa/[id]/+server.ts:41`, `src/routes/api/krs/+server.ts:37`
  - Issue: `any` is used in reusable components and API transformations, reducing type safety in a strict TypeScript project.
  - Recommendation: Introduce typed response mappers and generic table row constraints to remove broad `any` usage.

- Severity: Medium
  - Location: `src/lib/api/services/krs.ts:43`, `src/lib/api/services/enrollment.ts:45`, `src/lib/api/services/ruangKelas.ts:42`
  - Issue: Several service capabilities exist without any UI integration, which makes the codebase harder to reason about and suggests unfinished flows.
  - Recommendation: Either wire these service methods into the UI or remove/defer them until the workflow is actually implemented.

- Severity: Low
  - Location: `prisma/seed.ts:32`, `src/lib/server/validation.ts:25`
  - Issue: Seed data inserts `D3`, while validation only allows `S1`, `S2`, and `S3`.
  - Recommendation: Align seed data, validation rules, and business vocabulary to one consistent set of academic levels.

## 2. Framework and Library Best Practices

- Severity: High
  - Location: `src/routes/+page.svelte:55`, `src/routes/semester/+page.svelte:125`, `src/routes/krs/+page.svelte:140`, `src/routes/nilai/+page.svelte:110`
  - Issue: The app is built on SvelteKit but relies almost entirely on `onMount` for initial data loading instead of `load` functions.
  - Recommendation: Move list and dashboard fetching into `+page.ts` or `+page.server.ts` so pages benefit from SSR, URL-driven state, and better loading behavior.

- Severity: Medium
  - Location: `src/hooks.server.ts:55`, `src/routes/api/*`
  - Issue: `event.locals.prisma` is set in the hook but route handlers import the singleton directly instead of using request-scoped locals.
  - Recommendation: Pick one access pattern and standardize on it to avoid misleading infrastructure code.

- Severity: Medium
  - Location: `src/lib/api/client.ts:33`
  - Issue: The API client is minimal and does not handle aborts, timeouts, or request cancellation, which matters for search-heavy admin screens.
  - Recommendation: Add optional `AbortSignal` support and centralize network error normalization.

## 3. UI/UX Compliance

- Severity: High
  - Location: `src/routes/program-studi/+page.svelte:53`, `src/lib/api/services/programStudi.ts:14`, `src/routes/api/program-studi/+server.ts:7`
  - Issue: Program studi search is presented in the UI but is not sent by the service and is not supported by the API.
  - Recommendation: Either implement search end-to-end or remove the field until it works.

- Severity: High
  - Location: `src/routes/dosen/+page.svelte:157`, `src/lib/api/services/dosen.ts:15`, `src/routes/mata-kuliah/+page.svelte:161`, `src/lib/api/services/mataKuliah.ts:14`, `src/routes/ruang-kelas/+page.svelte:147`, `src/lib/api/services/ruangKelas.ts:15`
  - Issue: Search inputs are visible on several pages, but the current service calls never send the search text to the backend.
  - Recommendation: Pass `search` through filters, read it in each API endpoint, and keep the current query in the URL.

- Severity: Medium
  - Location: `src/lib/components/DataTable.svelte:45`, `src/lib/types/index.ts:342`, `src/routes/api/*`
  - Issue: Sortable headers are rendered, but no page passes `onSort` and no audited API endpoint accepts `sortBy` or `sortOrder`.
  - Recommendation: Implement real server-side sorting or remove sortable affordances to avoid false expectations.

- Severity: Medium
  - Location: `src/routes/mahasiswa/+page.svelte:95`, `src/routes/enrollment/+page.svelte:89`, `src/routes/semester/+page.svelte:63`
  - Issue: Error and destructive flows still depend on `alert()` and `confirm()`, which interrupt keyboard flow and feel unpolished.
  - Recommendation: Replace browser dialogs with accessible toasts and confirmation modals.

- Severity: Medium
  - Location: `src/lib/components/layout/TopBar.svelte:128`
  - Issue: The user menu links point to `/profile`, `/settings`, and `/logout`, but no such routes exist in `src/routes/`.
  - Recommendation: either implement these routes or replace them with non-broken menu actions.

- Severity: Low
  - Location: `src/routes/semester/+page.svelte:132`, `src/lib/components/DataTable.svelte:63`
  - Issue: Boolean values such as `isActive` render as raw `true` and `false` badges instead of user-friendly academic labels.
  - Recommendation: add field formatters or view-specific badge labels for booleans.

## 4. Performance Optimization

- Severity: Medium
  - Location: `src/routes/+page.svelte:55` and most `src/routes/*/+page.svelte`
  - Issue: Client-only fetching creates an empty initial render and additional network waterfalls that SvelteKit could avoid.
  - Recommendation: use server or universal `load` functions for initial page data.

- Severity: Medium
  - Location: `src/lib/components/forms/EnrollmentForm.svelte:43`, `src/lib/components/forms/KRSForm.svelte:36`, `src/lib/components/forms/NilaiForm.svelte:41`
  - Issue: Modal forms fetch full reference lists with hard-coded `limit: 100`, which will not scale once the data grows.
  - Recommendation: use searchable async selects or incremental loading for master data relationships.

- Severity: Low
  - Location: `src/routes/+layout.svelte:84`
  - Issue: Fonts are loaded from Google at runtime, adding an external dependency to every page render.
  - Recommendation: self-host fonts or explicitly accept the trade-off in documentation.

## 5. Security

- Severity: High
  - Location: `src/hooks.server.ts:16`
  - Issue: The application uses one shared HTTP Basic Auth username/password for the entire UI and API surface.
  - Recommendation: implement proper authentication with user records, sessions, and role-based access control.

- Severity: High
  - Location: `src/hooks.server.ts:87`, all API routes under `src/routes/api/**`
  - Issue: Authentication exists, but there is no authorization model for admin staff, lecturers, students, or program heads.
  - Recommendation: define actor roles from the academic domain and enforce route-level permissions.

- Severity: Medium
  - Location: `src/hooks.server.ts:34`
  - Issue: The whole app is protected with browser-level Basic Auth, which is acceptable only as a temporary gate for private demos.
  - Recommendation: keep it only as a short-term staging measure, not as the long-term production auth system.

## 6. API Integration

- Severity: High
  - Location: `prisma/schema.prisma:203`, `prisma/schema.prisma:262`, `src/routes/api/krs/[id]/approve/+server.ts:36`
  - Issue: KRS approval is not integrated with actual class enrollment. Approved KRS records remain separate from `Enrollment`.
  - Recommendation: introduce a section or class-offering model and make KRS approval create or reconcile enrollments transactionally.

- Severity: High
  - Location: `prisma/schema.prisma:302`, `src/routes/api/ruang-kelas/[id]/available/+server.ts:20`, `src/routes/api/ruang-kelas/[id]/jadwal/+server.ts:18`
  - Issue: Room scheduling is only partially integrated. The system checks `JadwalRuangan` conflicts, but there is no write workflow to maintain that data.
  - Recommendation: either manage room reservations explicitly or fold room occupancy entirely into class-section scheduling.

- Severity: High
  - Location: `prisma/schema.prisma:48`, `src/routes/api/nilai/+server.ts:75`, `src/routes/api/nilai/[id]/+server.ts:43`, `src/routes/api/mahasiswa/[id]/+server.ts:38`
  - Issue: GPA/IPK is inconsistent. `Mahasiswa.ipk` is stored, but grade changes do not update it, and GPA is only recalculated on a single read endpoint.
  - Recommendation: choose one source of truth for GPA and update it consistently in the grade workflow.

- Severity: Medium
  - Location: `src/lib/components/forms/KRSForm.svelte:29`, `src/routes/krs/+page.svelte:249`, `src/routes/api/krs/[id]/add-course/+server.ts:8`
  - Issue: KRS creation UI does not expose the existing course add/remove workflow, so users cannot manage KRS details from the main KRS screen.
  - Recommendation: add detail management to the KRS page or remove the incomplete feature until the full flow is ready.

- Severity: Medium
  - Location: `src/lib/components/forms/EnrollmentForm.svelte:41`, `src/lib/components/forms/NilaiForm.svelte:39`
  - Issue: Enrollment and grade workflows are available as raw admin forms, but they are not tied to academic role flows such as lecturer grade submission or student course planning.
  - Recommendation: define role-specific journeys and align API/UI boundaries to those journeys.

## 7. File and Asset Management

- Severity: High
  - Location: `prisma/migrations/`
  - Issue: There are no committed Prisma migrations.
  - Recommendation: adopt `prisma migrate` with versioned SQL history and stop relying on `db push` as the main deployment path.

- Severity: Medium
  - Location: `README.md:32`
  - Issue: The documented database workflow tells operators to run `db:push`, which is not a safe long-term production migration strategy.
  - Recommendation: document migration generation and application separately for local and production environments.

- Severity: Low
  - Location: `static/`
  - Issue: The project ships almost no brand or product assets beyond default static content.
  - Recommendation: add production-ready branding, favicon assets, and any required institutional media if this moves beyond internal use.

## 8. Documentation and Comments

- Severity: Medium
  - Location: `README.md:1`
  - Issue: README coverage is minimal and does not explain the academic workflow model, deployment target, migration process, or authorization limitations.
  - Recommendation: add architecture, operations, and workflow documentation.

- Severity: Medium
  - Location: `src/routes/api/krs/[id]/approve/+server.ts:17`, `src/routes/api/nilai/+server.ts:70`
  - Issue: Endpoint comments state what the route does, but not the business invariants behind approval, grade finalization, and GPA updates.
  - Recommendation: document business rules near workflow-heavy endpoints where domain mistakes are expensive.

- Severity: Low
  - Location: `src/lib/utils/grade-calculator.ts:1`
  - Issue: Utility-level comments are better than average, but the same clarity is not present in the more important academic workflow endpoints.
  - Recommendation: keep comments focused on domain rules rather than CRUD labels.

## 9. Testing Coverage

- Severity: High
  - Location: `src/lib/server/validation.test.ts`, `src/lib/utils/grade-calculator.test.ts`
  - Issue: Automated tests only cover validation helpers and grade utilities.
  - Recommendation: add API integration tests for enrollment conflicts, KRS workflow, semester activation, and grade updates.

- Severity: High
  - Location: `.github/workflows/`
  - Issue: There is no CI workflow to run checks, tests, or builds on commit.
  - Recommendation: add CI for `npm run check`, `npm run test`, and `npm run build`.

- Severity: Medium
  - Location: repository root
  - Issue: There is no Playwright, Vitest, or equivalent E2E/browser setup for critical user flows.
  - Recommendation: add at least one end-to-end suite covering auth gate, KRS, enrollment conflict detection, and grade entry.

## 10. Deployment Readiness

- Severity: High
  - Location: `svelte.config.js:1`
  - Issue: `@sveltejs/adapter-auto` is still configured, and the production build confirms that no supported hosting target is selected.
  - Recommendation: choose and configure a real deployment adapter before production rollout.

- Severity: Medium
  - Location: `src/lib/server/prisma.ts:9`, `src/hooks.server.ts:21`, `.env.example:1`
  - Issue: Environment variables are required, but there is no startup validation layer, secrets policy, or deployment checklist.
  - Recommendation: add env validation and deployment documentation for database, auth, and adapter-specific config.

- Severity: Medium
  - Location: `README.md:21`, repository root
  - Issue: There is no documented preview, release, rollback, or migration sequence for production deployment.
  - Recommendation: document a release procedure before the project is treated as production-ready.

## Overall Assessment

The repository is a competent academic CRUD foundation with:

- good shared validation and HTTP utilities
- solid enrollment conflict detection
- a consistent admin shell and reusable form/modal components
- passing type checks, tests, and build output

The largest gap is not technical correctness at the CRUD level. The largest gap is domain cohesion. The case study describes one integrated academic system, but the current implementation behaves as several adjacent modules:

- KRS is not the source of actual class participation
- room scheduling is only partially modeled in working flows
- grades and GPA are not fully synchronized with enrollment lifecycle
- auth does not reflect academic stakeholders

## Readiness Score

`5.5 / 10`

## Prioritized Action List

1. Introduce a real class-offering model and make approved KRS generate actual enrollments with room, schedule, lecturer, and semester bindings.
2. Make GPA/IPK authoritative by deriving it consistently or updating it transactionally whenever grades and completion states change.
3. Move page data loading to SvelteKit `load` and make search, sort, and filter controls work end-to-end through URL state and API parameters.
4. Replace shared Basic Auth with real authentication and role-based authorization for admin staff, lecturers, students, and academic leadership.
5. Add Prisma migrations, CI, and API/E2E test coverage so the system is deployable with confidence.
