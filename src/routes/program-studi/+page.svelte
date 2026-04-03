<script lang="ts">
	import { onMount } from 'svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import MobileCollection from '$lib/components/MobileCollection.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import NoticeBanner from '$lib/components/NoticeBanner.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import ProgramStudiForm from '$lib/components/forms/ProgramStudiForm.svelte';
	import { programStudiService } from '$lib/api/services/programStudi';
	import type { NoticeMessage } from '$lib/types/notice';
	import { formatAcademicLabel } from '$lib/utils/format-label';
	import { describeRequestFailure } from '$lib/utils/request-notice';
	import type { ProgramStudi, ProgramStudiFormData } from '$lib/types';

	let { data: pageData }: { data: import('./$types').PageData } = $props();

	// svelte-ignore state_referenced_locally
	let data = $state<ProgramStudi[]>(pageData.initialPrograms);
	let loading = $state(false);
	let error = $state('');
	let searchQuery = $state('');
	let pageNotice = $state<NoticeMessage | null>(null);
	let formNotice = $state<NoticeMessage | null>(null);
	let deleteTarget = $state<ProgramStudi | null>(null);

	// svelte-ignore state_referenced_locally
	let pagination = $state(pageData.initialPagination);

	let isModalOpen = $state(false);
	let editingData = $state<ProgramStudi | undefined>(undefined);
	let formLoading = $state(false);
	let deleteLoading = $state<number | null>(null);

	async function loadData() {
		loading = true;
		error = '';
		try {
			const response = await programStudiService.getAll({
				page: pagination.page,
				limit: pagination.limit,
				search: searchQuery.trim() || undefined
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

	function openEdit(item: ProgramStudi) {
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

	function openDeleteDialog(item: ProgramStudi) {
		deleteTarget = item;
	}

	function closeDeleteDialog(force = false) {
		if (deleteLoading !== null && !force) return;

		deleteTarget = null;
	}

	async function handleSubmit(formData: ProgramStudiFormData) {
		formNotice = null;
		formLoading = true;
		try {
			if (editingData) {
				const response = await programStudiService.update(editingData.id, formData);
				if (response.success) {
					closeFormModal(true);
					pageNotice = {
						tone: 'success',
						title: `Program studi ${formData.nama} telah diperbarui.`,
						description: 'Perubahan sudah diterapkan pada daftar program studi.'
					};
					await loadData();
				} else {
					formNotice = {
						tone: 'error',
						title: 'Perubahan program studi belum tersimpan.',
						description: response.error || 'Periksa kembali data program studi lalu simpan lagi.'
					};
				}
			} else {
				const response = await programStudiService.create(formData);
				if (response.success) {
					closeFormModal(true);
					pageNotice = {
						tone: 'success',
						title: `Program studi ${formData.nama} telah ditambahkan.`,
						description: 'Data baru sudah tersedia pada daftar program studi.'
					};
					await loadData();
				} else {
					formNotice = {
						tone: 'error',
						title: 'Program studi baru belum tersimpan.',
						description: response.error || 'Periksa kembali data program studi lalu simpan lagi.'
					};
				}
			}
		} catch (err) {
			formNotice = describeRequestFailure(
				err,
				editingData ? 'Perubahan program studi belum tersimpan.' : 'Program studi baru belum tersimpan.',
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
			const response = await programStudiService.delete(deleteTarget.id);
			if (response.success) {
				const deletedName = deleteTarget.nama;
				closeDeleteDialog(true);
				pageNotice = {
					tone: 'success',
					title: `Program studi ${deletedName} telah dihapus.`,
					description: 'Daftar program studi sudah diperbarui.'
				};
				await loadData();
			} else {
				pageNotice = {
					tone: 'error',
					title: 'Program studi belum dapat dihapus.',
					description: response.error || 'Periksa keterkaitan data program studi ini lalu coba lagi.'
				};
			}
		} catch (err) {
			pageNotice = describeRequestFailure(err, 'Program studi belum dapat dihapus.', 'Coba lagi dalam beberapa saat.');
		} finally {
			deleteLoading = null;
		}
	}

	const columns = [
		{ field: 'kode', header: 'Kode', sortable: true },
		{ field: 'nama', header: 'Nama Program Studi', sortable: true },
		{ field: 'jenjang', header: 'Jenjang', sortable: true, badge: true }
	];
</script>

<svelte:head>
	<title>Program Studi - Sistem Akademik</title>
</svelte:head>

<div class="space-y-4">
	<div aria-live="polite">
		{#if pageNotice}
			<NoticeBanner notice={pageNotice} onDismiss={() => (pageNotice = null)} />
		{/if}
	</div>

	<PageHeader title="Program Studi" description="Kelola data program studi universitas" actionLabel="Tambah Program Studi" onAction={openCreate} />

	<div class="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
		<div class="w-full lg:max-w-md lg:flex-1">
			<SearchInput 
				bind:value={searchQuery}
				label="Cari program studi"
				ariaLabel="Cari program studi berdasarkan nama atau kode"
				loading={loading}
				placeholder="Nama atau kode program studi"
				onSearch={handleSearch}
			/>
		</div>
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
		itemLabelPlural="program studi"
		loadingMessage="Memuat daftar program studi..."
		onPageChange={handlePageChange}
	>
		{#snippet item(row: ProgramStudi)}
			<article class="card-elevated p-4 sm:p-5">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0 space-y-1">
						<h2 class="text-lg font-display font-semibold text-balance">{row.nama}</h2>
						<p class="text-sm text-muted">Kode {row.kode}</p>
					</div>
					<span class="status-chip tone-slate shrink-0">{formatAcademicLabel(row.jenjang)}</span>
				</div>

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
		ariaLabel="Daftar program studi"
		desktopOnly
		onPageChange={handlePageChange}
	>
			{#snippet actions(row: ProgramStudi)}
				<button 
					class="btn btn-sm btn-ghost" 
					onclick={() => openEdit(row)}
					disabled={deleteLoading === row.id}
					aria-label="Ubah data"
				>
				<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
				</svg>
			</button>
			<button 
				class="btn btn-sm btn-error btn-ghost" 
				onclick={() => openDeleteDialog(row)}
				disabled={deleteLoading === row.id}
				aria-label="Hapus data"
			>
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
	title={editingData ? 'Edit Program Studi' : 'Tambah Program Studi'}
	onClose={() => closeFormModal()}
	size="md"
>
	<div class="space-y-4">
		{#if formNotice}
			<NoticeBanner notice={formNotice} />
		{/if}
		<ProgramStudiForm
			data={editingData}
			onSubmit={handleSubmit}
			onCancel={() => closeFormModal()}
			loading={formLoading}
		/>
	</div>
</Modal>

<ConfirmDialog
	open={Boolean(deleteTarget)}
	title="Hapus Program Studi"
	description="Program studi akan dihapus dari master data akademik. Tindakan ini tidak dapat dibatalkan dari halaman ini."
	confirmLabel="Hapus program studi"
	confirmTone="error"
	loading={deleteLoading === deleteTarget?.id}
	onConfirm={confirmDelete}
	onCancel={() => closeDeleteDialog()}
	summary={
		deleteTarget
			? [
				{ label: 'Program studi', value: deleteTarget.nama },
				{ label: 'Kode', value: deleteTarget.kode },
				{ label: 'Jenjang', value: formatAcademicLabel(deleteTarget.jenjang) }
			]
			: []
	}
/>
