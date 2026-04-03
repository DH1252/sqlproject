<script lang="ts">
	import { onMount } from 'svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import MobileCollection from '$lib/components/MobileCollection.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import NoticeBanner from '$lib/components/NoticeBanner.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import MahasiswaForm from '$lib/components/forms/MahasiswaForm.svelte';
	import { mahasiswaService } from '$lib/api/services/mahasiswa';
	import type { NoticeMessage } from '$lib/types/notice';
	import { formatAcademicLabel } from '$lib/utils/format-label';
	import { describeRequestFailure } from '$lib/utils/request-notice';
	import { getMahasiswaStatusChip } from '$lib/utils/status-chip';
	import type { Mahasiswa, MahasiswaFormData, ProgramStudi, StatusMahasiswa } from '$lib/types';

	let { data: pageData }: { data: import('./$types').PageData } = $props();

	// svelte-ignore state_referenced_locally
	let data = $state<Mahasiswa[]>(pageData.initialMahasiswa);
	// svelte-ignore state_referenced_locally
	let programs = $state<ProgramStudi[]>(pageData.initialPrograms);
	let loading = $state(false);
	let error = $state('');
	let searchQuery = $state('');
	let filterProgram = $state<number | ''>('');
	let filterStatus = $state<StatusMahasiswa | ''>('');
	let pageNotice = $state<NoticeMessage | null>(null);
	let formNotice = $state<NoticeMessage | null>(null);
	let deleteTarget = $state<Mahasiswa | null>(null);

	// svelte-ignore state_referenced_locally
	let pagination = $state(pageData.initialPagination);

	let isModalOpen = $state(false);
	let editingData = $state<Mahasiswa | undefined>(undefined);
	let formLoading = $state(false);
	let deleteLoading = $state<number | null>(null);

	async function loadData() {
		loading = true;
		error = '';
		try {
			const response = await mahasiswaService.getAll({
				page: pagination.page,
				limit: pagination.limit,
				search: searchQuery.trim() || undefined,
				programStudiId: filterProgram || undefined,
				status: filterStatus || undefined
			});
			if (response.success) {
				data = response.data;
				pagination = response.pagination;
			} else {
				error = response.error || 'Data belum berhasil dimuat.';
			}
		} catch (err) {
			error = 'Koneksi bermasalah. Coba lagi dalam beberapa saat.';
		} finally {
			loading = false;
		}
	}

	function handlePageChange(page: number) {
		pagination.page = page;
		loadData();
	}

	function handleSearch(query: string) {
		searchQuery = query;
		pagination.page = 1;
		loadData();
	}

	function openCreate() {
		editingData = undefined;
		formNotice = null;
		isModalOpen = true;
	}

	function openEdit(item: Mahasiswa) {
		editingData = item;
		formNotice = null;
		isModalOpen = true;
	}

	function closeFormModal(force = false) {
		if (formLoading && !force) return;

		isModalOpen = false;
		editingData = undefined;
		formNotice = null;
	}

	function openDeleteDialog(item: Mahasiswa) {
		deleteTarget = item;
	}

	function closeDeleteDialog(force = false) {
		if (deleteLoading !== null && !force) return;

		deleteTarget = null;
	}

	async function handleSubmit(formData: MahasiswaFormData) {
		formNotice = null;
		formLoading = true;
		try {
			if (editingData) {
				const response = await mahasiswaService.update(editingData.id, formData);
				if (response.success) {
					closeFormModal(true);
					pageNotice = {
						tone: 'success',
						title: `Data mahasiswa ${formData.nama} telah diperbarui.`,
						description: 'Perubahan sudah tersimpan pada daftar mahasiswa.'
					};
					await loadData();
				} else {
					formNotice = {
						tone: 'error',
						title: 'Perubahan data mahasiswa belum tersimpan.',
						description: response.error || 'Periksa kembali data mahasiswa lalu simpan lagi.'
					};
				}
			} else {
				const response = await mahasiswaService.create(formData);
				if (response.success) {
					closeFormModal(true);
					pageNotice = {
						tone: 'success',
						title: `Data mahasiswa ${formData.nama} telah ditambahkan.`,
						description: 'Mahasiswa baru sudah tersedia pada daftar akademik.'
					};
					await loadData();
				} else {
					formNotice = {
						tone: 'error',
						title: 'Data mahasiswa baru belum tersimpan.',
						description: response.error || 'Periksa kembali data mahasiswa lalu simpan lagi.'
					};
				}
			}
		} catch (err) {
			formNotice = describeRequestFailure(
				err,
				editingData ? 'Perubahan data mahasiswa belum tersimpan.' : 'Data mahasiswa baru belum tersimpan.',
				'Coba lagi dalam beberapa saat.'
			);
		} finally {
			formLoading = false;
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;

		deleteLoading = deleteTarget.id;
		try {
			const response = await mahasiswaService.delete(deleteTarget.id);
			if (response.success) {
				const deletedName = deleteTarget.nama;
				closeDeleteDialog(true);
				pageNotice = {
					tone: 'success',
					title: `Data mahasiswa ${deletedName} telah dihapus.`,
					description: 'Daftar mahasiswa sudah diperbarui.'
				};
				await loadData();
			} else {
				pageNotice = {
					tone: 'error',
					title: 'Data mahasiswa belum dapat dihapus.',
					description: response.error || 'Periksa keterkaitan data mahasiswa ini lalu coba lagi.'
				};
			}
		} catch (err) {
			pageNotice = describeRequestFailure(err, 'Data mahasiswa belum dapat dihapus.', 'Coba lagi dalam beberapa saat.');
		} finally {
			deleteLoading = null;
		}
	}

	const columns = [
		{ field: 'nim', header: 'NIM', sortable: true },
		{ field: 'nama', header: 'Nama', sortable: true },
		{ field: 'programStudi.nama', header: 'Program Studi', sortable: false },
		{ field: 'angkatan', header: 'Angkatan', sortable: true },
		{ field: 'status', header: 'Status', sortable: true, badge: true },
		{ field: 'ipk', header: 'IPK', sortable: true }
	];
</script>

<svelte:head>
	<title>Mahasiswa - Sistem Akademik</title>
</svelte:head>

	<div class="space-y-4">
		<div aria-live="polite">
			{#if pageNotice}
				<NoticeBanner notice={pageNotice} onDismiss={() => (pageNotice = null)} />
			{/if}
		</div>

	<PageHeader title="Mahasiswa" description="Kelola data mahasiswa universitas" actionLabel="Tambah Mahasiswa" onAction={openCreate} />

	<div class="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
		<div class="w-full lg:max-w-md lg:flex-1">
			<SearchInput 
				bind:value={searchQuery}
				label="Cari mahasiswa"
				ariaLabel="Cari mahasiswa berdasarkan nama atau NIM"
				loading={loading}
				placeholder="Nama mahasiswa atau NIM"
				onSearch={handleSearch}
			/>
		</div>
		<label class="w-full space-y-2 sm:w-auto">
			<span class="block text-sm font-medium text-base-content">Program studi</span>
			<select class="select select-bordered w-full sm:min-w-56" bind:value={filterProgram} onchange={() => { pagination.page = 1; loadData(); }} aria-label="Filter program studi mahasiswa">
				<option value="">Semua Program Studi</option>
				{#each programs as p}
					<option value={p.id}>{p.nama}</option>
				{/each}
			</select>
		</label>
		<label class="w-full space-y-2 sm:w-auto">
			<span class="block text-sm font-medium text-base-content">Status mahasiswa</span>
			<select class="select select-bordered w-full sm:min-w-48" bind:value={filterStatus} onchange={() => { pagination.page = 1; loadData(); }} aria-label="Filter status mahasiswa">
				<option value="">Semua Status</option>
				<option value="ACTIVE">Aktif</option>
				<option value="INACTIVE">Tidak Aktif</option>
				<option value="GRADUATED">Lulus</option>
			</select>
		</label>
	</div>

	{#if error}
		<div class="alert alert-error" role="alert">
		<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
		<span>{error}</span>
		<button class="btn btn-sm btn-ghost" onclick={loadData}>Coba Lagi</button>
		</div>
	{/if}

	<MobileCollection
		items={data}
		{pagination}
		{loading}
		itemLabelPlural="mahasiswa"
		loadingMessage="Memuat daftar mahasiswa..."
		onPageChange={handlePageChange}
	>
		{#snippet item(row: Mahasiswa)}
			<article class="card-elevated p-4 sm:p-5">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0 space-y-1">
						<h2 class="text-lg font-display font-semibold text-balance">{row.nama}</h2>
						<p class="text-sm text-muted">NIM {row.nim}</p>
					</div>
					<span class={`${getMahasiswaStatusChip(row.status)} shrink-0`}>{formatAcademicLabel(row.status)}</span>
				</div>

				<dl class="mt-4 grid gap-3 sm:grid-cols-2">
					<div class="space-y-1">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Program studi</dt>
						<dd class="text-sm font-medium text-base-content">{row.programStudi?.nama || 'Program studi belum tercatat'}</dd>
					</div>
					<div class="space-y-1">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Angkatan</dt>
						<dd class="text-sm font-medium text-base-content">{row.angkatan}</dd>
					</div>
					<div class="space-y-1">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">IPK</dt>
						<dd class="text-sm font-medium text-base-content">{row.ipk}</dd>
					</div>
				</dl>

				<div class="mt-4 grid gap-2 sm:grid-cols-3">
					<a class="btn btn-outline btn-sm" href={`/transkrip?mahasiswaId=${row.id}`}>Transkrip</a>
					<button class="btn btn-outline btn-sm" onclick={() => openEdit(row)} disabled={deleteLoading === row.id}>
						Ubah data
					</button>
					<button class="btn btn-error btn-outline btn-sm" onclick={() => openDeleteDialog(row)} disabled={deleteLoading === row.id}>
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
		ariaLabel="Daftar mahasiswa"
		desktopOnly
		onPageChange={handlePageChange}
	>
		{#snippet actions(row: Mahasiswa)}
				<a class="btn btn-sm btn-ghost" href={`/transkrip?mahasiswaId=${row.id}`}>Transkrip</a>
				<button class="btn btn-sm btn-ghost" aria-label="Ubah data" onclick={() => openEdit(row)} disabled={deleteLoading === row.id}>
				<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
				</svg>
			</button>
			<button class="btn btn-sm btn-error btn-ghost" aria-label="Hapus data" onclick={() => openDeleteDialog(row)} disabled={deleteLoading === row.id}>
				{#if deleteLoading === row.id}
					<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
				{:else}
					<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
	title={editingData ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}
	onClose={() => closeFormModal()}
	size="md"
>
	<div class="space-y-4">
		{#if formNotice}
			<NoticeBanner notice={formNotice} />
		{/if}
		<MahasiswaForm
			data={editingData}
			onSubmit={handleSubmit}
			onCancel={() => closeFormModal()}
			loading={formLoading}
		/>
	</div>
</Modal>

<ConfirmDialog
	open={Boolean(deleteTarget)}
	title="Hapus Mahasiswa"
	description="Data mahasiswa akan dihapus dari daftar akademik. Tindakan ini tidak dapat dibatalkan dari halaman ini."
	confirmLabel="Hapus data mahasiswa"
	confirmTone="error"
	loading={deleteLoading === deleteTarget?.id}
	onConfirm={confirmDelete}
	onCancel={() => closeDeleteDialog()}
	summary={
		deleteTarget
			? [
				{ label: 'Mahasiswa', value: deleteTarget.nama },
				{ label: 'NIM', value: deleteTarget.nim },
				{ label: 'Program studi', value: deleteTarget.programStudi?.nama || 'Program studi belum tercatat' }
			]
			: []
	}
/>
