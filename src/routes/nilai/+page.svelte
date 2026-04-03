<script lang="ts">
	import { onMount } from 'svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import MobileCollection from '$lib/components/MobileCollection.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import NoticeBanner from '$lib/components/NoticeBanner.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import NilaiForm from '$lib/components/forms/NilaiForm.svelte';
	import { nilaiService } from '$lib/api/services/nilai';
	import type { NoticeMessage } from '$lib/types/notice';
	import { formatAcademicLabel } from '$lib/utils/format-label';
	import { describeRequestFailure } from '$lib/utils/request-notice';
	import { getGradeStatusChip } from '$lib/utils/status-chip';
	import type { Nilai, NilaiFormData } from '$lib/types';

	let data = $state<Nilai[]>([]);
	let loading = $state(false);
	let error = $state('');
	let pageNotice = $state<NoticeMessage | null>(null);
	let formNotice = $state<NoticeMessage | null>(null);
	let deleteTarget = $state<Nilai | null>(null);

	let pagination = $state({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0
	});

	let isModalOpen = $state(false);
	let editingData = $state<Nilai | undefined>(undefined);
	let formLoading = $state(false);
	let deleteLoading = $state<number | null>(null);

	async function loadData() {
		loading = true;
		error = '';
		try {
			const response = await nilaiService.getAll({
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

	function openEdit(item: Nilai) {
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

	function openDeleteDialog(item: Nilai) {
		deleteTarget = item;
	}

	function closeDeleteDialog(force = false) {
		if (deleteLoading !== null && !force) return;
		deleteTarget = null;
	}

	async function handleSubmit(formData: NilaiFormData) {
		formNotice = null;
		formLoading = true;
		try {
			if (editingData) {
				const response = await nilaiService.update(editingData.id, {
					nilaiTugas: formData.nilaiTugas,
					nilaiUTS: formData.nilaiUTS,
					nilaiUAS: formData.nilaiUAS
				});
				if (response.success) {
					closeFormModal(true);
					await loadData();
					pageNotice = { tone: 'success', title: 'Nilai telah diperbarui.', description: 'Perubahan nilai sudah tersimpan.' };
				} else {
					formNotice = { tone: 'error', title: 'Perubahan nilai belum tersimpan.', description: response.error || 'Periksa kembali data nilai lalu simpan lagi.' };
				}
			} else {
				const response = await nilaiService.create(formData);
				if (response.success) {
					closeFormModal(true);
					await loadData();
					pageNotice = { tone: 'success', title: 'Nilai baru telah ditambahkan.', description: 'Data nilai sudah tersedia pada daftar.' };
				} else {
					formNotice = { tone: 'error', title: 'Nilai baru belum tersimpan.', description: response.error || 'Periksa kembali data nilai lalu simpan lagi.' };
				}
			}
		} catch (err) {
			formNotice = describeRequestFailure(err, editingData ? 'Perubahan nilai belum tersimpan.' : 'Nilai baru belum tersimpan.', 'Coba lagi dalam beberapa saat.');
		} finally {
			formLoading = false;
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		deleteLoading = deleteTarget.id;
		try {
			const response = await nilaiService.delete(deleteTarget.id);
			if (response.success) {
				await loadData();
				closeDeleteDialog(true);
				pageNotice = { tone: 'success', title: 'Nilai telah dihapus.', description: 'Daftar nilai sudah diperbarui.' };
			} else {
				pageNotice = { tone: 'error', title: 'Nilai belum dapat dihapus.', description: response.error || 'Coba lagi dalam beberapa saat.' };
			}
		} catch (err) {
			pageNotice = describeRequestFailure(err, 'Nilai belum dapat dihapus.', 'Coba lagi dalam beberapa saat.');
		} finally {
			deleteLoading = null;
		}
	}

	onMount(() => {
		loadData();
	});

	const columns = [
		{ field: 'enrollment.mahasiswa.nim', header: 'NIM', sortable: false },
		{ field: 'enrollment.mahasiswa.nama', header: 'Mahasiswa', sortable: false },
		{ field: 'enrollment.mataKuliah.nama', header: 'Mata Kuliah', sortable: false },
		{ field: 'nilaiTugas', header: 'Tugas', sortable: true },
		{ field: 'nilaiUTS', header: 'UTS', sortable: true },
		{ field: 'nilaiUAS', header: 'UAS', sortable: true },
		{ field: 'nilaiTotal', header: 'Total', sortable: true },
		{ field: 'hurufMutu', header: 'Nilai', sortable: true, badge: true }
	];
</script>

<svelte:head>
	<title>Nilai - Sistem Akademik</title>
</svelte:head>

<div class="space-y-4">
	<div aria-live="polite">
		{#if pageNotice}
			<NoticeBanner notice={pageNotice} onDismiss={() => (pageNotice = null)} />
		{/if}
	</div>

	<PageHeader title="Nilai" description="Kelola data nilai mahasiswa" actionLabel="Input Nilai" onAction={openCreate} />

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
		visibilityClass="xl:hidden"
		itemLabelPlural="nilai"
		loadingMessage="Memuat daftar nilai..."
		onPageChange={handlePageChange}
	>
		{#snippet item(row: Nilai)}
			<article class="card-elevated p-4 sm:p-5">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0 space-y-1">
						<h2 class="text-lg font-display font-semibold text-balance">{row.enrollment?.mahasiswa?.nama || 'Mahasiswa belum terbaca'}</h2>
						<p class="text-sm text-muted">{row.enrollment?.mataKuliah?.nama || 'Mata kuliah belum terbaca'}</p>
						<p class="text-xs text-subtle">NIM {row.enrollment?.mahasiswa?.nim || '—'}</p>
					</div>
					<span class={`${getGradeStatusChip(row.hurufMutu)} shrink-0`}>{formatAcademicLabel(row.hurufMutu)}</span>
				</div>

				<dl class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div class="space-y-1">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Tugas</dt>
						<dd class="text-sm font-medium text-base-content">{row.nilaiTugas}</dd>
					</div>
					<div class="space-y-1">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">UTS</dt>
						<dd class="text-sm font-medium text-base-content">{row.nilaiUTS}</dd>
					</div>
					<div class="space-y-1">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">UAS</dt>
						<dd class="text-sm font-medium text-base-content">{row.nilaiUAS}</dd>
					</div>
					<div class="space-y-1">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Total</dt>
						<dd class="text-sm font-medium text-base-content">{row.nilaiTotal}</dd>
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

	<div class="hidden xl:block">
	<DataTable
		{columns}
		{data}
		{pagination}
		{loading}
		ariaLabel="Daftar nilai"
		tableClass="min-w-[54rem]"
		desktopOnly
		desktopVisibilityClass="hidden xl:block"
		onPageChange={handlePageChange}
	>
			{#snippet actions(row: Nilai)}
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
	title={editingData ? 'Edit Nilai' : 'Input Nilai'}
	onClose={() => closeFormModal()}
	size="md"
>
	<div class="space-y-4">
		{#if formNotice}
			<NoticeBanner notice={formNotice} />
		{/if}
		<NilaiForm
			data={editingData}
			onSubmit={handleSubmit}
			onCancel={() => closeFormModal()}
			loading={formLoading}
		/>
	</div>
</Modal>

<ConfirmDialog
	open={Boolean(deleteTarget)}
	title="Hapus Nilai"
	description="Data nilai akan dihapus dari daftar penilaian. Tindakan ini tidak dapat dibatalkan dari halaman ini."
	confirmLabel="Hapus nilai"
	confirmTone="error"
	loading={deleteLoading === deleteTarget?.id}
	onConfirm={confirmDelete}
	onCancel={() => closeDeleteDialog()}
	summary={deleteTarget ? [{ label: 'Mahasiswa', value: deleteTarget.enrollment?.mahasiswa?.nama || 'Mahasiswa belum terbaca' }, { label: 'Mata kuliah', value: deleteTarget.enrollment?.mataKuliah?.nama || 'Mata kuliah belum terbaca' }, { label: 'Nilai akhir', value: formatAcademicLabel(deleteTarget.hurufMutu) }] : []}
/>
