<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import MobileCollection from '$lib/components/MobileCollection.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import DosenForm from '$lib/components/forms/DosenForm.svelte';
	import { dosenService } from '$lib/api/services/dosen';
	import { describeRequestFailure } from '$lib/utils/request-notice';
	import { programStudiService } from '$lib/api/services/programStudi';
	import type { Dosen, DosenFormData, ProgramStudi } from '$lib/types';

	type NoticeTone = 'success' | 'error' | 'warning' | 'info';

	interface Notice {
		tone: NoticeTone;
		title: string;
		description?: string;
	}

	type FormNotice = Omit<Notice, 'tone'> & {
		tone: Exclude<NoticeTone, 'success'>;
	};

	// Helper to narrow shared describeRequestFailure return type for form contexts
	function describeFormRequestFailure(
		err: unknown,
		fallbackTitle: string,
		fallbackDescription: string
	): FormNotice {
		return describeRequestFailure(err, fallbackTitle, fallbackDescription) as FormNotice;
	}

	type FormErrors = Partial<Record<keyof DosenFormData, string>>;

	let data = $state<Dosen[]>([]);
	let programs = $state<ProgramStudi[]>([]);
	let loading = $state(false);
	let error = $state('');
	let searchQuery = $state('');
	let filterProgram = $state<number | ''>('');
	let formErrors = $state<FormErrors>({});
	let formNotice = $state<FormNotice | null>(null);
	let pageNotice = $state<Notice | null>(null);
	let deleteNotice = $state<Notice | null>(null);
	let deleteTarget = $state<Dosen | null>(null);

	let pagination = $state({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0
	});

	let isModalOpen = $state(false);
	let editingData = $state<Dosen | undefined>(undefined);
	let formLoading = $state(false);
	let deleteLoading = $state<number | null>(null);

	const columns = [
		{ field: 'nip', header: 'NIP', sortable: true },
		{ field: 'nama', header: 'Nama', sortable: true },
		{ field: 'programStudi.nama', header: 'Program Studi', sortable: false },
		{ field: 'jabatan', header: 'Jabatan', sortable: true },
		{ field: 'email', header: 'Email', sortable: false }
	];

	const hasActiveFilters = $derived(Boolean(searchQuery.trim()) || filterProgram !== '');
	const selectedProgramName = $derived(
		filterProgram === '' ? '' : programs.find((program) => program.id === filterProgram)?.nama ?? 'program studi terpilih'
	);

	function noticeClass(tone: NoticeTone) {
		switch (tone) {
			case 'success':
				return 'alert-success';
			case 'warning':
				return 'alert-warning';
			case 'info':
				return 'alert-info';
			default:
				return 'alert-error';
		}
	}

	function dismissPageNotice() {
		pageNotice = null;
	}

	function programStudiLabel(item: Dosen) {
		return item.programStudi?.nama || 'Program studi belum tercatat';
	}

	function clearFormFeedback() {
		formErrors = {};
		formNotice = null;
	}

	function openCreate() {
		editingData = undefined;
		clearFormFeedback();
		isModalOpen = true;
	}

	function openEdit(item: Dosen) {
		editingData = item;
		clearFormFeedback();
		isModalOpen = true;
	}

	function closeFormModal(force = false) {
		if (formLoading && !force) return;

		isModalOpen = false;
		editingData = undefined;
		clearFormFeedback();
	}

	function openDeleteDialog(item: Dosen) {
		deleteTarget = item;
		deleteNotice = null;
	}

	function closeDeleteDialog(force = false) {
		if (deleteLoading !== null && !force) return;

		deleteTarget = null;
		deleteNotice = null;
	}

	function normalizeFormData(formData: DosenFormData): DosenFormData {
		return {
			nip: formData.nip.trim(),
			nama: formData.nama.trim(),
			email: formData.email.trim().toLowerCase(),
			programStudiId: formData.programStudiId,
			jabatan: formData.jabatan.trim()
		};
	}

	function validateForm(formData: DosenFormData): FormErrors {
		const errors: FormErrors = {};

		if (!formData.nip.trim()) {
			errors.nip = 'Isi NIP dosen terlebih dahulu.';
		} else if (formData.nip.trim().length > 20) {
			errors.nip = 'NIP maksimal 20 karakter.';
		}

		if (!formData.nama.trim()) {
			errors.nama = 'Isi nama lengkap dosen.';
		} else if (formData.nama.trim().length > 100) {
			errors.nama = 'Nama lengkap maksimal 100 karakter.';
		}

		if (!formData.email.trim()) {
			errors.email = 'Isi email dosen.';
		} else if (formData.email.trim().length > 100) {
			errors.email = 'Email maksimal 100 karakter.';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
			errors.email = 'Gunakan alamat email yang valid.';
		}

		if (!Number.isInteger(formData.programStudiId) || formData.programStudiId < 1) {
			errors.programStudiId = 'Pilih program studi dosen.';
		}

		if (!formData.jabatan.trim()) {
			errors.jabatan = 'Isi jabatan dosen.';
		} else if (formData.jabatan.trim().length > 50) {
			errors.jabatan = 'Jabatan maksimal 50 karakter.';
		}

		return errors;
	}

	function applyFormError(message: string, errors: FormErrors = {}) {
		formErrors = errors;
		formNotice = {
			tone: 'error',
			title: editingData ? 'Perubahan belum bisa disimpan.' : 'Dosen baru belum bisa disimpan.',
			description: message
		};
	}

	function handleServerFormError(message: string) {
		const normalized = message.trim().toLowerCase();

		if (normalized === 'nip is required') {
			applyFormError('Lengkapi NIP dosen sebelum menyimpan data.', {
				nip: 'Isi NIP dosen terlebih dahulu.'
			});
			return;
		}

		if (normalized === 'nama is required') {
			applyFormError('Nama lengkap dosen masih kosong.', {
				nama: 'Isi nama lengkap dosen.'
			});
			return;
		}

		if (normalized === 'email is required') {
			applyFormError('Email dosen masih kosong.', {
				email: 'Isi email dosen.'
			});
			return;
		}

		if (normalized === 'email is invalid') {
			applyFormError('Gunakan alamat email institusi dengan format yang valid.', {
				email: 'Gunakan alamat email yang valid.'
			});
			return;
		}

		if (
			normalized === 'programstudiid must be an integer' ||
			normalized === 'programstudiid must be at least 1'
		) {
			applyFormError('Pilih program studi dosen sebelum menyimpan.', {
				programStudiId: 'Pilih program studi dosen.'
			});
			return;
		}

		if (normalized === 'jabatan is required') {
			applyFormError('Jabatan dosen masih kosong.', {
				jabatan: 'Isi jabatan dosen.'
			});
			return;
		}

		if (normalized === 'nip or email already exists') {
			applyFormError('NIP atau email ini sudah terdaftar pada data dosen lain.', {
				nip: 'Periksa kembali NIP agar tidak sama dengan data lain.',
				email: 'Gunakan email dosen yang belum terdaftar.'
			});
			return;
		}

		applyFormError('Periksa kembali isian dosen, lalu simpan kembali setelah datanya sudah lengkap.');
	}

	function describeDeleteError(message: string): FormNotice {
		const normalized = message.trim().toLowerCase();

		if (normalized === 'dosen not found') {
			return {
				tone: 'info',
				title: 'Data dosen ini sudah tidak ada pada daftar saat ini.',
				description: 'Muat ulang halaman untuk menampilkan data terbaru.'
			};
		}

		if (normalized === 'cannot delete dosen with related records') {
			return {
				tone: 'warning',
				title: 'Data dosen ini masih dipakai pada modul lain.',
				description: 'Pindahkan atau hapus data terkait terlebih dahulu sebelum menghapus dosen ini.'
			};
		}

		return {
			tone: 'error',
			title: 'Data dosen belum dapat dihapus.',
			description: 'Coba lagi dalam beberapa saat atau periksa keterkaitan data dosen ini.'
		};
	}

	async function loadData() {
		loading = true;
		error = '';

		try {
			const response = await dosenService.getAll({
				page: pagination.page,
				limit: pagination.limit,
				search: searchQuery.trim() || undefined,
				programStudiId: filterProgram || undefined
			});

		if (response.success) {
			data = response.data;
			pagination = response.pagination;
			return;
		}

			error = response.error || 'Daftar dosen belum dapat dimuat.';
		} catch (requestError) {
			error = describeRequestFailure(
				requestError,
				'Daftar dosen belum dapat dimuat.',
				'Coba lagi dalam beberapa saat.'
			).description || 'Coba lagi dalam beberapa saat.';
		} finally {
			loading = false;
		}
	}

	async function loadPrograms() {
		try {
			const response = await programStudiService.getAll({ limit: 100 });
			if (response.success) {
				programs = response.data;
			}
		} catch (requestError) {
			console.error('Failed to load programs', requestError);
		}
	}

	function handlePageChange(page: number) {
		pagination.page = page;
		void loadData();
	}

	function handleSearch(query: string) {
		searchQuery = query;
		pagination.page = 1;
		void loadData();
	}

	function clearFilters() {
		searchQuery = '';
		filterProgram = '';
		pagination.page = 1;
		void loadData();
	}

	async function handleSubmit(formData: DosenFormData) {
		clearFormFeedback();

		const normalizedData = normalizeFormData(formData);
		const validationErrors = validateForm(normalizedData);

		if (Object.keys(validationErrors).length > 0) {
			formErrors = validationErrors;
			formNotice = {
				tone: 'warning',
				title: 'Periksa kembali isian dosen.',
				description: 'Lengkapi semua kolom wajib sebelum menyimpan perubahan.'
			};
			return;
		}

		formLoading = true;

		try {
			const response = editingData
				? await dosenService.update(editingData.id, normalizedData)
				: await dosenService.create(normalizedData);

			if (response.success) {
				const savedName = normalizedData.nama;
				closeFormModal(true);
				pageNotice = {
					tone: 'success',
					title: editingData ? `Data dosen ${savedName} telah diperbarui.` : `Data dosen ${savedName} telah ditambahkan.`,
					description: 'Perubahan sudah tersimpan dan dapat dipakai pada modul akademik terkait.'
				};
				await loadData();
				return;
			}

			handleServerFormError(response.error || 'Terjadi kesalahan saat menyimpan data dosen.');
		} catch (requestError) {
			formNotice = describeFormRequestFailure(
				requestError,
				editingData ? 'Perubahan data dosen belum tersimpan.' : 'Data dosen baru belum tersimpan.',
				'Coba lagi dalam beberapa saat.'
			);
		} finally {
			formLoading = false;
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;

		const currentTarget = deleteTarget;
		deleteLoading = currentTarget.id;
		deleteNotice = null;

		try {
			const response = await dosenService.delete(currentTarget.id);

			if (response.success) {
				if (data.length === 1 && pagination.page > 1) {
					pagination.page -= 1;
				}

				closeDeleteDialog(true);
				pageNotice = {
					tone: 'success',
					title: `Data dosen ${currentTarget.nama} telah dihapus dari daftar.`,
					description: 'Perubahan sudah diterapkan pada daftar dosen di halaman ini.'
				};
				await loadData();
				return;
			}

			deleteNotice = describeDeleteError(response.error || 'Data dosen belum berhasil dihapus.');
		} catch (requestError) {
			deleteNotice = describeFormRequestFailure(
				requestError,
				'Data dosen belum berhasil dihapus.',
				'Coba lagi dalam beberapa saat.'
			);
		} finally {
			deleteLoading = null;
		}
	}

	onMount(() => {
		void loadData();
		void loadPrograms();
	});
</script>

<svelte:head>
	<title>Dosen - Sistem Akademik</title>
</svelte:head>

{#snippet dosenEmptyState()}
	<div class="flex flex-col items-center gap-3 py-2 text-center">
		<h2 class="text-base font-semibold text-base-content">
			{hasActiveFilters ? 'Pencarian tidak menemukan dosen.' : 'Belum ada data dosen.'}
		</h2>
		<p class="max-w-xl text-sm text-muted text-pretty">
			{#if hasActiveFilters}
				Tidak ada data dosen
				{#if searchQuery.trim()}
					 dengan kata kunci <span class="font-medium text-base-content">&quot;{searchQuery.trim()}&quot;</span>
				{/if}
				{#if selectedProgramName}
					 pada <span class="font-medium text-base-content">{selectedProgramName}</span>
				{/if}
				. Ubah filter pencarian atau kembali ke seluruh daftar dosen.
			{:else}
				Tambahkan data dosen pertama agar penjadwalan, enrollment, dan penilaian dapat langsung terhubung ke pengampu mata kuliah.
			{/if}
		</p>
		<div class="flex flex-wrap justify-center gap-2">
			{#if hasActiveFilters}
				<button type="button" class="btn btn-sm btn-ghost" onclick={clearFilters}>
					Bersihkan pencarian
				</button>
			{:else}
				<button type="button" class="btn btn-sm btn-primary" onclick={openCreate}>
					Tambah data dosen pertama
				</button>
			{/if}
		</div>
	</div>
{/snippet}

<div class="space-y-5">
	<PageHeader
		title="Dosen"
		description="Kelola data dosen, email institusi, dan keterkaitan program studi."
		actionLabel="Tambah Dosen"
		onAction={openCreate}
		actionDisabled={formLoading || deleteLoading !== null}
	/>

	<div class="sr-only" aria-live="polite">
		{pageNotice?.title} {pageNotice?.description}
	</div>

	{#if pageNotice}
		<div class="alert {noticeClass(pageNotice.tone)}" role={pageNotice.tone === 'error' ? 'alert' : 'status'}>
			<div class="space-y-1">
				<div class="font-medium">{pageNotice.title}</div>
				{#if pageNotice.description}
					<div class="text-sm">{pageNotice.description}</div>
				{/if}
			</div>
			<button type="button" class="btn btn-sm btn-ghost" onclick={dismissPageNotice}>Tutup</button>
		</div>
	{/if}

	{#if error}
		<div class="alert alert-error" role="alert">
			<div class="space-y-1">
				<div class="font-medium">Daftar dosen belum dapat dimuat.</div>
				<div class="text-sm">{error}</div>
			</div>
			<button class="btn btn-sm btn-ghost" onclick={loadData}>Muat ulang daftar</button>
		</div>
	{/if}

	<div class="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
		<div class="w-full lg:max-w-md lg:flex-1">
			<SearchInput
				bind:value={searchQuery}
				label="Cari dosen"
				ariaLabel="Cari dosen berdasarkan nama atau NIP"
				loading={loading}
				placeholder="Nama atau NIP dosen"
				onSearch={handleSearch}
			/>
		</div>
		<label class="w-full space-y-2 sm:w-auto">
			<span class="block text-sm font-medium text-base-content">Program studi</span>
			<select
				class="select select-bordered w-full sm:min-w-56"
				bind:value={filterProgram}
				onchange={() => {
					pagination.page = 1;
					void loadData();
				}}
				aria-label="Filter program studi dosen"
			>
				<option value="">Semua Program Studi</option>
				{#each programs as p}
					<option value={p.id}>{p.nama}</option>
				{/each}
			</select>
		</label>
	</div>

	<MobileCollection
		items={data}
		{pagination}
		{loading}
		itemLabelPlural="dosen"
		loadingMessage="Memuat daftar dosen..."
		emptyState={dosenEmptyState}
		onPageChange={handlePageChange}
	>
		{#snippet item(row: Dosen)}
			<article class="card-elevated p-4 sm:p-5">
				<div class="space-y-1">
					<h2 class="text-lg font-display font-semibold text-balance">{row.nama}</h2>
					<p class="text-sm text-muted">NIP {row.nip}</p>
					<p class="break-all text-sm text-muted">{row.email}</p>
				</div>

				<dl class="mt-4 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto,1fr]">
					<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Program studi</dt>
					<dd class="font-medium text-base-content">{programStudiLabel(row)}</dd>
					<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Jabatan</dt>
					<dd class="font-medium text-base-content">{row.jabatan}</dd>
				</dl>

				<div class="mt-4 flex flex-col gap-2 sm:flex-row">
					<button
						class="btn btn-outline btn-sm sm:flex-1"
						onclick={() => openEdit(row)}
						disabled={deleteLoading === row.id || formLoading}
					>
						Ubah data
					</button>
					<button
						class="btn btn-error btn-outline btn-sm sm:flex-1"
						onclick={() => openDeleteDialog(row)}
						disabled={deleteLoading === row.id || formLoading}
					>
						{#if deleteLoading === row.id}
							<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
						{/if}
						Hapus data
					</button>
				</div>
			</article>
		{/snippet}
	</MobileCollection>

	<div class="hidden lg:block">
		<DataTable
			{columns}
			{data}
			{pagination}
			{loading}
			ariaLabel="Daftar dosen"
			loadingMessage="Memuat daftar dosen..."
			emptyState={dosenEmptyState}
			desktopOnly
			onPageChange={handlePageChange}
		>
			{#snippet actions(row: Dosen)}
				<button
					class="btn btn-sm btn-ghost"
				aria-label="Ubah data dosen"
				onclick={() => openEdit(row)}
				disabled={deleteLoading === row.id || formLoading}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
				</button>
				<button
					class="btn btn-sm btn-error btn-ghost"
					aria-label="Hapus data dosen"
					onclick={() => openDeleteDialog(row)}
					disabled={deleteLoading === row.id || formLoading}
				>
					{#if deleteLoading === row.id}
						<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					{/if}
				</button>
			{/snippet}
		</DataTable>
	</div>
</div>

<Modal
	open={isModalOpen}
	title={editingData ? 'Ubah Data Dosen' : 'Tambah Data Dosen'}
	onClose={() => closeFormModal()}
	size="md"
>
	<DosenForm
		data={editingData}
		onSubmit={handleSubmit}
		onCancel={() => closeFormModal()}
		loading={formLoading}
		errors={formErrors}
		formNotice={formNotice}
	/>
</Modal>

<Modal
	open={Boolean(deleteTarget)}
	title="Hapus Data Dosen"
	onClose={deleteLoading === deleteTarget?.id ? undefined : () => closeDeleteDialog()}
	size="sm"
>
	{#if deleteTarget}
		<div class="space-y-4">
			{#if deleteNotice}
				<div class="alert {noticeClass(deleteNotice.tone)}" role={deleteNotice.tone === 'error' ? 'alert' : 'status'}>
					<div class="space-y-1">
						<div class="font-medium">{deleteNotice.title}</div>
						{#if deleteNotice.description}
							<div class="text-sm">{deleteNotice.description}</div>
						{/if}
					</div>
				</div>
			{/if}

			<div class="space-y-3 text-sm leading-6 text-base-content">
				<p>
					Anda akan menghapus data dosen atas nama <span class="font-semibold">{deleteTarget.nama}</span> dari daftar dosen.
					Jika data ini masih terhubung ke jadwal, enrollment, atau modul akademik lain, sistem akan menolak penghapusan.
				</p>

				<div class="rounded-lg border border-base-300/70 bg-base-200 p-4">
					<div class="font-medium text-base-content">{deleteTarget.nama}</div>
					<div class="mt-1 text-muted">{deleteTarget.nip} - {deleteTarget.email}</div>
					<div class="mt-1 text-muted">{deleteTarget.programStudi?.nama || 'Program studi belum terbaca'}</div>
				</div>

				<p class="text-muted">
					Tindakan ini tidak dapat dibatalkan dari halaman ini.
				</p>
			</div>
		</div>
	{/if}

	{#snippet footer()}
		<button type="button" class="btn btn-ghost" onclick={() => closeDeleteDialog()} disabled={deleteLoading === deleteTarget?.id}>
			Batal
		</button>
		<button type="button" class="btn btn-error" onclick={confirmDelete} disabled={deleteLoading === deleteTarget?.id}>
			{#if deleteLoading === deleteTarget?.id}
				<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			{/if}
			Hapus data dosen
		</button>
	{/snippet}
</Modal>
