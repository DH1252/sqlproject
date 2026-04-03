<script lang="ts">
	import { onMount } from 'svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import MobileCollection from '$lib/components/MobileCollection.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import NoticeBanner from '$lib/components/NoticeBanner.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import MataKuliahForm from '$lib/components/forms/MataKuliahForm.svelte';
	import { mataKuliahService } from '$lib/api/services/mataKuliah';
	import { programStudiService } from '$lib/api/services/programStudi';
	import type { NoticeMessage } from '$lib/types/notice';
	import type { MataKuliah, MataKuliahFormData, ProgramStudi } from '$lib/types';
	import { describeRequestFailure } from '$lib/utils/request-notice';

	let data = $state<MataKuliah[]>([]);
	let programs = $state<ProgramStudi[]>([]);
	let loading = $state(false);
	let error = $state('');
	let searchQuery = $state('');
	let filterProgram = $state<number | ''>('');
	let filterSemester = $state<number | ''>('');
	let pageNotice = $state<NoticeMessage | null>(null);
	let formNotice = $state<NoticeMessage | null>(null);
	let deleteTarget = $state<MataKuliah | null>(null);

	let pagination = $state({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0
	});

	let isModalOpen = $state(false);
	let editingData = $state<MataKuliah | undefined>(undefined);
	let formLoading = $state(false);
	let deleteLoading = $state<number | null>(null);

	async function loadData() {
		loading = true;
		error = '';
		try {
			const response = await mataKuliahService.getAll({
				page: pagination.page,
				limit: pagination.limit,
				search: searchQuery.trim() || undefined,
				programStudiId: filterProgram || undefined,
				semester: filterSemester || undefined
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

	async function loadPrograms() {
		try {
			const response = await programStudiService.getAll({ limit: 100 });
			if (response.success) {
				programs = response.data;
			}
		} catch (err) {
			console.error('Failed to load programs');
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

	function openEdit(item: MataKuliah) {
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

	function openDeleteDialog(item: MataKuliah) {
		deleteTarget = item;
	}

	function closeDeleteDialog(force = false) {
		if (deleteLoading !== null && !force) return;
		deleteTarget = null;
	}

	async function handleSubmit(formData: MataKuliahFormData) {
		formNotice = null;
		formLoading = true;
		try {
			if (editingData) {
				const response = await mataKuliahService.update(editingData.id, formData);
				if (response.success) {
					closeFormModal(true);
					pageNotice = {
						tone: 'success',
						title: `Mata kuliah ${formData.nama} telah diperbarui.`,
						description: 'Perubahan sudah tersimpan pada daftar mata kuliah.'
					};
					await loadData();
				} else {
					formNotice = { tone: 'error', title: 'Perubahan mata kuliah belum tersimpan.', description: response.error || 'Periksa kembali data mata kuliah lalu simpan lagi.' };
				}
			} else {
				const response = await mataKuliahService.create(formData);
				if (response.success) {
					closeFormModal(true);
					pageNotice = {
						tone: 'success',
						title: `Mata kuliah ${formData.nama} telah ditambahkan.`,
						description: 'Data baru sudah tersedia pada daftar mata kuliah.'
					};
					await loadData();
				} else {
					formNotice = { tone: 'error', title: 'Mata kuliah baru belum tersimpan.', description: response.error || 'Periksa kembali data mata kuliah lalu simpan lagi.' };
				}
			}
		} catch (err) {
			formNotice = describeRequestFailure(err, editingData ? 'Perubahan mata kuliah belum tersimpan.' : 'Mata kuliah baru belum tersimpan.', 'Coba lagi dalam beberapa saat.');
		} finally {
			formLoading = false;
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		deleteLoading = deleteTarget.id;
		try {
			const response = await mataKuliahService.delete(deleteTarget.id);
			if (response.success) {
				const deletedName = deleteTarget.nama;
				closeDeleteDialog(true);
				pageNotice = { tone: 'success', title: `Mata kuliah ${deletedName} telah dihapus.`, description: 'Daftar mata kuliah sudah diperbarui.' };
				await loadData();
			} else {
				pageNotice = { tone: 'error', title: 'Mata kuliah belum dapat dihapus.', description: response.error || 'Periksa keterkaitan data mata kuliah ini lalu coba lagi.' };
			}
		} catch (err) {
			pageNotice = describeRequestFailure(err, 'Mata kuliah belum dapat dihapus.', 'Coba lagi dalam beberapa saat.');
		} finally {
			deleteLoading = null;
		}
	}

	onMount(() => {
		loadData();
		loadPrograms();
	});

	const semesterOptions = Array.from({ length: 8 }, (_, i) => i + 1);

	const columns = [
		{ field: 'kode', header: 'Kode', sortable: true },
		{ field: 'nama', header: 'Nama Mata Kuliah', sortable: true },
		{ field: 'sks', header: 'SKS', sortable: true },
		{ field: 'semester', header: 'Semester', sortable: true },
		{ field: 'programStudi.nama', header: 'Program Studi', sortable: false }
	];
</script>

<svelte:head>
	<title>Mata Kuliah - Sistem Akademik</title>
</svelte:head>

<div class="space-y-4">
	<div aria-live="polite">
		{#if pageNotice}
			<NoticeBanner notice={pageNotice} onDismiss={() => (pageNotice = null)} />
		{/if}
	</div>

	<PageHeader title="Mata Kuliah" description="Kelola data mata kuliah universitas" actionLabel="Tambah Mata Kuliah" onAction={openCreate} />

	<div class="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
		<div class="w-full lg:max-w-md lg:flex-1">
			<SearchInput 
				bind:value={searchQuery}
				label="Cari mata kuliah"
				ariaLabel="Cari mata kuliah berdasarkan nama atau kode"
				loading={loading}
				placeholder="Nama atau kode mata kuliah"
				onSearch={handleSearch}
			/>
		</div>
		<label class="w-full space-y-2 sm:w-auto">
			<span class="block text-sm font-medium text-base-content">Program studi</span>
			<select class="select select-bordered w-full sm:min-w-56" bind:value={filterProgram} onchange={() => { pagination.page = 1; loadData(); }} aria-label="Filter program studi mata kuliah">
				<option value="">Semua Program Studi</option>
				{#each programs as p}
					<option value={p.id}>{p.nama}</option>
				{/each}
			</select>
		</label>
		<label class="w-full space-y-2 sm:w-auto">
			<span class="block text-sm font-medium text-base-content">Semester</span>
			<select class="select select-bordered w-full sm:min-w-44" bind:value={filterSemester} onchange={() => { pagination.page = 1; loadData(); }} aria-label="Filter semester mata kuliah">
				<option value="">Semua Semester</option>
				{#each semesterOptions as s}
					<option value={s}>Semester {s}</option>
				{/each}
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
		itemLabelPlural="mata kuliah"
		loadingMessage="Memuat daftar mata kuliah..."
		onPageChange={handlePageChange}
	>
		{#snippet item(row: MataKuliah)}
			<article class="card-elevated p-4 sm:p-5">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0 space-y-1">
						<h2 class="text-lg font-display font-semibold text-balance">{row.nama}</h2>
						<p class="text-sm text-muted">Kode {row.kode}</p>
					</div>
					<div class="shrink-0 text-right">
						<p class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">SKS</p>
						<p class="mt-1 font-semibold text-base-content">{row.sks}</p>
					</div>
				</div>

				<dl class="mt-4 grid gap-3 sm:grid-cols-2">
					<div class="space-y-1">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Semester</dt>
						<dd class="text-sm font-medium text-base-content">Semester {row.semester}</dd>
					</div>
					<div class="space-y-1 sm:col-span-2">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Program studi</dt>
						<dd class="text-sm font-medium text-base-content">{row.programStudi?.nama || 'Program studi belum tercatat'}</dd>
					</div>
				</dl>

				<div class="mt-4 grid gap-2 sm:grid-cols-2">
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
		ariaLabel="Daftar mata kuliah"
		desktopOnly
		onPageChange={handlePageChange}
	>
			{#snippet actions(row: MataKuliah)}
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
	title={editingData ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}
	onClose={() => closeFormModal()}
	size="md"
>
	<div class="space-y-4">
		{#if formNotice}
			<NoticeBanner notice={formNotice} />
		{/if}
		<MataKuliahForm
			data={editingData}
			onSubmit={handleSubmit}
			onCancel={() => closeFormModal()}
			loading={formLoading}
		/>
	</div>
</Modal>

<ConfirmDialog
	open={Boolean(deleteTarget)}
	title="Hapus Mata Kuliah"
	description="Mata kuliah akan dihapus dari daftar akademik. Tindakan ini tidak dapat dibatalkan dari halaman ini."
	confirmLabel="Hapus mata kuliah"
	confirmTone="error"
	loading={deleteLoading === deleteTarget?.id}
	onConfirm={confirmDelete}
	onCancel={() => closeDeleteDialog()}
	summary={deleteTarget ? [{ label: 'Mata kuliah', value: deleteTarget.nama }, { label: 'Kode', value: deleteTarget.kode }, { label: 'Program studi', value: deleteTarget.programStudi?.nama || 'Program studi belum tercatat' }] : []}
/>
