<script lang="ts">
	import { onMount } from 'svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import MobileCollection from '$lib/components/MobileCollection.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import NoticeBanner from '$lib/components/NoticeBanner.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import KRSForm from '$lib/components/forms/KRSForm.svelte';
	import { krsService } from '$lib/api/services/krs';
	import { mataKuliahService } from '$lib/api/services/mataKuliah';
	import type { NoticeMessage } from '$lib/types/notice';
	import { formatAcademicLabel } from '$lib/utils/format-label';
	import { describeRequestFailure } from '$lib/utils/request-notice';
	import { getKrsStatusChip } from '$lib/utils/status-chip';
	import { StatusKRS } from '$lib/types';
	import type { KRS, KRSDetail, KRSFormData, MataKuliah } from '$lib/types';

	type PendingAction =
		| { type: 'delete' | 'submit' | 'approve' | 'reject'; item: KRS }
		| { type: 'remove-course'; detail: KRSDetail };

	let data = $state<KRS[]>([]);
	let loading = $state(false);
	let error = $state('');
	let pageNotice = $state<NoticeMessage | null>(null);
	let formNotice = $state<NoticeMessage | null>(null);
	let detailNotice = $state<NoticeMessage | null>(null);
	let pendingAction = $state<PendingAction | null>(null);

	let pagination = $state({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0
	});

	let isModalOpen = $state(false);
	let editingData = $state<KRS | undefined>(undefined);
	let formLoading = $state(false);
	let deleteLoading = $state<number | null>(null);
	let actionLoading = $state<{ id: number; action: string } | null>(null);
	let detailModalOpen = $state(false);
	let selectedKrs = $state<KRS | null>(null);
	let detailLoading = $state(false);
	let detailError = $state('');
	let courseOptions = $state<MataKuliah[]>([]);
	let selectedCourseId = $state<number | ''>('');
	let detailActionLoading = $state<string | null>(null);

	async function loadData() {
		loading = true;
		error = '';
		try {
			const response = await krsService.getAll({
				page: pagination.page,
				limit: pagination.limit,
				includeDetails: true
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

	function openEdit(item: KRS) {
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

	async function loadCourseOptions(krs: KRS) {
		const programStudiId = krs.mahasiswa?.programStudi?.id;
		const selectedCourseIds = new Set(krs.details?.map((detail) => detail.mataKuliahId) ?? []);

		if (!programStudiId || krs.status !== 'DRAFT') {
			courseOptions = [];
			selectedCourseId = '';
			return;
		}

		const response = await mataKuliahService.getAll({
			limit: 100,
			programStudiId
		});

		if (!response.success) {
			courseOptions = [];
			selectedCourseId = '';
			detailError = response.error || 'Daftar mata kuliah belum berhasil dimuat.';
			return;
		}

		courseOptions = response.data
			.filter((course) => !selectedCourseIds.has(course.id))
			.sort((a, b) => a.semester - b.semester || a.kode.localeCompare(b.kode));
		selectedCourseId = courseOptions[0]?.id ?? '';
	}

	async function loadKrsDetail(id: number) {
		detailLoading = true;
		detailError = '';

		try {
			const response = await krsService.getById(id);

			if (!response.success) {
				detailError = response.error || 'Detail KRS belum berhasil dimuat.';
				selectedKrs = null;
				courseOptions = [];
				selectedCourseId = '';
				return;
			}

			selectedKrs = response.data;
			await loadCourseOptions(response.data);
		} catch (err) {
			detailError = 'Koneksi bermasalah. Detail KRS belum berhasil dimuat.';
			selectedKrs = null;
			courseOptions = [];
			selectedCourseId = '';
		} finally {
			detailLoading = false;
		}
	}

	async function openDetail(item: KRS) {
		detailModalOpen = true;
		selectedKrs = null;
		courseOptions = [];
		selectedCourseId = '';
		detailNotice = null;
		await loadKrsDetail(item.id);
	}

	function closeDetail() {
		detailModalOpen = false;
		selectedKrs = null;
		detailError = '';
		courseOptions = [];
		selectedCourseId = '';
		detailActionLoading = null;
		detailNotice = null;
	}

	async function handleSubmit(formData: KRSFormData) {
		formNotice = null;
		formLoading = true;
		try {
			if (editingData) {
				const response = await krsService.update(editingData.id, {
					status: StatusKRS.DRAFT
				});
				if (response.success) {
					closeFormModal(true);
					await loadData();
					pageNotice = { tone: 'success', title: 'KRS telah dikembalikan ke draf.', description: 'KRS dapat ditinjau dan diajukan ulang.' };
					if (selectedKrs?.id === editingData.id) {
						await loadKrsDetail(editingData.id);
					}
				} else {
					formNotice = { tone: 'error', title: 'Perubahan status KRS belum tersimpan.', description: response.error || 'Coba lagi dalam beberapa saat.' };
				}
			} else {
				const response = await krsService.create(formData);
				if (response.success) {
					closeFormModal(true);
					await loadData();
					pageNotice = { tone: 'success', title: 'KRS baru telah ditambahkan.', description: 'Data KRS baru sudah tersedia pada daftar.' };
				} else {
					formNotice = { tone: 'error', title: 'KRS baru belum tersimpan.', description: response.error || 'Periksa kembali data KRS lalu simpan lagi.' };
				}
			}
		} catch (err) {
			formNotice = describeRequestFailure(err, editingData ? 'Perubahan KRS belum tersimpan.' : 'KRS baru belum tersimpan.', 'Coba lagi dalam beberapa saat.');
		} finally {
			formLoading = false;
		}
	}

	const remainingSks = $derived(selectedKrs ? Math.max(24 - (selectedKrs.totalSks ?? 0), 0) : 24);
	const selectedCourse = $derived(
		courseOptions.find((course) => course.id === Number(selectedCourseId)) ?? null
	);
	const wouldExceedSksLimit = $derived(
		selectedCourse ? selectedCourse.sks > remainingSks : false
	);

	async function handleAddCourse() {
		if (!selectedKrs || selectedCourseId === '') {
			return;
		}

		detailActionLoading = 'add-course';
		detailNotice = null;
		try {
			const response = await krsService.addCourse(selectedKrs.id, Number(selectedCourseId));

			if (!response.success) {
				detailNotice = {
					tone: 'error',
					title: 'Mata kuliah belum berhasil ditambahkan.',
					description: response.error || 'Periksa kembali pilihan mata kuliah lalu coba lagi.'
				};
				return;
			}

			const nextSelectedKrs: KRS = {
				...selectedKrs,
				details: [...(selectedKrs.details ?? []), response.data],
				totalSks: (selectedKrs.totalSks ?? 0) + (response.data.mataKuliah?.sks ?? 0)
			};
			selectedKrs = nextSelectedKrs;
			data = data.map((item) =>
				item.id === nextSelectedKrs.id
					? { ...item, totalSks: nextSelectedKrs.totalSks, details: nextSelectedKrs.details }
					: item
			);
			await loadCourseOptions(nextSelectedKrs);
			detailNotice = { tone: 'success', title: 'Mata kuliah berhasil ditambahkan ke KRS.', description: 'Detail KRS telah diperbarui.' };
		} catch (err) {
			detailNotice = describeRequestFailure(err, 'Mata kuliah belum berhasil ditambahkan.', 'Coba lagi dalam beberapa saat.');
		} finally {
			detailActionLoading = null;
		}
	}

	async function confirmPendingAction() {
		if (!pendingAction) return;

		if (pendingAction.type === 'remove-course') {
			if (!selectedKrs) return;
			const removedDetail = pendingAction.detail;
			detailActionLoading = `remove-${removedDetail.id}`;
			detailNotice = null;
			try {
				const response = await krsService.removeCourse(selectedKrs.id, removedDetail.mataKuliahId);

				if (!response.success) {
					detailNotice = { tone: 'error', title: 'Mata kuliah belum berhasil dihapus.', description: response.error || 'Coba lagi dalam beberapa saat.' };
					return;
				}

				const nextSelectedKrs: KRS = {
					...selectedKrs,
					details: (selectedKrs.details ?? []).filter((detail) => detail.id !== removedDetail.id),
					totalSks: Math.max((selectedKrs.totalSks ?? 0) - (removedDetail.mataKuliah?.sks ?? 0), 0)
				};
				selectedKrs = nextSelectedKrs;
				data = data.map((item) =>
					item.id === nextSelectedKrs.id
						? { ...item, totalSks: nextSelectedKrs.totalSks, details: nextSelectedKrs.details }
						: item
				);
				await loadCourseOptions(nextSelectedKrs);
				detailNotice = { tone: 'success', title: 'Mata kuliah berhasil dihapus dari KRS.', description: 'Detail KRS telah diperbarui.' };
				pendingAction = null;
			} catch (err) {
				detailNotice = describeRequestFailure(err, 'Mata kuliah belum berhasil dihapus.', 'Coba lagi dalam beberapa saat.');
			} finally {
				detailActionLoading = null;
			}
			return;
		}

		const item = pendingAction.item;
		if (pendingAction.type === 'delete') {
			deleteLoading = item.id;
			try {
				const response = await krsService.delete(item.id);
				if (response.success) {
					await loadData();
					if (selectedKrs?.id === item.id) {
						closeDetail();
					}
					pageNotice = { tone: 'success', title: 'Data KRS telah dihapus.', description: 'Daftar KRS sudah diperbarui.' };
					pendingAction = null;
				} else {
					pageNotice = { tone: 'error', title: 'Data KRS belum dapat dihapus.', description: response.error || 'Coba lagi dalam beberapa saat.' };
				}
			} catch (err) {
				pageNotice = describeRequestFailure(err, 'Data KRS belum dapat dihapus.', 'Coba lagi dalam beberapa saat.');
			} finally {
				deleteLoading = null;
			}
			return;
		}

		actionLoading = { id: item.id, action: pendingAction.type };
		try {
			const response =
				pendingAction.type === 'submit'
					? await krsService.submit(item.id)
					: pendingAction.type === 'approve'
						? await krsService.approve(item.id)
						: await krsService.reject(item.id);

			if (response.success) {
				data = data.map((existing) => (existing.id === response.data.id ? response.data : existing));
				if (selectedKrs?.id === item.id) {
					selectedKrs = response.data;
					await loadCourseOptions(response.data);
				}
				pageNotice = {
					tone: 'success',
					title:
						pendingAction.type === 'submit'
							? 'KRS berhasil diajukan.'
							: pendingAction.type === 'approve'
								? 'KRS berhasil disetujui.'
								: 'KRS berhasil ditolak.',
					description: 'Status KRS sudah diperbarui.'
				};
				pendingAction = null;
			} else {
				pageNotice = { tone: 'error', title: 'Permintaan KRS belum berhasil diproses.', description: response.error || 'Coba lagi dalam beberapa saat.' };
			}
		} catch (err) {
			pageNotice = describeRequestFailure(err, 'Permintaan KRS belum berhasil diproses.', 'Coba lagi dalam beberapa saat.');
		} finally {
			actionLoading = null;
		}
	}

	onMount(() => {
		loadData();
	});

	const columns = [
		{ field: 'mahasiswa.nim', header: 'NIM', sortable: false },
		{ field: 'mahasiswa.nama', header: 'Mahasiswa', sortable: false },
		{ field: 'semester.tahunAjaran', header: 'Tahun Ajaran', sortable: false },
		{ field: 'semester.semester', header: 'Semester', sortable: false, badge: true },
		{ field: 'totalSks', header: 'Total SKS', sortable: false },
		{ field: 'status', header: 'Status', sortable: true, badge: true },
		{ field: 'tanggalSubmit', header: 'Tanggal Submit', sortable: false }
	];

	const confirmActionLabels: Record<string, { title: string; description: string; confirmLabel: string }> = {
		delete: {
			title: 'Hapus KRS',
			description: 'Data KRS akan dihapus dari daftar akademik. Tindakan ini tidak dapat dibatalkan dari halaman ini.',
			confirmLabel: 'Hapus KRS'
		},
		submit: {
			title: 'Ajukan KRS',
			description: 'KRS terpilih akan diajukan untuk ditinjau.',
			confirmLabel: 'Ajukan KRS'
		},
		approve: {
			title: 'Setujui KRS',
			description: 'KRS terpilih akan disetujui dan siap dipakai pada proses akademik berikutnya.',
			confirmLabel: 'Setujui KRS'
		},
		reject: {
			title: 'Tolak KRS',
			description: 'KRS terpilih akan ditolak dan perlu dikembalikan ke draf jika ingin diajukan ulang.',
			confirmLabel: 'Tolak KRS'
		},
		'remove-course': {
			title: 'Hapus Mata Kuliah dari KRS',
			description: 'Mata kuliah terpilih akan dihapus dari detail KRS ini.',
			confirmLabel: 'Hapus mata kuliah'
		}
	};

	let confirmDialogTitle = $derived(
		pendingAction ? confirmActionLabels[pendingAction.type]?.title ?? '' : ''
	);
	let confirmDialogDescription = $derived(
		pendingAction ? confirmActionLabels[pendingAction.type]?.description ?? '' : ''
	);
	let confirmDialogLabel = $derived(
		pendingAction ? confirmActionLabels[pendingAction.type]?.confirmLabel ?? '' : ''
	);
	let confirmDialogTone = $derived<'error' | 'success' | 'primary'>(
		pendingAction?.type === 'delete' || pendingAction?.type === 'remove-course' || pendingAction?.type === 'reject'
			? 'error'
			: pendingAction?.type === 'approve' ? 'success' : 'primary'
	);
	let confirmDialogLoading = $derived(
		pendingAction?.type === 'delete'
			? deleteLoading === (pendingAction as { type: 'delete'; item: KRS }).item.id
			: pendingAction?.type === 'remove-course'
				? detailActionLoading === `remove-${(pendingAction as { type: 'remove-course'; detail: KRSDetail }).detail.id}`
				: pendingAction && 'item' in pendingAction ? actionLoading?.id === pendingAction.item.id : false
	);
	let confirmDialogSummary = $derived(
		pendingAction
			? pendingAction.type === 'remove-course'
				? [
					{ label: 'Mata kuliah', value: pendingAction.detail.mataKuliah?.nama || 'Mata kuliah belum terbaca' },
					{ label: 'Kode', value: pendingAction.detail.mataKuliah?.kode || '—' }
				]
				: [
					{ label: 'Mahasiswa', value: (pendingAction as { type: string; item: KRS }).item.mahasiswa?.nama || 'Mahasiswa belum terbaca' },
					{ label: 'Semester', value: `${(pendingAction as { type: string; item: KRS }).item.semester?.tahunAjaran || ''} ${formatAcademicLabel((pendingAction as { type: string; item: KRS }).item.semester?.semester)}`.trim() || 'Semester belum terbaca' },
					{ label: 'Status', value: formatAcademicLabel((pendingAction as { type: string; item: KRS }).item.status) }
				]
			: []
	);
</script>

<svelte:head>
	<title>KRS - Sistem Akademik</title>
</svelte:head>

<div class="space-y-4">
	<div aria-live="polite">
		{#if pageNotice}
			<NoticeBanner notice={pageNotice} onDismiss={() => (pageNotice = null)} />
		{/if}
	</div>

	<PageHeader title="KRS" description="Kelola data Kartu Rencana Studi" actionLabel="Buat KRS" onAction={openCreate} />

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
		itemLabelPlural="KRS"
		loadingMessage="Memuat daftar KRS..."
		onPageChange={handlePageChange}
	>
		{#snippet item(row: KRS)}
			<article class="card-elevated space-y-4 p-4 sm:p-5">
				<div class="space-y-2">
					<p class="text-xs font-medium uppercase tracking-[0.18em] text-subtle">NIM {row.mahasiswa?.nim || '—'}</p>
					<h2 class="text-lg font-display font-semibold text-balance">{row.mahasiswa?.nama || 'Mahasiswa belum terbaca'}</h2>
				</div>

				<dl class="grid gap-3 sm:grid-cols-2">
					<div class="space-y-1 sm:col-span-2">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Semester</dt>
						<dd class="text-sm font-medium text-base-content">{row.semester?.tahunAjaran} {formatAcademicLabel(row.semester?.semester)}</dd>
					</div>
					<div class="space-y-1">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Status</dt>
						<dd><span class={getKrsStatusChip(row.status)}>{formatAcademicLabel(row.status)}</span></dd>
					</div>
					<div class="space-y-1">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Total SKS</dt>
						<dd class="text-sm font-medium text-base-content">{row.totalSks ?? 0} SKS</dd>
					</div>
					<div class="space-y-1 sm:col-span-2">
						<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Tanggal pengajuan</dt>
						<dd class="text-sm font-medium text-base-content">{row.tanggalSubmit || 'Belum diajukan'}</dd>
					</div>
				</dl>

				<div class="grid gap-2">
					<button class="btn btn-outline btn-sm" onclick={() => openDetail(row)}>Detail</button>
					{#if row.status === 'DRAFT'}
					<button
						class="btn btn-info btn-sm"
						onclick={() => (pendingAction = { type: 'submit', item: row })}
						disabled={actionLoading?.id === row.id}
					>
							{#if actionLoading?.id === row.id && actionLoading.action === 'submit'}
								<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
							{/if}
							Ajukan
						</button>
					{:else if row.status === 'SUBMITTED'}
						<div class="grid gap-2 sm:grid-cols-2">
							<button
								class="btn btn-success btn-sm"
								onclick={() => (pendingAction = { type: 'approve', item: row })}
								disabled={actionLoading?.id === row.id}
							>
								{#if actionLoading?.id === row.id && actionLoading.action === 'approve'}
									<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
								{/if}
								Setujui
							</button>
							<button
								class="btn btn-error btn-sm"
								onclick={() => (pendingAction = { type: 'reject', item: row })}
								disabled={actionLoading?.id === row.id}
							>
								{#if actionLoading?.id === row.id && actionLoading.action === 'reject'}
									<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
								{/if}
								Tolak
							</button>
						</div>
					{:else if row.status === 'REJECTED'}
						<button class="btn btn-warning btn-sm" onclick={() => openEdit(row)} disabled={actionLoading?.id === row.id || deleteLoading === row.id}>
							Kembalikan ke draf
						</button>
					{/if}
					<button class="btn btn-error btn-outline btn-sm" onclick={() => (pendingAction = { type: 'delete', item: row })} disabled={deleteLoading === row.id || actionLoading?.id === row.id}>
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
		ariaLabel="Daftar KRS"
		tableClass="min-w-[52rem]"
		desktopOnly
		desktopVisibilityClass="hidden xl:block"
		onPageChange={handlePageChange}
	>
			{#snippet actions(row: KRS)}
				<button class="btn btn-sm btn-ghost" onclick={() => openDetail(row)}>
					Detail
				</button>
				{#if row.status === 'DRAFT'}
					<button
						class="btn btn-sm btn-info"
						onclick={() => (pendingAction = { type: 'submit', item: row })}
						disabled={actionLoading?.id === row.id}
					>
						{#if actionLoading?.id === row.id && actionLoading.action === 'submit'}
							<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
						{:else}
							Ajukan
						{/if}
					</button>
				{:else if row.status === 'SUBMITTED'}
					<button
						class="btn btn-sm btn-success"
						onclick={() => (pendingAction = { type: 'approve', item: row })}
						disabled={actionLoading?.id === row.id}
					>
						{#if actionLoading?.id === row.id && actionLoading.action === 'approve'}
							<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
						{:else}
							Setujui
						{/if}
					</button>
					<button
						class="btn btn-sm btn-error"
						onclick={() => (pendingAction = { type: 'reject', item: row })}
						disabled={actionLoading?.id === row.id}
					>
						{#if actionLoading?.id === row.id && actionLoading.action === 'reject'}
							<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
						{:else}
							Tolak
						{/if}
					</button>
				{:else if row.status === 'REJECTED'}
					<button
						class="btn btn-sm btn-warning"
						onclick={() => openEdit(row)}
						disabled={actionLoading?.id === row.id || deleteLoading === row.id}
					>
						Kembalikan
					</button>
				{/if}
				<button class="btn btn-sm btn-error btn-ghost" aria-label="Hapus data" onclick={() => (pendingAction = { type: 'delete', item: row })} disabled={deleteLoading === row.id || actionLoading?.id === row.id}>
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
	title={editingData ? 'Kembalikan KRS ke Draft' : 'Buat KRS'}
	onClose={() => closeFormModal()}
	size={editingData ? 'sm' : 'md'}
>
	<div class="space-y-4">
		{#if formNotice}
			<NoticeBanner notice={formNotice} />
		{/if}
		<KRSForm
			data={editingData}
			onSubmit={handleSubmit}
			onCancel={() => closeFormModal()}
			loading={formLoading}
		/>
	</div>
</Modal>

<Modal
	open={detailModalOpen}
	title="Detail KRS"
	onClose={closeDetail}
	size="xl"
>
	{#if detailLoading && !selectedKrs}
		<div class="flex justify-center py-12" role="status">
			<span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
			<span class="sr-only">Memuat detail KRS...</span>
		</div>
	{:else if detailError && !selectedKrs}
		<div class="alert alert-error" role="alert">
			<span>{detailError}</span>
		</div>
	{:else if selectedKrs}
		<div class="space-y-5">
			{#if detailNotice}
				<NoticeBanner notice={detailNotice} onDismiss={() => (detailNotice = null)} />
			{/if}

			<div class="grid gap-x-6 gap-y-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 divide-base-300/50">
				<div class="py-3">
					<p class="text-sm text-muted">Mahasiswa</p>
					<p class="mt-2 font-semibold">{selectedKrs.mahasiswa?.nim} - {selectedKrs.mahasiswa?.nama}</p>
					<p class="mt-1 text-xs text-muted">IPK {selectedKrs.mahasiswa ? selectedKrs.mahasiswa.ipk.toFixed(2) : '0.00'}</p>
				</div>
				<div class="py-3">
					<p class="text-sm text-muted">Semester</p>
					<p class="mt-2 font-semibold">{selectedKrs.semester?.tahunAjaran} {formatAcademicLabel(selectedKrs.semester?.semester)}</p>
					<p class="mt-1 text-xs text-muted">Program studi {selectedKrs.mahasiswa?.programStudi?.nama}</p>
				</div>
				<div class="py-3">
					<p class="text-sm text-muted">Status</p>
					<p class="mt-2 font-semibold">{formatAcademicLabel(selectedKrs.status)}</p>
					<p class="mt-1 text-xs text-muted">Tanggal pengajuan {selectedKrs.tanggalSubmit || 'belum tercatat'}</p>
				</div>
				<div class="py-3">
					<p class="text-sm text-muted">Total SKS</p>
					<p class="mt-2 font-semibold">{selectedKrs.totalSks ?? 0} SKS</p>
					<p class="mt-1 text-xs text-muted">Sisa kapasitas {remainingSks} SKS</p>
				</div>
			</div>

			{#if selectedKrs.status === 'DRAFT'}
				<div class="rounded-lg border border-base-300 bg-base-100 p-4 space-y-4">
					<div>
						<h3 class="font-semibold">Kelola Mata Kuliah KRS</h3>
						<p class="text-sm text-muted">Tambahkan mata kuliah selama KRS masih berstatus draft. Validasi batas 24 SKS tetap dijalankan di backend.</p>
					</div>

					{#if courseOptions.length === 0}
						<div class="alert alert-info" role="status">
							<span>Tidak ada mata kuliah tambahan yang tersedia untuk program studi ini.</span>
						</div>
					{:else}
						<div class="flex flex-col gap-3 lg:flex-row lg:items-end">
							<label class="form-control flex-1">
								<span class="label-text font-medium">Tambahkan mata kuliah</span>
								<select class="select select-bordered w-full" bind:value={selectedCourseId}>
									{#each courseOptions as course}
										<option value={course.id}>{course.kode} - {course.nama} ({course.sks} SKS)</option>
									{/each}
								</select>
							</label>
							<button
								class="btn btn-primary"
								onclick={handleAddCourse}
								disabled={detailActionLoading === 'add-course' || selectedCourseId === '' || wouldExceedSksLimit}
							>
								{#if detailActionLoading === 'add-course'}
									<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
								{/if}
								Tambah Mata Kuliah
							</button>
						</div>

						{#if selectedCourse}
							<div aria-live="polite" aria-atomic="true">
								<p class="text-xs text-muted">Semester rekomendasi {selectedCourse.semester} • {selectedCourse.sks} SKS</p>
								{#if wouldExceedSksLimit}
									<p class="mt-1 text-xs text-warning">Mata kuliah ini melebihi sisa kapasitas SKS untuk KRS ini.</p>
								{/if}
							</div>
						{/if}
					{/if}
				</div>
			{/if}

			{#if detailError}
				<div class="alert alert-warning" role="alert">
					<span>{detailError}</span>
				</div>
			{/if}

			<div class="space-y-3 lg:hidden">
				{#if detailLoading}
					<div class="rounded-lg border border-base-300/70 bg-base-200/40 px-4 py-5 text-sm text-muted">
						Memuat detail KRS...
					</div>
				{:else if !selectedKrs.details || selectedKrs.details.length === 0}
					<div class="rounded-lg border border-base-300/70 bg-base-200/40 px-4 py-5 text-sm text-muted">
						Belum ada mata kuliah di KRS ini.
					</div>
				{:else}
					{#each selectedKrs.details as detail}
						<div class="rounded-lg border border-base-300/70 bg-base-100 p-4 space-y-3">
							<div>
								<p class="font-medium text-base-content">{detail.mataKuliah?.kode} - {detail.mataKuliah?.nama}</p>
								<p class="text-xs text-muted">Semester {detail.mataKuliah?.semester} • {detail.mataKuliah?.sks} SKS</p>
							</div>
							{#if selectedKrs.status === 'DRAFT'}
								<button
									class="btn btn-error btn-outline btn-sm w-full"
									onclick={() => (pendingAction = { type: 'remove-course', detail })}
									disabled={detailActionLoading === `remove-${detail.id}`}
								>
									{#if detailActionLoading === `remove-${detail.id}`}
										<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
									{/if}
									Hapus mata kuliah
								</button>
							{/if}
						</div>
					{/each}
				{/if}
			</div>

		<div class="hidden overflow-x-auto rounded-lg border border-base-300 lg:block">
			<table class="table-refined w-full min-w-[34rem]" aria-label="Detail mata kuliah KRS">
				<thead>
				<tr>
					<th scope="col">Kode</th>
					<th scope="col">Mata Kuliah</th>
						<th scope="col" class="text-right">SKS</th>
						<th scope="col" class="text-right">Semester</th>
						{#if selectedKrs.status === 'DRAFT'}
							<th scope="col" class="text-right">Aksi</th>
						{/if}
					</tr>
					</thead>
					<tbody>
						{#if detailLoading}
							<tr>
								<td colspan={selectedKrs.status === 'DRAFT' ? 5 : 4} class="py-8 text-center text-muted">Memuat detail KRS...</td>
							</tr>
						{:else if !selectedKrs.details || selectedKrs.details.length === 0}
							<tr>
								<td colspan={selectedKrs.status === 'DRAFT' ? 5 : 4} class="py-8 text-center text-muted">Belum ada mata kuliah di KRS ini.</td>
							</tr>
						{:else}
							{#each selectedKrs.details as detail}
								<tr>
									<td>{detail.mataKuliah?.kode}</td>
									<td>{detail.mataKuliah?.nama}</td>
									<td class="text-right">{detail.mataKuliah?.sks}</td>
									<td class="text-right">{detail.mataKuliah?.semester}</td>
									{#if selectedKrs.status === 'DRAFT'}
										<td class="text-right">
									<button
										class="btn btn-sm btn-error btn-ghost"
										onclick={() => (pendingAction = { type: 'remove-course', detail })}
										disabled={detailActionLoading === `remove-${detail.id}`}
									>
												{#if detailActionLoading === `remove-${detail.id}`}
													<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
												{:else}
													Hapus
												{/if}
											</button>
										</td>
									{/if}
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</Modal>

<ConfirmDialog
	open={Boolean(pendingAction)}
	title={confirmDialogTitle}
	description={confirmDialogDescription}
	confirmLabel={confirmDialogLabel}
	confirmTone={confirmDialogTone}
	loading={confirmDialogLoading}
	onConfirm={confirmPendingAction}
	onCancel={() => (pendingAction = null)}
	summary={confirmDialogSummary}
/>
