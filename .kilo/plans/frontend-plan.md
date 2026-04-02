# Frontend Implementation Plan - Sistem Informasi Akademik

## Overview

Building a comprehensive frontend for the Academic Information System using SvelteKit 5, TailwindCSS v4, and DaisyUI v5. The frontend will provide an intuitive interface for managing all academic entities.

---

## Design System

### Color Palette (DaisyUI)
- **Primary**: Primary blue for main actions and navigation
- **Secondary**: Gray for secondary elements
- **Accent**: Green for success states
- **Error**: Red for error states
- **Warning**: Yellow for warning states
- **Info**: Blue for informational states
- **Background**: Base-100 (light) / Dark mode support

### Typography
- **Font**: System font stack (Inter recommended)
- **Headings**: font-bold with proper hierarchy
- **Body**: text-base for readability

### Layout Structure
- **Sidebar Navigation**: Collapsible, icons + labels
- **Top Header**: User profile, notifications, breadcrumbs
- **Main Content**: Responsive container with proper spacing
- **Footer**: Minimal, copyright info

---

## Page Structure

### 1. Layout Components

#### AppShell (`src/lib/components/layout/AppShell.svelte`)
- Sidebar navigation
- Top header bar
- Main content area
- Responsive mobile drawer

#### Sidebar (`src/lib/components/layout/Sidebar.svelte`)
Navigation menu with sections:
- **Dashboard** (Home)
- **Master Data**
  - Program Studi
  - Mahasiswa
  - Dosen
  - Mata Kuliah
  - Ruang Kelas
- **Academic**
  - Semester
  - Jadwal
  - Enrollment
- **Academic Records**
  - Nilai
  - KRS

#### TopBar (`src/lib/components/layout/TopBar.svelte`)
- Page title / Breadcrumbs
- Search bar (global)
- User dropdown menu
- Notification bell

---

### 2. Shared Components

#### DataTable (`src/lib/components/DataTable.svelte`)
Features:
- Sortable columns
- Pagination
- Row selection (checkboxes)
- Action buttons per row
- Empty state
- Loading skeleton

Props:
```typescript
interface DataTableProps {
  columns: ColumnDef[];
  data: any[];
  pagination: PaginationInfo;
  loading?: boolean;
  selectable?: boolean;
  onSort?: (field: string) => void;
  onPageChange?: (page: number) => void;
}
```

#### EntityForm (`src/lib/components/EntityForm.svelte`)
- Dynamic form generation from field config
- Validation support
- Loading state
- Error display
- Cancel/Submit actions

#### Modal (`src/lib/components/Modal.svelte`)
- Create/Edit entity modal
- Confirmation dialogs
- Size variants (sm, md, lg, xl)

#### SearchInput (`src/lib/components/SearchInput.svelte`)
- Debounced search
- Clear button
- Loading indicator

#### StatsCard (`src/lib/components/StatsCard.svelte`)
- Icon, title, value, change indicator
- Used on dashboard

---

### 3. Page Components

#### Dashboard (`src/routes/+page.svelte`)
Widgets:
- Total Mahasiswa (with trend)
- Total Dosen
- Total Mata Kuliah
- Ruang Kelas utilization
- Recent enrollments
- Active semester info

#### Program Studi List (`src/routes/program-studi/+page.svelte`)
- DataTable with columns: Kode, Nama, Jenjang, Actions
- Add button (opens modal)
- Edit/Delete actions
- Pagination

#### Program Studi Form (`src/lib/components/forms/ProgramStudiForm.svelte`)
Fields:
- Kode (text, required, unique)
- Nama (text, required)
- Jenjang (select: S1, S2, S3)

#### Mahasiswa List (`src/routes/mahasiswa/+page.svelte`)
- DataTable with: NIM, Nama, Program Studi, Angkatan, Status, IPK, Actions
- Filters: Program Studi, Angkatan, Status
- Search by NIM/Nama
- View detail modal (showing enrollments, KRS, nilai)

#### Mahasiswa Form (`src/lib/components/forms/MahasiswaForm.svelte`)
Fields:
- NIM (text, required)
- Nama (text, required)
- Email (email, required)
- Program Studi (async select)
- Angkatan (number)
- Status (select: ACTIVE, INACTIVE, GRADUATED)

#### Dosen List (`src/routes/dosen/+page.svelte`)
- DataTable with: NIP, Nama, Program Studi, Jabatan, Actions
- Search by NIP/Nama

#### Dosen Form (`src/lib/components/forms/DosenForm.svelte`)
Fields:
- NIP (text, required)
- Nama (text, required)
- Email (email, required)
- Program Studi (async select)
- Jabatan (text)

#### Mata Kuliah List (`src/routes/mata-kuliah/+page.svelte`)
- DataTable with: Kode, Nama, SKS, Semester, Program Studi, Actions
- Filter by Program Studi, Semester

#### Mata Kuliah Form (`src/lib/components/forms/MataKuliahForm.svelte`)
Fields:
- Kode (text, required)
- Nama (text, required)
- SKS (number, 1-6)
- Semester (number, 1-8)
- Program Studi (async select)
- Deskripsi (textarea)

#### Ruang Kelas List (`src/routes/ruang-kelas/+page.svelte`)
- DataTable with: Kode, Nama, Tipe, Kapasitas, Gedung, Lantai, Status, Actions
- Visual badges for tipe and status
- Filter by Tipe, Status, Gedung

#### Ruang Kelas Form (`src/lib/components/forms/RuangKelasForm.svelte`)
Fields:
- Kode (text, required)
- Nama (text, required)
- Tipe (select: REGULER, LAB_KOMPUTER, LAB_BAHASA, AUDITORIUM)
- Kapasitas (number)
- Has Proyektor (toggle)
- Has AC (toggle)
- Gedung (text)
- Lantai (number)
- Status (select: AVAILABLE, MAINTENANCE, UNAVAILABLE)

#### Ruang Kelas Detail (`src/routes/ruang-kelas/[id]/+page.svelte`)
- Room info card
- Jadwal penggunaan (schedule visualization)
- Utilization stats

#### Semester List (`src/routes/semester/+page.svelte`)
- DataTable with: Tahun Ajaran, Semester, Status, Actions
- Activate button for inactive semesters
- Visual indicator for active semester

#### Semester Form (`src/lib/components/forms/SemesterForm.svelte`)
Fields:
- Tahun Ajaran (text, format: YYYY/YYYY)
- Semester (select: GANJIL, GENAP)
- Is Active (toggle, warning if activating)

#### Jadwal List (`src/routes/jadwal/+page.svelte`)
- DataTable with: Hari, Jam Mulai, Jam Selesai, Actions
- Grouped by day for better readability

#### Jadwal Form (`src/lib/components/forms/JadwalForm.svelte`)
Fields:
- Hari (select: SENIN-MINGGU)
- Jam Mulai (time picker)
- Jam Selesai (time picker)
- Validation: jamSelesai > jamMulai

#### Enrollment List (`src/routes/enrollment/+page.svelte`)
- DataTable with: Mahasiswa, Mata Kuliah, Dosen, Ruang, Jadwal, Semester, Status, Actions
- Complex filters for all fields
- Check conflict action

#### Enrollment Form (`src/lib/components/forms/EnrollmentForm.svelte`)
Fields:
- Mahasiswa (async search select)
- Mata Kuliah (async search select)
- Dosen (async search select)
- Ruang Kelas (async search select)
- Jadwal (async search select)
- Semester (async select)
- Status (select: ACTIVE, COMPLETED, DROPPED)
- **Conflict warning** if schedule overlaps

#### Nilai List (`src/routes/nilai/+page.svelte`)
- DataTable with: Mahasiswa, Mata Kuliah, Tugas, UTS, UAS, Total, Huruf Mutu, Actions
- Filter by semester
- Export to CSV option

#### Nilai Form (`src/lib/components/forms/NilaiForm.svelte`)
Fields:
- Enrollment (searchable select)
- Nilai Tugas (number, 0-100)
- Nilai UTS (number, 0-100)
- Nilai UAS (number, 0-100)
- **Auto-calculated**: Nilai Total, Huruf Mutu

#### KRS List (`src/routes/krs/+page.svelte`)
- DataTable with: Mahasiswa, Semester, Status, Tanggal Submit, Actions
- Status badge with color coding
- View detail to see courses

#### KRS Form (`src/lib/components/forms/KRSForm.svelte`)
Fields:
- Mahasiswa (async search select)
- Semester (async select)
- Status (select: DRAFT, SUBMITTED, APPROVED, REJECTED)
- **Course selector**: Add/remove mata kuliah with SKS total

#### KRS Detail (`src/routes/krs/[id]/+page.svelte`)
- KRS info header
- List of selected courses with SKS
- Total SKS counter
- Actions: Submit, Approve, Reject, Add/Remove courses

---

## API Integration Layer

### API Client (`src/lib/api/client.ts`)
Centralized fetch with error handling:
```typescript
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>>
```

### Entity Services (`src/lib/api/services/`)
Each entity has a service file:
- `programStudi.ts`
- `mahasiswa.ts`
- `dosen.ts`
- `mataKuliah.ts`
- `ruangKelas.ts`
- `semester.ts`
- `jadwal.ts`
- `enrollment.ts`
- `nilai.ts`
- `krs.ts`

Each service exports:
- `getAll(params)` - List with pagination
- `getById(id)` - Single item
- `create(data)` - Create new
- `update(id, data)` - Update existing
- `delete(id)` - Delete item

### Types (`src/lib/types/`)
```typescript
// src/lib/types/index.ts
export interface ProgramStudi {
  id: number;
  kode: string;
  nama: string;
  jenjang: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

---

## State Management

### Svelte 5 Runes
Using runes for local state:
```typescript
let data = $state([]);
let loading = $state(false);
let searchQuery = $state('');
```

### Page State Pattern
Each page manages its own state with:
- Data fetching in `+page.ts` or component mount
- Loading states
- Error handling
- Form submission states

---

## Routes Structure

```
src/routes/
├── +page.svelte                    # Dashboard
├── +layout.svelte                  # App shell wrapper
├── program-studi/
│   ├── +page.svelte               # List
│   └── [id]/
│       └── +page.svelte           # Detail (optional)
├── mahasiswa/
│   ├── +page.svelte               # List
│   └── [id]/
│       └── +page.svelte           # Detail with tabs
├── dosen/
│   ├── +page.svelte               # List
│   └── [id]/
│       └── +page.svelte           # Detail
├── mata-kuliah/
│   ├── +page.svelte               # List
│   └── [id]/
│       └── +page.svelte           # Detail
├── ruang-kelas/
│   ├── +page.svelte               # List
│   └── [id]/
│       └── +page.svelte           # Detail with schedule
├── semester/
│   ├── +page.svelte               # List
│   └── [id]/
│       └── +page.svelte           # Detail
├── jadwal/
│   ├── +page.svelte               # List
│   └── [id]/
│       └── +page.svelte           # Detail
├── enrollment/
│   ├── +page.svelte               # List
│   └── [id]/
│       └── +page.svelte           # Detail
├── nilai/
│   ├── +page.svelte               # List
│   └── [id]/
│       └── +page.svelte           # Detail
└── krs/
    ├── +page.svelte               # List
    └── [id]/
        └── +page.svelte           # Detail with courses
```

---

## Implementation Priority

### Phase 1: Foundation (Core Setup)
1. Create layout components (AppShell, Sidebar, TopBar)
2. Create shared components (DataTable, Modal, EntityForm)
3. Set up API client and service layer
4. Create TypeScript types

### Phase 2: Master Data (CRUD Pages)
1. Program Studi (simplest entity)
2. Dosen
3. Mata Kuliah
4. Ruang Kelas
5. Mahasiswa

### Phase 3: Academic Setup
1. Semester
2. Jadwal

### Phase 4: Academic Operations
1. Enrollment (with conflict checking)
2. Nilai (with grade calculation)
3. KRS (with course selection)

### Phase 5: Dashboard & Polish
1. Dashboard with stats widgets
2. Search functionality
3. Responsive mobile layout
4. Dark mode support
5. Loading states and error handling

---

## Key Features

### 1. Smart Search
- Global search in top bar
- Entity-specific search with debouncing
- Search by name/code across entities

### 2. Schedule Visualization
- Calendar view for Ruang Kelas usage
- Weekly schedule grid
- Conflict highlighting

### 3. Grade Calculator
- Real-time grade calculation
- Visual grade indicator (color coded)
- IPK preview

### 4. KRS Workflow
- Drag-and-drop course selection
- SKS limit validation
- Visual status tracking

### 5. Data Export
- CSV export for all list pages
- Print-friendly layouts

---

## Technical Considerations

### Performance
- Pagination on all list pages
- Lazy loading for detail views
- Debounced search inputs
- Svelte 5 runes for reactive state

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management in modals

### Mobile Responsive
- Collapsible sidebar (drawer on mobile)
- Stacked table cards on small screens
- Touch-friendly button sizes

### Error Handling
- Toast notifications for actions
- Form validation errors inline
- Network error retry buttons
- 404 page for invalid IDs

---

## Component Examples

### DataTable Usage
```svelte
<DataTable
  columns={[
    { field: 'kode', header: 'Kode', sortable: true },
    { field: 'nama', header: 'Nama', sortable: true },
    { field: 'jenjang', header: 'Jenjang', badge: true },
    { field: 'actions', header: 'Actions', align: 'right' }
  ]}
  data={programs}
  {pagination}
  loading={$loading}
  onSort={handleSort}
  onPageChange={handlePageChange}
>
  {#snippet actions(row)}
    <button class="btn btn-sm btn-ghost" onclick={() => openEdit(row)}>
      Edit
    </button>
    <button class="btn btn-sm btn-error btn-ghost" onclick={() => confirmDelete(row)}>
      Delete
    </button>
  {/snippet}
</DataTable>
```

### Modal Form Pattern
```svelte
<Modal bind:open={isOpen} title={editing ? 'Edit' : 'Create'}>
  <EntityForm
    fields={formFields}
    bind:data={formData}
    onSubmit={handleSubmit}
    loading={submitting}
  />
</Modal>
```

---

## File Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.svelte
│   │   │   ├── Sidebar.svelte
│   │   │   └── TopBar.svelte
│   │   ├── forms/
│   │   │   ├── ProgramStudiForm.svelte
│   │   │   ├── MahasiswaForm.svelte
│   │   │   ├── DosenForm.svelte
│   │   │   ├── MataKuliahForm.svelte
│   │   │   ├── RuangKelasForm.svelte
│   │   │   ├── SemesterForm.svelte
│   │   │   ├── JadwalForm.svelte
│   │   │   ├── EnrollmentForm.svelte
│   │   │   ├── NilaiForm.svelte
│   │   │   └── KRSForm.svelte
│   │   ├── DataTable.svelte
│   │   ├── Modal.svelte
│   │   ├── EntityForm.svelte
│   │   ├── SearchInput.svelte
│   │   ├── StatsCard.svelte
│   │   └── Pagination.svelte
│   ├── api/
│   │   ├── client.ts
│   │   └── services/
│   │       ├── programStudi.ts
│   │       ├── mahasiswa.ts
│   │       ├── dosen.ts
│   │       ├── mataKuliah.ts
│   │       ├── ruangKelas.ts
│   │       ├── semester.ts
│   │       ├── jadwal.ts
│   │       ├── enrollment.ts
│   │       ├── nilai.ts
│   │       └── krs.ts
│   └── types/
│       └── index.ts
└── routes/
    └── (pages as defined above)
```

---

## Dependencies

Already installed:
- SvelteKit 5
- TailwindCSS v4
- DaisyUI v5

No additional dependencies required.

---

## Success Criteria

- [ ] All CRUD operations working for 10 entities
- [ ] Responsive layout (desktop, tablet, mobile)
- [ ] Consistent UI with DaisyUI components
- [ ] Loading states and error handling
- [ ] Search and pagination on all list pages
- [ ] Form validation with user feedback
- [ ] Dashboard with useful widgets
- [ ] Schedule conflict visualization
- [ ] Grade calculation display
- [ ] KRS workflow (Draft → Submitted → Approved/Rejected)
