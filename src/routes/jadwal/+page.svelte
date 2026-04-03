<script lang="ts">
	import { onMount } from 'svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import MobileCollection from '$lib/components/MobileCollection.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import NoticeBanner from '$lib/components/NoticeBanner.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import JadwalForm from '$lib/components/forms/JadwalForm.svelte';
	import { jadwalService } from '$lib/api/services/jadwal';
	import type { NoticeMessage } from '$lib/types/notice';
	import { formatAcademicLabel } from '$lib/utils/format-label';
	import { describeRequestFailure } from '$lib/utils/request-notice';
	import type { Jadwal, JadwalFormData } from '$lib/types';

	let data = $state<Jadwal[]>([]);
	let loading = $state(false);
	let error = $state('');
	let pageNotice = $state<NoticeMessage | null>(null);
	let formNotice = $state<NoticeMessage | null>(null);
	let deleteTarget = $state<Jadwal | null>(null);

	let pagination = $state({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0
	});

	let isModalOpen = $state(false);
	let editingData = $state<Jadwal | undefined>(undefined);
	let formLoading = $state(false);
	let deleteLoading = $state<number | null>(null);

	async function loadData() {
		loading = true;
		error = '';
		try {
			const response = await jadwalService.getAll({
				page: pagination.page,
				limit: pagination.limit
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

	function openCreate() {
		editingData = undefined;
		formNotice = null;
		isModalOpen = true;
	}

	function openEdit(item: Jadwal) {
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

	function openDeleteDialog(item: Jadwal) {
		deleteTarget = item;
	}

	function closeDeleteDialog(force = false) {
		if (deleteLoading !== null && !force) return;
		deleteTarget = null;
	}

	async function handleSubmit(formData: JadwalFormData) {
		formNotice = null;
		formLoading = true;
		try {
			if (editingData) {
				const response = await jadwalService.update(editingData.id, formData);
				if (response.success) {
					closeFormModal(true);
					pageNotice = { tone: 'success', title: 'Jadwal telah diperbarui.', description: 'Perubahan jadwal sudah tersimpan.' };
					await loadData();
				} else {
					formNotice = { tone: 'error', title: 'Perubahan jadwal belum tersimpan.', description: response.error || 'Periksa kembali data jadwal lalu simpan lagi.' };
				}
			} else {
				const response = await jadwalService.create(formData);
				if (response.success) {
					closeFormModal(true);
					pageNotice = { tone: 'success', title: 'Jadwal baru telah ditambahkan.', description: 'Data jadwal sudah tersedia pada daftar.' };
					await loadData();
				} else {
					formNotice = { tone: 'error', title: 'Jadwal baru belum tersimpan.', description: response.error || 'Periksa kembali data jadwal lalu simpan lagi.' };
				}
			}
		} catch (err) {
			formNotice = describeRequestFailure(err, editingData ? 'Perubahan jadwal belum tersimpan.' : 'Jadwal baru belum tersimpan.', 'Coba lagi dalam beberapa saat.');
		} finally {
			formLoading = false;
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		deleteLoading = deleteTarget.id;
		try {
			const response = await jadwalService.delete(deleteTarget.id);
			if (response.success) {
				closeDeleteDialog(true);
				pageNotice = { tone: 'success', title: 'Jadwal telah dihapus.', description: 'Daftar jadwal sudah diperbarui.' };
				await loadData();
			} else {
				pageNotice = { tone: 'error', title: 'Jadwal belum dapat dihapus.', description: response.error || 'Coba lagi dalam beberapa saat.' };
			}
		} catch (err) {
			pageNotice = describeRequestFailure(err, 'Jadwal belum dapat dihapus.', 'Coba lagi dalam beberapa saat.');
		} finally {
			deleteLoading = null;
		}
	}

	onMount(() => {
		loadData();
	});

	const columns = [
		{ field: 'hari', header: 'Hari', sortable: true, badge: true },
		{ field: 'jamMulai', header: 'Jam Mulai', sortable: true },
		{ field: 'jamSelesai', header: 'Jam Selesai', sortable: true }
	];
</script>

<svelte:head>
	<title>Jadwal - Sistem Akademik</title>
</svelte:head>

<div class="space-y-4">
	<div aria-live="polite">
		{#if pageNotice}
			<NoticeBanner notice={pageNotice} onDismiss={() => (pageNotice = null)} />
		{/if}
	</div>

	<PageHeader title="Jadwal" description="Kelola data jadwal perkuliahan" actionLabel="Tambah Jadwal" onAction={openCreate} />

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
		itemLabelPlural="jadwal"
		loadingMessage="Memuat daftar jadwal..."
		onPageChange={handlePageChange}
	>
		{#snippet item(row: Jadwal)}
			<article class="card-elevated p-4 sm:p-5">
				<div class="flex items-start justify-between gap-3">
					<div class="space-y-1">
						<p class="text-sm text-muted">Jadwal</p>
						<h2 class="text-lg font-display font-semibold text-balance">{formatAcademicLabel(row.hari)}</h2>
					</div>
					<div class="rounded-lg border border-base-300/70 px-3 py-2 text-right text-sm">
						<p class="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-subtle">Waktu</p>
						<p class="mt-1 font-medium text-base-content">{row.jamMulai} - {row.jamSelesai}</p>
					</div>
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
		ariaLabel="Daftar jadwal kuliah"
		desktopOnly
		onPageChange={handlePageChange}
	>
			{#snippet actions(row: Jadwal)}
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
	title={editingData ? 'Edit Jadwal' : 'Tambah Jadwal'}
	onClose={() => closeFormModal()}
	size="md"
>
	<div class="space-y-4">
		{#if formNotice}
			<NoticeBanner notice={formNotice} />
		{/if}
		<JadwalForm
			data={editingData}
			onSubmit={handleSubmit}
			onCancel={() => closeFormModal()}
			loading={formLoading}
		/>
	</div>
</Modal>

<ConfirmDialog
	open={Boolean(deleteTarget)}
	title="Hapus Jadwal"
	description="Jadwal akan dihapus dari daftar perkuliahan. Tindakan ini tidak dapat dibatalkan dari halaman ini."
	confirmLabel="Hapus jadwal"
	confirmTone="error"
	loading={deleteLoading === deleteTarget?.id}
	onConfirm={confirmDelete}
	onCancel={() => closeDeleteDialog()}
	summary={deleteTarget ? [{ label: 'Hari', value: formatAcademicLabel(deleteTarget.hari) }, { label: 'Jam mulai', value: deleteTarget.jamMulai }, { label: 'Jam selesai', value: deleteTarget.jamSelesai }] : []}
/>
