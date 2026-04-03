<script lang="ts">
	import { onMount } from 'svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import MobileCollection from '$lib/components/MobileCollection.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import NoticeBanner from '$lib/components/NoticeBanner.svelte';
	import EnrollmentForm from '$lib/components/forms/EnrollmentForm.svelte';
	import { enrollmentService } from '$lib/api/services/enrollment';
	import type { NoticeMessage } from '$lib/types/notice';
	import { formatAcademicLabel } from '$lib/utils/format-label';
	import { describeRequestFailure } from '$lib/utils/request-notice';
	import { getEnrollmentStatusChip } from '$lib/utils/status-chip';
	import type { Enrollment, EnrollmentFormData } from '$lib/types';

	let { data: pageData }: { data: import('./$types').PageData } = $props();

	// svelte-ignore state_referenced_locally
	let data = $state<Enrollment[]>(pageData.initialEnrollments);
	let loading = $state(false);
	let error = $state('');
	let pageNotice = $state<NoticeMessage | null>(null);
	let formNotice = $state<NoticeMessage | null>(null);
	let deleteTarget = $state<Enrollment | null>(null);

	// svelte-ignore state_referenced_locally
	let pagination = $state(pageData.initialPagination);

	let isModalOpen = $state(false);
	let editingData = $state<Enrollment | undefined>(undefined);
	let formLoading = $state(false);
	let deleteLoading = $state<number | null>(null);

	async function loadData() {
		loading = true;
		error = '';
		try {
			const response = await enrollmentService.getAll({
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

	function openEdit(item: Enrollment) {
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

	function openDeleteDialog(item: Enrollment) {
		deleteTarget = item;
	}

	function closeDeleteDialog(force = false) {
		if (deleteLoading !== null && !force) return;
		deleteTarget = null;
	}

	async function handleSubmit(formData: EnrollmentFormData) {
		formNotice = null;
		formLoading = true;
		try {
			if (editingData) {
				const response = await enrollmentService.update(editingData.id, formData);
				if (response.success) {
					closeFormModal(true);
					pageNotice = {
						tone: 'success',
						title: 'Data enrollment telah diperbarui.',
						description: 'Perubahan sudah tersimpan pada daftar enrollment.'
					};
					await loadData();
				} else {
					formNotice = {
						tone: 'error',
						title: 'Perubahan enrollment belum tersimpan.',
						description: response.error || 'Periksa kembali data enrollment lalu simpan lagi.'
					};
				}
			} else {
				const response = await enrollmentService.create(formData);
				if (response.success) {
					closeFormModal(true);
					pageNotice = {
						tone: 'success',
						title: 'Enrollment baru telah ditambahkan.',
						description: 'Data enrollment baru sudah tersedia pada daftar.'
					};
					await loadData();
				} else {
					formNotice = {
						tone: 'error',
						title: 'Enrollment baru belum tersimpan.',
						description: response.error || 'Periksa kembali data enrollment lalu simpan lagi.'
					};
				}
			}
		} catch (err) {
			formNotice = describeRequestFailure(
				err,
				editingData ? 'Perubahan enrollment belum tersimpan.' : 'Enrollment baru belum tersimpan.',
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
			const response = await enrollmentService.delete(deleteTarget.id);
			if (response.success) {
				closeDeleteDialog(true);
				pageNotice = {
					tone: 'success',
					title: 'Data enrollment telah dihapus.',
					description: 'Daftar enrollment sudah diperbarui.'
				};
				await loadData();
			} else {
				pageNotice = {
					tone: 'error',
					title: 'Data enrollment belum dapat dihapus.',
					description: response.error || 'Periksa keterkaitan data enrollment ini lalu coba lagi.'
				};
			}
		} catch (err) {
			pageNotice = describeRequestFailure(err, 'Data enrollment belum dapat dihapus.', 'Coba lagi dalam beberapa saat.');
		} finally {
			deleteLoading = null;
		}
	}

	const columns = [
		{ field: 'mahasiswa.nim', header: 'NIM', sortable: false },
		{ field: 'mahasiswa.nama', header: 'Mahasiswa', sortable: false },
		{ field: 'mataKuliah.nama', header: 'Mata Kuliah', sortable: false },
		{ field: 'dosen.nama', header: 'Dosen', sortable: false },
		{ field: 'ruangKelas.kode', header: 'Ruang', sortable: false },
		{ field: 'jadwal.hari', header: 'Hari', sortable: false, badge: true },
		{ field: 'status', header: 'Status', sortable: true, badge: true }
	];
</script>

<svelte:head>
	<title>Enrollment - Sistem Akademik</title>
</svelte:head>

<div class="space-y-4">
	<div aria-live="polite">
		{#if pageNotice}
			<NoticeBanner notice={pageNotice} onDismiss={() => (pageNotice = null)} />
		{/if}
	</div>

	<PageHeader title="Enrollment" description="Kelola data pendaftaran mata kuliah" actionLabel="Tambah Enrollment" onAction={openCreate} />

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
		itemLabelPlural="enrollment"
		loadingMessage="Memuat daftar enrollment..."
		onPageChange={handlePageChange}
	>
		{#snippet item(row: Enrollment)}
			<article class="card-elevated p-4 sm:p-5">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0 space-y-1">
						<h2 class="text-lg font-display font-semibold text-balance">{row.mahasiswa?.nama || 'Mahasiswa belum terbaca'}</h2>
						<p class="text-sm text-muted">{row.mataKuliah?.nama || 'Mata kuliah belum terbaca'}</p>
						<p class="text-xs text-subtle">NIM {row.mahasiswa?.nim || '—'}</p>
					</div>
					<span class={`${getEnrollmentStatusChip(row.status)} shrink-0`}>{formatAcademicLabel(row.status)}</span>
				</div>

				<dl class="mt-4 grid gap-3 text-sm sm:grid-cols-3">
					<div class="space-y-1">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Dosen</dt>
						<dd class="text-sm font-medium text-base-content">{row.dosen?.nama || 'Dosen belum terbaca'}</dd>
					</div>
					<div class="space-y-1">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Ruang</dt>
						<dd class="text-sm font-medium text-base-content">{row.ruangKelas?.kode || '—'}</dd>
					</div>
					<div class="space-y-1">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Hari</dt>
						<dd><span class="status-chip tone-slate">{formatAcademicLabel(row.jadwal?.hari)}</span></dd>
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
		ariaLabel="Daftar enrollment"
		tableClass="min-w-[56rem]"
		desktopOnly
		desktopVisibilityClass="hidden xl:block"
		onPageChange={handlePageChange}
	>
			{#snippet actions(row: Enrollment)}
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
	title={editingData ? 'Edit Enrollment' : 'Tambah Enrollment'}
	onClose={() => closeFormModal()}
	size="lg"
>
	<div class="space-y-4">
		{#if formNotice}
			<NoticeBanner notice={formNotice} />
		{/if}
		<EnrollmentForm
			data={editingData}
			onSubmit={handleSubmit}
			onCancel={() => closeFormModal()}
			loading={formLoading}
		/>
	</div>
</Modal>

<ConfirmDialog
	open={Boolean(deleteTarget)}
	title="Hapus Enrollment"
	description="Enrollment akan dihapus dari daftar akademik. Tindakan ini tidak dapat dibatalkan dari halaman ini."
	confirmLabel="Hapus enrollment"
	confirmTone="error"
	loading={deleteLoading === deleteTarget?.id}
	onConfirm={confirmDelete}
	onCancel={() => closeDeleteDialog()}
	summary={
		deleteTarget
			? [
				{ label: 'Mahasiswa', value: deleteTarget.mahasiswa?.nama || 'Mahasiswa belum terbaca' },
				{ label: 'Mata kuliah', value: deleteTarget.mataKuliah?.nama || 'Mata kuliah belum terbaca' },
				{ label: 'Status', value: formatAcademicLabel(deleteTarget.status) }
			]
			: []
	}
/>
