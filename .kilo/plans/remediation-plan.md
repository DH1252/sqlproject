# Comprehensive Remediation Plan - Sistem Informasi Akademik

## Executive Summary

This plan addresses **5 critical issues** preventing the application from functioning correctly, ranked by severity and impact. The total estimated fix time is **2-3 hours**.

---

## Priority Matrix

| Priority | Issue | Severity | Impact | Est. Time |
|----------|-------|----------|--------|-----------|
| P0 | Missing Prisma DATABASE_URL | Critical | Build fails | 5 min |
| P0 | Missing API endpoints | Critical | App crashes | 20 min |
| P1 | Prisma type error in dosen API | High | Type check fails | 10 min |
| P2 | Accessibility warnings | Medium | UX/compliance | 45 min |
| P3 | Svelte state warnings | Low | Dev experience | 30 min |

---

## Issue #1: Missing Prisma DATABASE_URL (P0 - Critical)

### Root Cause Analysis
The Prisma schema (`prisma/schema.prisma`) datasource block is missing the `url` property:

```prisma
datasource db {
  provider = "mysql"
  // Missing: url = env("DATABASE_URL")
}
```

This causes:
1. Prisma client cannot be generated
2. Build process fails with `PrismaClientInitializationError`
3. No database connection possible

### Solution

**File**: `prisma/schema.prisma`

**Step 1**: Add url to datasource block
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

**Step 2**: Regenerate Prisma client
```bash
npx prisma generate
```

**Step 3**: Push schema to database
```bash
npx prisma db push
```

### Verification
```bash
npm run check  # Should not show Prisma errors
npm run build  # Should complete successfully
```

### Risks
- Database must be running (MySQL on localhost:3306)
- `sqlproject` database must exist

---

## Issue #2: Missing API Endpoints (P0 - Critical)

### Root Cause Analysis
The frontend calls two API endpoints that don't exist:

1. **`GET /api/semester/active`** - Called by `semesterService.getActive()` in dashboard
2. **`PUT /api/semester/[id]/activate`** - Called by `semesterService.activate()` in semester page

These endpoints are referenced in:
- `src/lib/api/services/semester.ts:15-17`
- `src/lib/api/services/semester.ts:31-33`
- `src/routes/+page.svelte` (dashboard)
- `src/routes/semester/+page.svelte` (activate button)

### Solution

**Step 1**: Create `/api/semester/active/+server.ts`
```typescript
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async () => {
	try {
		const semester = await prisma.semester.findFirst({
			where: { isActive: true }
		});

		if (!semester) {
			return json({ success: false, error: 'No active semester found' }, { status: 404 });
		}

		return json({ success: true, data: semester });
	} catch (error) {
		console.error('Error fetching active semester:', error);
		return json({ success: false, error: 'Failed to fetch active semester' }, { status: 500 });
	}
};
```

**Step 2**: Create `/api/semester/[id]/activate/+server.ts`
```typescript
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const PUT: RequestHandler = async ({ params }) => {
	try {
		const id = parseInt(params.id!);

		if (isNaN(id)) {
			return json({ success: false, error: 'Invalid ID' }, { status: 400 });
		}

		// Deactivate all other semesters
		await prisma.semester.updateMany({
			where: { isActive: true },
			data: { isActive: false }
		});

		// Activate the selected semester
		const semester = await prisma.semester.update({
			where: { id },
			data: { isActive: true }
		});

		return json({ success: true, data: semester });
	} catch (error: any) {
		console.error('Error activating semester:', error);
		if (error.code === 'P2025') {
			return json({ success: false, error: 'Semester not found' }, { status: 404 });
		}
		return json({ success: false, error: 'Failed to activate semester' }, { status: 500 });
	}
};
```

### Verification
```bash
# After starting dev server
curl http://localhost:5173/api/semester/active
# Should return active semester or 404
```

### Risks
- None - straightforward CRUD operations

---

## Issue #3: Prisma Type Error in Dosen API (P1 - High)

### Root Cause Analysis
**File**: `src/routes/api/dosen/[id]/+server.ts:27`

The `_count` property is incorrectly nested inside `enrollments.include`:

```typescript
enrollments: {
	include: {
		mataKuliah: { select: { ... } },
		semester: { select: { ... } },
		_count: { select: { mahasiswa: true } }  // ERROR: Invalid nesting
	}
}
```

In Prisma, `_count` must be at the relation level, not nested inside `include`. The Enrollment model doesn't have a relation called `mahasiswa` that can be counted this way.

### Solution

**Option A** (Recommended): Remove the invalid `_count`
```typescript
enrollments: {
	include: {
		mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
		semester: { select: { id: true, tahunAjaran: true, semester: true } }
	}
}
```

**Option B**: Count at Dosen level
```typescript
const dosen = await prisma.dosen.findUnique({
	where: { id },
	include: {
		programStudi: { select: { id: true, kode: true, nama: true, jenjang: true } },
		enrollments: {
			include: {
				mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
				semester: { select: { id: true, tahunAjaran: true, semester: true } }
			}
		},
		_count: {
			select: { enrollments: true }
		}
	}
});
```

### Verification
```bash
npm run check
# Should show 0 errors
```

### Risks
- Minor: Frontend may need adjustment if it relies on `_count`

---

## Issue #4: Accessibility Warnings (P2 - Medium)

### Root Cause Analysis
67 accessibility warnings across 25 files:

| Warning Type | Count | Files Affected |
|--------------|-------|----------------|
| Missing aria-label on buttons | 22 | All page action buttons |
| Missing href on links | 3 | TopBar.svelte dropdown |
| Form label not associated | 1 | EntityForm.svelte |
| Click handler without ARIA role | 4 | Modal.svelte, AppShell.svelte |

### Solution

**Step 1**: Add aria-labels to action buttons (all page files)

Before:
```svelte
<button class="btn btn-sm btn-ghost" onclick={() => openEdit(row)}>
	<svg>...</svg>
</button>
```

After:
```svelte
<button class="btn btn-sm btn-ghost" onclick={() => openEdit(row)} aria-label="Edit">
	<svg>...</svg>
</button>
```

**Step 2**: Fix TopBar.svelte dropdown links
```svelte
<ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-4">
	<li><a href="/profile">Profile</a></li>
	<li><a href="/settings">Settings</a></li>
	<div class="divider my-1"></div>
	<li><a href="/logout" class="text-error">Logout</a></li>
</ul>
```

**Step 3**: Fix EntityForm.svelte error labels
```svelte
{#if errors[field.name]}
	<div class="label">
		<span class="label-text-alt text-error" id="{field.name}-error">
			{errors[field.name]}
		</span>
	</div>
{/if}
```

**Step 4**: Add role to Modal and AppShell overlay
```svelte
<div class="fixed inset-0 z-50 flex items-center justify-center" 
     onclick={handleBackdropClick}
     role="dialog"
     aria-modal="true">
```

### Verification
```bash
npm run check 2>&1 | grep "Warn:" | wc -l
# Should be significantly reduced
```

### Estimated Time
- 45 minutes total (automated find-replace possible)

---

## Issue #5: Svelte 5 State Reference Warnings (P3 - Low)

### Root Cause Analysis
The warning "This reference only captures the initial value of `data`" appears in all form components. This is because:

```typescript
let formData = $state<DosenFormData>({
	nip: data?.nip || '',  // 'data' captured at init only
	...
});
```

### Analysis
**This is NOT a bug** - it's expected behavior:
1. Forms are opened in modals with new data each time
2. When modal opens, component is created fresh with new props
3. The initial value capture is exactly what we want
4. The warning is a false positive for this use case

### Solution
Add Svelte-ignore comments to suppress warnings:

```typescript
// svelte-ignore state_referenced_locally
let formData = $state<DosenFormData>({
	nip: data?.nip || '',
	...
});
```

OR use `$derived` pattern if truly reactive forms needed:
```typescript
let formData = $derived({
	nip: data?.nip || '',
	...
});
```

### Recommendation
**Leave as-is** - The warnings are informational only and don't affect functionality. Adding ignore comments adds noise. Only fix if form reactivity issues are observed.

---

## Additional Findings

### Potential Issue: Missing Error Handling in API Client

**File**: `src/lib/api/client.ts`

The API client doesn't handle network errors gracefully:

```typescript
async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
	}
	return response.json();
}
```

**Recommendation**: Add timeout and retry logic for production.

### Potential Issue: No Database Seeding

The database needs initial data for:
- Active semester
- Program studi entries
- Sample data for testing

**File exists**: `prisma/seed.ts`
**Command**: `npm run db:seed`

---

## Implementation Timeline

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| **Phase 1** | Fix Prisma schema | 5 min | None |
| **Phase 2** | Create missing API endpoints | 20 min | Phase 1 |
| **Phase 3** | Fix dosen type error | 10 min | None |
| **Phase 4** | Fix accessibility issues | 45 min | None |
| **Phase 5** | Test & verify | 15 min | All phases |
| **Total** | | **1.5 - 2 hours** | |

---

## Success Metrics

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Type check errors | 0 | `npm run check` |
| Build success | ✓ | `npm run build` |
| Dev server start | ✓ | `npm run dev` |
| API endpoints working | All return data | Manual testing |
| Accessibility warnings | < 10 | `npm run check` |

---

## Pre-Implementation Checklist

- [ ] MySQL server running on localhost:3306
- [ ] Database `sqlproject` exists
- [ ] Node.js 20.19+ or 22.12+ available
- [ ] All dependencies installed (`npm install`)

---

## Files to Modify

### Must Modify (Blocking Issues)
1. `prisma/schema.prisma` - Add url to datasource
2. `src/routes/api/dosen/[id]/+server.ts` - Fix _count placement

### Must Create (Missing Endpoints)
3. `src/routes/api/semester/active/+server.ts` - New file
4. `src/routes/api/semester/[id]/activate/+server.ts` - New file

### Should Modify (Accessibility)
5. `src/lib/components/layout/TopBar.svelte` - Fix dropdown links
6. `src/lib/components/Modal.svelte` - Add role attribute
7. `src/lib/components/layout/AppShell.svelte` - Add role attribute
8. All page `+page.svelte` files - Add aria-labels

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Database connection fails | Medium | High | Ensure MySQL running, check .env |
| Type errors after fixes | Low | Medium | Run `npm run check` frequently |
| Breaking changes in API | Low | High | Test each endpoint after modification |
| Accessibility regression | Low | Low | Use automated a11y testing |

---

## Post-Implementation Verification

### Automated Checks
```bash
# Type checking
npm run check

# Build
npm run build

# Dev server
npm run dev
```

### Manual Checks
1. Navigate to `/` - Dashboard should load
2. Navigate to `/semester` - List should display
3. Click "Aktifkan" button - Semester should activate
4. Navigate to `/dosen` - List should display
5. All CRUD operations should work

---

## Conclusion

The application has **2 critical blocking issues** (Prisma config and missing endpoints) that prevent it from running. Once these are fixed, the application will be functional. Accessibility fixes are recommended for production compliance but not blocking.
