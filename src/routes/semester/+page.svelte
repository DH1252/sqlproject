<script lang="ts">
	import { onMount } from 'svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import MobileCollection from '$lib/components/MobileCollection.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import NoticeBanner from '$lib/components/NoticeBanner.svelte';
	import SemesterForm from '$lib/components/forms/SemesterForm.svelte';
	import { semesterService } from '$lib/api/services/semester';
	import type { NoticeMessage } from '$lib/types/notice';
	import { formatAcademicLabel } from '$lib/utils/format-label';
	import { describeRequestFailure } from '$lib/utils/request-notice';
	import type { Semester, SemesterFormData, JenisSemester } from '$lib/types';

	let { data: pageData }: { data: import('./$types').PageData } = $props();

	// svelte-ignore state_referenced_locally
	let data = $state<Semester[]>(pageData.initialSemesters);
	let loading = $state(false);
	let error = $state('');
	let pageNotice = $state<NoticeMessage | null>(null);
	let formNotice = $state<NoticeMessage | null>(null);
	let pendingAction = $state<{ type: 'activate' | 'delete'; item: Semester } | null>(null);

	// svelte-ignore state_referenced_locally
	let pagination = $state(pageData.initialPagination);

	let isModalOpen = $state(false);
	let editingData = $state<Semester | undefined>(undefined);
	let formLoading = $state(false);
	let deleteLoading = $state<number | null>(null);
	let activateLoading = $state<number | null>(null);

	async function loadData() {
		loading = true;
		error = '';
		try {
			const response = await semesterService.getAll({
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

	function openEdit(item: Semester) {
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

	function closeActionDialog(force = false) {
		if ((deleteLoading !== null || activateLoading !== null) && !force) return;
		pendingAction = null;
	}

	async function confirmActivate(item: Semester) {
		activateLoading = item.id;
		try {
			const response = await semesterService.activate(item.id);
			if (response.success) {
				closeActionDialog(true);
				pageNotice = {
					tone: 'success',
					title: `Semester ${item.tahunAjaran} ${formatAcademicLabel(item.semester)} telah diaktifkan.`,
					description: 'Semester aktif terbaru sudah dipakai sebagai acuan operasional akademik.'
				};
				await loadData();
			} else {
				pageNotice = {
					tone: 'error',
					title: 'Semester aktif belum berhasil diperbarui.',
					description: response.error || 'Coba lagi dalam beberapa saat.'
				};
			}
		} catch (err) {
			pageNotice = describeRequestFailure(err, 'Semester aktif belum berhasil diperbarui.', 'Coba lagi dalam beberapa saat.');
		} finally {
			activateLoading = null;
		}
	}

	async function handleSubmit(formData: SemesterFormData) {
		formNotice = null;
		formLoading = true;
		try {
			if (editingData) {
				const response = await semesterService.update(editingData.id, formData);
				if (response.success) {
					closeFormModal(true);
					pageNotice = {
						tone: 'success',
						title: `Semester ${formData.tahunAjaran} telah diperbarui.`,
						description: 'Perubahan semester sudah tersimpan.'
					};
					await loadData();
				} else {
					formNotice = {
						tone: 'error',
						title: 'Perubahan semester belum tersimpan.',
						description: response.error || 'Periksa kembali data semester lalu simpan lagi.'
					};
				}
			} else {
				const response = await semesterService.create(formData);
				if (response.success) {
					closeFormModal(true);
					pageNotice = {
						tone: 'success',
						title: `Semester ${formData.tahunAjaran} telah ditambahkan.`,
						description: 'Data semester baru sudah tersedia pada daftar.'
					};
					await loadData();
				} else {
					formNotice = {
						tone: 'error',
						title: 'Data semester baru belum tersimpan.',
						description: response.error || 'Periksa kembali data semester lalu simpan lagi.'
					};
				}
			}
		} catch (err) {
			formNotice = describeRequestFailure(
				err,
				editingData ? 'Perubahan semester belum tersimpan.' : 'Data semester baru belum tersimpan.',
				'Coba lagi dalam beberapa saat.'
			);
		} finally {
			formLoading = false;
		}
	}

	async function confirmDelete(item: Semester) {
		deleteLoading = item.id;
		try {
			const response = await semesterService.delete(item.id);
			if (response.success) {
				closeActionDialog(true);
				pageNotice = {
					tone: 'success',
					title: `Semester ${item.tahunAjaran} ${formatAcademicLabel(item.semester)} telah dihapus.`,
					description: 'Daftar semester sudah diperbarui.'
				};
				await loadData();
			} else {
				pageNotice = {
					tone: 'error',
					title: 'Semester belum dapat dihapus.',
					description: response.error || 'Coba lagi dalam beberapa saat.'
				};
			}
		} catch (err) {
			pageNotice = describeRequestFailure(err, 'Semester belum dapat dihapus.', 'Coba lagi dalam beberapa saat.');
		} finally {
			deleteLoading = null;
		}
	}

	const columns = [
		{ field: 'tahunAjaran', header: 'Tahun Ajaran', sortable: true },
		{ field: 'semester', header: 'Semester', sortable: true, badge: true },
		{ field: 'isActive', header: 'Status', sortable: true, badge: true }
	];
</script>

<svelte:head>
	<title>Semester - Sistem Akademik</title>
</svelte:head>

<div class="space-y-4">
	<div aria-live="polite">
		{#if pageNotice}
			<NoticeBanner notice={pageNotice} onDismiss={() => (pageNotice = null)} />
		{/if}
	</div>

	<PageHeader title="Semester" description="Kelola data semester akademik" actionLabel="Tambah Semester" onAction={openCreate} />

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
		itemLabelPlural="semester"
		loadingMessage="Memuat daftar semester..."
		onPageChange={handlePageChange}
	>
		{#snippet item(row: Semester)}
			<article class="card-elevated p-4 sm:p-5">
				<div class="flex items-start justify-between gap-3">
					<div class="space-y-1">
						<p class="text-sm text-muted">Tahun ajaran</p>
						<h2 class="text-lg font-display font-semibold text-balance">{row.tahunAjaran} - {formatAcademicLabel(row.semester)}</h2>
					</div>
					<span class="status-chip shrink-0 {row.isActive ? 'tone-emerald' : 'tone-slate'}">{row.isActive ? 'Aktif' : 'Tidak aktif'}</span>
				</div>

				<div class="mt-4 grid gap-2 sm:grid-cols-3">
					{#if !row.isActive}
						<button class="btn btn-outline btn-sm" onclick={() => (pendingAction = { type: 'activate', item: row })} disabled={activateLoading === row.id}>
							{#if activateLoading === row.id}
								<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
							{/if}
							Aktifkan
						</button>
					{/if}
					<button class="btn btn-outline btn-sm" onclick={() => openEdit(row)} disabled={deleteLoading === row.id}>
						Ubah data
					</button>
					<button class="btn btn-error btn-outline btn-sm" onclick={() => (pendingAction = { type: 'delete', item: row })} disabled={deleteLoading === row.id || row.isActive}>
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
		ariaLabel="Daftar semester"
		desktopOnly
		onPageChange={handlePageChange}
	>
			{#snippet actions(row: Semester)}
				{#if !row.isActive}
					<button 
						class="btn btn-sm btn-success" 
						onclick={() => (pendingAction = { type: 'activate', item: row })}
						disabled={activateLoading === row.id}
					>
						{#if activateLoading === row.id}
							<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
						{:else}
							Aktifkan
						{/if}
					</button>
				{:else}
					<span class="status-chip tone-emerald">Aktif</span>
				{/if}
			<button class="btn btn-sm btn-ghost" aria-label="Ubah data" onclick={() => openEdit(row)} disabled={deleteLoading === row.id}>
				<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
				</svg>
			</button>
			<button class="btn btn-sm btn-error btn-ghost" aria-label="Hapus data" onclick={() => (pendingAction = { type: 'delete', item: row })} disabled={deleteLoading === row.id || row.isActive}>
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
	title={editingData ? 'Edit Semester' : 'Tambah Semester'}
	onClose={() => closeFormModal()}
	size="md"
>
	<div class="space-y-4">
		{#if formNotice}
			<NoticeBanner notice={formNotice} />
		{/if}
		<SemesterForm
			data={editingData}
			onSubmit={handleSubmit}
			onCancel={() => closeFormModal()}
			loading={formLoading}
		/>
	</div>
</Modal>

<ConfirmDialog
	open={Boolean(pendingAction)}
	title={pendingAction?.type === 'activate' ? 'Aktifkan Semester' : 'Hapus Semester'}
	description={pendingAction?.type === 'activate'
		? 'Semester terpilih akan menjadi semester aktif, dan semester aktif sebelumnya akan dinonaktifkan secara otomatis.'
		: 'Semester terpilih akan dihapus dari daftar akademik. Tindakan ini tidak dapat dibatalkan dari halaman ini.'}
	confirmLabel={pendingAction?.type === 'activate' ? 'Aktifkan semester' : 'Hapus semester'}
	confirmTone={pendingAction?.type === 'activate' ? 'success' : 'error'}
	loading={pendingAction?.type === 'activate' ? activateLoading === pendingAction?.item.id : deleteLoading === pendingAction?.item.id}
	onConfirm={() => pendingAction && (pendingAction.type === 'activate' ? confirmActivate(pendingAction.item) : confirmDelete(pendingAction.item))}
	onCancel={() => closeActionDialog()}
	summary={pendingAction
		? [
			{ label: 'Tahun ajaran', value: pendingAction.item.tahunAjaran },
			{ label: 'Semester', value: formatAcademicLabel(pendingAction.item.semester) },
			{ label: 'Status saat ini', value: pendingAction.item.isActive ? 'Aktif' : 'Tidak aktif' }
		]
		: []}
/>
