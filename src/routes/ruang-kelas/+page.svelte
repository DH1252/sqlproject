<script lang="ts">
	import { onMount } from 'svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import MobileCollection from '$lib/components/MobileCollection.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import NoticeBanner from '$lib/components/NoticeBanner.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import RuangKelasForm from '$lib/components/forms/RuangKelasForm.svelte';
	import { ruangKelasService } from '$lib/api/services/ruangKelas';
	import { semesterService } from '$lib/api/services/semester';
	import type { NoticeMessage } from '$lib/types/notice';
	import { formatAcademicLabel } from '$lib/utils/format-label';
	import { describeRequestFailure } from '$lib/utils/request-notice';
	import { getRuangStatusChip } from '$lib/utils/status-chip';
	import type {
		RuangKelas,
		RuangKelasFormData,
		RuangKelasUtilizationResponse,
		StatusRuangKelas,
		TipeRuangKelas
	} from '$lib/types';

	let data = $state<RuangKelas[]>([]);
	let loading = $state(false);
	let error = $state('');
	let searchQuery = $state('');
	let filterTipe = $state<TipeRuangKelas | ''>('');
	let filterStatus = $state<StatusRuangKelas | ''>('');
	let pageNotice = $state<NoticeMessage | null>(null);
	let formNotice = $state<NoticeMessage | null>(null);
	let deleteTarget = $state<RuangKelas | null>(null);

	let pagination = $state({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0
	});

	let isModalOpen = $state(false);
	let editingData = $state<RuangKelas | undefined>(undefined);
	let formLoading = $state(false);
	let deleteLoading = $state<number | null>(null);
	let utilizationReport = $state<RuangKelasUtilizationResponse | null>(null);
	let utilizationLoading = $state(false);
	let utilizationError = $state('');

	async function loadData() {
		loading = true;
		error = '';
		try {
			const response = await ruangKelasService.getAll({
				page: pagination.page,
				limit: pagination.limit,
				search: searchQuery.trim() || undefined,
				tipe: filterTipe || undefined,
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

	async function loadUtilization() {
		utilizationLoading = true;
		utilizationError = '';

		try {
			const activeSemesterResponse = await semesterService.getActive();
			const utilizationResponse = await ruangKelasService.getUtilization(
				activeSemesterResponse.success ? activeSemesterResponse.data.id : undefined
			);

			if (utilizationResponse.success) {
				utilizationReport = utilizationResponse.data;
			} else {
				utilizationError = utilizationResponse.error || 'Laporan utilisasi belum berhasil dimuat.';
			}
		} catch (err) {
			utilizationError = 'Koneksi bermasalah saat memuat laporan utilisasi.';
		} finally {
			utilizationLoading = false;
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

	function openEdit(item: RuangKelas) {
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

	function openDeleteDialog(item: RuangKelas) {
		deleteTarget = item;
	}

	function closeDeleteDialog(force = false) {
		if (deleteLoading !== null && !force) return;
		deleteTarget = null;
	}

	async function handleSubmit(formData: RuangKelasFormData) {
		formNotice = null;
		formLoading = true;
		try {
			if (editingData) {
				const response = await ruangKelasService.update(editingData.id, formData);
				if (response.success) {
					closeFormModal(true);
					await Promise.all([loadData(), loadUtilization()]);
					pageNotice = { tone: 'success', title: `Ruang kelas ${formData.nama} telah diperbarui.`, description: 'Perubahan ruang kelas sudah tersimpan.' };
				} else {
					formNotice = { tone: 'error', title: 'Perubahan ruang kelas belum tersimpan.', description: response.error || 'Periksa kembali data ruang kelas lalu simpan lagi.' };
				}
			} else {
				const response = await ruangKelasService.create(formData);
				if (response.success) {
					closeFormModal(true);
					await Promise.all([loadData(), loadUtilization()]);
					pageNotice = { tone: 'success', title: `Ruang kelas ${formData.nama} telah ditambahkan.`, description: 'Data ruang kelas baru sudah tersedia pada daftar.' };
				} else {
					formNotice = { tone: 'error', title: 'Ruang kelas baru belum tersimpan.', description: response.error || 'Periksa kembali data ruang kelas lalu simpan lagi.' };
				}
			}
		} catch (err) {
			formNotice = describeRequestFailure(err, editingData ? 'Perubahan ruang kelas belum tersimpan.' : 'Ruang kelas baru belum tersimpan.', 'Coba lagi dalam beberapa saat.');
		} finally {
			formLoading = false;
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		deleteLoading = deleteTarget.id;
		try {
			const response = await ruangKelasService.delete(deleteTarget.id);
			if (response.success) {
				await Promise.all([loadData(), loadUtilization()]);
				const deletedName = deleteTarget.nama;
				closeDeleteDialog(true);
				pageNotice = { tone: 'success', title: `Ruang kelas ${deletedName} telah dihapus.`, description: 'Daftar ruang kelas sudah diperbarui.' };
			} else {
				pageNotice = { tone: 'error', title: 'Ruang kelas belum dapat dihapus.', description: response.error || 'Periksa keterkaitan data ruang kelas ini lalu coba lagi.' };
			}
		} catch (err) {
			pageNotice = describeRequestFailure(err, 'Ruang kelas belum dapat dihapus.', 'Coba lagi dalam beberapa saat.');
		} finally {
			deleteLoading = null;
		}
	}

	onMount(() => {
		loadData();
		loadUtilization();
	});

	const utilizationLabel = $derived(
		utilizationReport?.semester
			? `${utilizationReport.semester.tahunAjaran} ${utilizationReport.semester.semester}`
			: 'Semua semester'
	);

	const highlightedRooms = $derived(utilizationReport?.rooms.slice(0, 5) ?? []);

	function formatRate(value: number) {
		return `${value.toFixed(2)}%`;
	}

	const columns = [
		{ field: 'kode', header: 'Kode', sortable: true },
		{ field: 'nama', header: 'Nama', sortable: true },
		{ field: 'tipe', header: 'Tipe', sortable: true, badge: true },
		{ field: 'kapasitas', header: 'Kapasitas', sortable: true },
		{ field: 'gedung', header: 'Gedung', sortable: true },
		{ field: 'lantai', header: 'Lantai', sortable: true },
		{ field: 'status', header: 'Status', sortable: true, badge: true }
	];
</script>

<svelte:head>
	<title>Ruang Kelas - Sistem Akademik</title>
</svelte:head>

<div class="space-y-4">
	<div aria-live="polite">
		{#if pageNotice}
			<NoticeBanner notice={pageNotice} onDismiss={() => (pageNotice = null)} />
		{/if}
	</div>

	<PageHeader title="Ruang Kelas" description="Kelola data ruang kelas universitas" actionLabel="Tambah Ruang Kelas" onAction={openCreate} />

	<section class="card-elevated p-6 space-y-5">
		<div class="sr-only" aria-live="polite" aria-atomic="true">
			{#if utilizationLoading}
				Memuat ulang laporan utilisasi ruang untuk {utilizationLabel}.
			{:else if utilizationError}
				{utilizationError}
			{:else if utilizationReport}
				Laporan utilisasi ruang diperbarui untuk {utilizationLabel}.
			{/if}
		</div>

		<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h2 class="text-lg font-semibold">Laporan Utilisasi Ruang</h2>
				<p class="text-sm text-muted">Ringkasan pemakaian ruang untuk {utilizationLabel}.</p>
			</div>
			<button class="btn btn-sm btn-ghost" onclick={loadUtilization} disabled={utilizationLoading}>
				{#if utilizationLoading}
					<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
				{/if}
				Muat ulang laporan
			</button>
		</div>

		{#if utilizationError}
			<div class="alert alert-warning" role="status">
				<span>{utilizationError}</span>
			</div>
		{:else if utilizationReport}
			<div class="grid gap-x-6 gap-y-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 divide-base-300/50">
				<div class="py-3">
					<p class="text-sm text-muted">Ruang aktif</p>
					<p class="mt-2 text-2xl font-semibold">{utilizationReport.summary.activeRooms}/{utilizationReport.summary.totalRooms}</p>
				</div>
				<div class="py-3">
					<p class="text-sm text-muted">Rata-rata utilisasi</p>
					<p class="mt-2 text-2xl font-semibold">{formatRate(utilizationReport.summary.averageUtilizationRate)}</p>
				</div>
				<div class="py-3">
					<p class="text-sm text-muted">Slot terpakai</p>
					<p class="mt-2 text-2xl font-semibold">{utilizationReport.summary.totalUsedSlots}</p>
					<p class="mt-1 text-xs text-muted">dari {utilizationReport.summary.totalSlots} slot ruang</p>
				</div>
				<div class="py-3">
					<p class="text-sm text-muted">Enrollment aktif</p>
					<p class="mt-2 text-2xl font-semibold">{utilizationReport.summary.totalStudentEnrollments}</p>
					<p class="mt-1 text-xs text-muted">{utilizationReport.summary.totalScheduledSections} section terjadwal</p>
				</div>
			</div>

			<div class="space-y-3 lg:hidden">
				{#if highlightedRooms.length === 0}
					<div class="rounded-lg border border-base-300/70 bg-base-200/40 px-4 py-5 text-sm text-muted">
						Belum ada data utilisasi ruang.
					</div>
				{:else}
					{#each highlightedRooms as room}
						<div class="rounded-lg border border-base-300/70 bg-base-100 p-4 space-y-3">
							<div>
								<p class="font-medium text-base-content">{room.kode} - {room.nama}</p>
								<p class="text-xs text-muted">{room.gedung}, lantai {room.lantai}</p>
							</div>
							<dl class="grid gap-3 grid-cols-2 text-sm">
								<div>
									<dt class="text-xs uppercase tracking-[0.14em] text-subtle">Tipe</dt>
									<dd class="mt-1 font-medium">{formatAcademicLabel(room.tipe)}</dd>
								</div>
								<div>
									<dt class="text-xs uppercase tracking-[0.14em] text-subtle">Utilisasi</dt>
									<dd class="mt-1 font-medium">{formatRate(room.utilizationRate)}</dd>
								</div>
								<div>
									<dt class="text-xs uppercase tracking-[0.14em] text-subtle">Slot</dt>
									<dd class="mt-1 font-medium">{room.usedSlots}/{room.totalSlots}</dd>
								</div>
								<div>
									<dt class="text-xs uppercase tracking-[0.14em] text-subtle">Enrollment</dt>
									<dd class="mt-1 font-medium">{room.studentEnrollments}</dd>
								</div>
							</dl>
						</div>
					{/each}
				{/if}
			</div>

		<div class="hidden overflow-x-auto lg:block">
			<table class="table-refined w-full min-w-[48rem]" aria-label="Laporan utilisasi ruang kelas">
				<thead>
				<tr>
					<th scope="col">Ruang</th>
						<th scope="col">Tipe</th>
						<th scope="col" class="text-right">Utilisasi</th>
						<th scope="col" class="text-right">Slot</th>
						<th scope="col" class="text-right">Section</th>
						<th scope="col" class="text-right">Enrollment</th>
					</tr>
					</thead>
					<tbody>
						{#if utilizationLoading}
							<tr>
								<td colspan="6" class="py-10 text-center text-muted">Memuat laporan utilisasi...</td>
							</tr>
						{:else if highlightedRooms.length === 0}
							<tr>
								<td colspan="6" class="py-10 text-center text-muted">Belum ada data utilisasi ruang.</td>
							</tr>
						{:else}
							{#each highlightedRooms as room}
								<tr>
									<td>
										<div>
											<p class="font-medium">{room.kode} - {room.nama}</p>
											<p class="text-xs text-muted">{room.gedung}, lantai {room.lantai}</p>
										</div>
									</td>
									<td>{room.tipe}</td>
									<td class="text-right font-medium">{formatRate(room.utilizationRate)}</td>
									<td class="text-right">{room.usedSlots}/{room.totalSlots}</td>
									<td class="text-right">{room.scheduledSections}</td>
									<td class="text-right">{room.studentEnrollments}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<div class="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
		<div class="w-full lg:max-w-md lg:flex-1">
			<SearchInput 
				bind:value={searchQuery}
				label="Cari ruang kelas"
				ariaLabel="Cari ruang kelas berdasarkan nama ruang"
				loading={loading}
				placeholder="Nama ruang kelas"
				onSearch={handleSearch}
			/>
		</div>
		<label class="w-full space-y-2 sm:w-auto">
			<span class="block text-sm font-medium text-base-content">Tipe ruang</span>
			<select class="select select-bordered w-full sm:min-w-48" bind:value={filterTipe} onchange={() => { pagination.page = 1; loadData(); }} aria-label="Filter tipe ruang kelas">
				<option value="">Semua Tipe</option>
				<option value="REGULER">Reguler</option>
				<option value="LAB_KOMPUTER">Lab Komputer</option>
				<option value="LAB_BAHASA">Lab Bahasa</option>
				<option value="AUDITORIUM">Auditorium</option>
			</select>
		</label>
		<label class="w-full space-y-2 sm:w-auto">
			<span class="block text-sm font-medium text-base-content">Status ruang</span>
			<select class="select select-bordered w-full sm:min-w-48" bind:value={filterStatus} onchange={() => { pagination.page = 1; loadData(); }} aria-label="Filter status ruang kelas">
				<option value="">Semua Status</option>
				<option value="AVAILABLE">Tersedia</option>
				<option value="MAINTENANCE">Dalam Perbaikan</option>
				<option value="UNAVAILABLE">Tidak Tersedia</option>
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
		itemLabelPlural="ruang kelas"
		loadingMessage="Memuat daftar ruang kelas..."
		onPageChange={handlePageChange}
	>
		{#snippet item(row: RuangKelas)}
			<article class="card-elevated p-4 sm:p-5">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0 space-y-1">
						<h2 class="text-lg font-display font-semibold text-balance">{row.nama}</h2>
						<p class="text-sm text-muted">Kode {row.kode}</p>
						<p class="text-sm text-muted">{row.gedung}, lantai {row.lantai}</p>
					</div>
					<div class="shrink-0 text-right">
						<p class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Kapasitas</p>
						<p class="mt-1 font-display text-2xl leading-none">{row.kapasitas}</p>
					</div>
				</div>

				<div class="mt-4 flex flex-wrap gap-2">
					<span class="status-chip tone-slate">{formatAcademicLabel(row.tipe)}</span>
					<span class={getRuangStatusChip(row.status)}>{formatAcademicLabel(row.status)}</span>
				</div>

				<div class="mt-4 grid gap-2 sm:grid-cols-3">
					<a class="btn btn-outline btn-sm" href={`/ruang-kelas/timetable?ruangKelasId=${row.id}`}>Timetable</a>
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
		ariaLabel="Daftar ruang kelas"
		desktopOnly
		onPageChange={handlePageChange}
	>
			{#snippet actions(row: RuangKelas)}
				<a class="btn btn-sm btn-ghost" href={`/ruang-kelas/timetable?ruangKelasId=${row.id}`}>Timetable</a>
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
	title={editingData ? 'Edit Ruang Kelas' : 'Tambah Ruang Kelas'}
	onClose={() => closeFormModal()}
	size="md"
>
	<div class="space-y-4">
		{#if formNotice}
			<NoticeBanner notice={formNotice} />
		{/if}
		<RuangKelasForm
			data={editingData}
			onSubmit={handleSubmit}
			onCancel={() => closeFormModal()}
			loading={formLoading}
		/>
	</div>
</Modal>

<ConfirmDialog
	open={Boolean(deleteTarget)}
	title="Hapus Ruang Kelas"
	description="Ruang kelas akan dihapus dari master data ruang. Tindakan ini tidak dapat dibatalkan dari halaman ini."
	confirmLabel="Hapus ruang kelas"
	confirmTone="error"
	loading={deleteLoading === deleteTarget?.id}
	onConfirm={confirmDelete}
	onCancel={() => closeDeleteDialog()}
	summary={deleteTarget ? [{ label: 'Ruang kelas', value: deleteTarget.nama }, { label: 'Kode', value: deleteTarget.kode }, { label: 'Status', value: formatAcademicLabel(deleteTarget.status) }] : []}
/>
